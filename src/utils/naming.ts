/**
 * 需求描述命名：判定输入类型、调用本地 claude CLI（claude -p）生成候选项目名（附命名解释）
 */

import { resolveOverflowSettings } from "./providers";

const KEBAB_RE = /^[a-z][a-z0-9-]*$/;

/** 候选项目名 + 一句简短的命名解释 */
export interface NameSuggestion {
	name: string;
	reason: string;
}

/** 解释超长会撑爆选择列表一行，截断保护 */
const MAX_REASON_LEN = 20;

function truncateReason(reason: string): string {
	const t = reason.trim();
	return t.length > MAX_REASON_LEN ? `${t.slice(0, MAX_REASON_LEN)}…` : t;
}

/**
 * 判定输入是项目名还是自然语言需求描述：
 * 含非 ASCII 可打印字符（中文等）或含空白（多个词）→ 描述
 */
export function isDescriptionInput(input: string): boolean {
	const trimmed = input.trim();
	if (!trimmed) return false;
	if (/[^\x20-\x7E]/.test(trimmed)) return true;
	return /\s/.test(trimmed);
}

// 编号前缀后空白可有可无（1.foo）；bullet/引用后必须有空白，避免误剥 "-bot" 这类非法名
const LIST_PREFIX_RE = /^(?:\d+[.)、]\s*|[-*•·]\s+|>+\s+)/;
const QUOTE_PAIRS = [
	/^`(.*)`$/,
	/^"(.*)"$/,
	/^'(.*)'$/,
	/^“(.*)”$/,
	/^「(.*)」$/,
	/^『(.*)』$/,
];

// "name — 解释" / "name：解释" 等显式分隔格式（- 有歧义不列入，交给空格路径）
const NAME_REASON_SEP_RE =
	/^["'`‘“「]?([a-z][a-z0-9-]*)["'`'”」]?\s*(?:—|–|:|：|\||=>)\s*(.+)$/;

/** 解析单行：跳过 code fence/空行，剥列表前缀与成对引号；返回 name（可带解释）或 null */
function parseLine(line: string): NameSuggestion | null {
	let s = line.trim();
	if (!s || s.startsWith("```")) return null;
	s = s.replace(LIST_PREFIX_RE, "");
	for (const re of QUOTE_PAIRS) {
		const matched = s.match(re);
		if (matched?.[1]) {
			s = matched[1].trim();
			break;
		}
	}
	// 整行就是一个名称
	if (KEBAB_RE.test(s)) return { name: s, reason: "" };
	// "name — 解释" / "name：解释"
	const sep = s.match(NAME_REASON_SEP_RE);
	if (sep?.[1] && KEBAB_RE.test(sep[1])) {
		return { name: sep[1], reason: truncateReason(sep[2] ?? "") };
	}
	// "name 解释"（首 token 是合法名，其余视为解释；顺带清理 "- 解释" 残留前缀）
	const spaced = s.match(/^(\S+)\s+(.+)$/);
	if (spaced?.[1] && KEBAB_RE.test(spaced[1])) {
		return {
			name: spaced[1],
			reason: truncateReason((spaced[2] ?? "").replace(/^[-–—:：|\s]+/, "")),
		};
	}
	return null;
}

/** JSON 数组元素 → 候选名（string 视为无解释，对象取 name/reason） */
function parseJsonItem(item: unknown): NameSuggestion | null {
	if (typeof item === "string") {
		return KEBAB_RE.test(item) ? { name: item, reason: "" } : null;
	}
	if (item && typeof item === "object" && "name" in item) {
		const { name, reason } = item as { name?: unknown; reason?: unknown };
		if (typeof name !== "string" || !KEBAB_RE.test(name)) return null;
		return {
			name,
			reason: typeof reason === "string" ? truncateReason(reason) : "",
		};
	}
	return null;
}

function dedupe(items: NameSuggestion[], max: number): NameSuggestion[] {
	const seen = new Set<string>();
	const out: NameSuggestion[] = [];
	for (const item of items) {
		if (seen.has(item.name)) continue;
		seen.add(item.name);
		out.push(item);
		if (out.length >= max) break;
	}
	return out;
}

/**
 * 从 claude -p 的原始 stdout 解析候选项目名及解释（容忍脏输出），
 * 返回按 name 去重的列表，最多 max 个
 */
export function parseSuggestions(raw: string, max = 5): NameSuggestion[] {
	const trimmed = raw.trim();
	if (!trimmed) return [];

	// 优先按 JSON 数组采纳（容忍 code fence 包裹），元素可为 "name" 或 {name, reason}
	const withoutFences = trimmed
		.split("\n")
		.filter((line) => !line.trim().startsWith("```"))
		.join("\n");
	try {
		const parsed: unknown = JSON.parse(withoutFences);
		if (Array.isArray(parsed)) {
			return dedupe(
				parsed
					.map(parseJsonItem)
					.filter((x): x is NameSuggestion => x !== null),
				max,
			);
		}
	} catch {
		// 非 JSON，走逐行解析
	}

	const items: NameSuggestion[] = [];
	for (const line of trimmed.split("\n")) {
		const item = parseLine(line);
		if (item) items.push(item);
	}
	return dedupe(items, max);
}

/** parseSuggestions 的 name-only 投影（旧接口保留） */
export function parseNameSuggestions(raw: string, max = 5): string[] {
	return parseSuggestions(raw, max).map((s) => s.name);
}

const NAME_RULES = [
	"- 只使用小写英文字母、数字和连字符",
	"- 必须以字母开头",
	"- 简洁、有意义、好记，优先 1-2 个词",
	"- 数字直接跟在单词后面（如 blog2 而非 blog-2）",
].join("\n");

/** 构建命名 prompt；exclude 为"换一批"时要排除的已生成名称 */
export function buildNamingPrompt(
	description: string,
	exclude: string[] = [],
): string {
	const parts = [
		`根据以下项目需求生成 5 个项目名称（kebab-case），并为每个名称配一句简短中文解释（不超过 12 个字，说明命名思路）：\n${description}`,
		`命名规则：\n${NAME_RULES}`,
		'输出格式：只输出一个 JSON 数组，每项形如 {"name": "项目名", "reason": "解释"}，不要 markdown 代码块，不要编号，不要任何其他文字。',
	];
	if (exclude.length > 0) {
		parts.push(`不要使用以下已生成过的名称：\n${exclude.join("\n")}`);
	}
	return parts.join("\n\n");
}

export type ClaudeNamesResult =
	| { ok: true; suggestions: NameSuggestion[] }
	| { ok: false; error: string };

/**
 * 调用本地 claude CLI 非交互模式（claude -p）生成候选名。
 * 不 throw，失败以返回值降级，由调用方决定回退方式。
 */
export async function generateNamesViaClaude(
	prompt: string,
	timeoutMs = 60_000,
): Promise<ClaudeNamesResult> {
	// 默认渠道满载时命名助手同样走溢出，否则 -p 调用会被套餐并发限制挡住
	const overflow = await resolveOverflowSettings();
	const args = ["claude", "-p", prompt];
	if (overflow) args.push("--settings", overflow.settingsPath);

	const proc = Bun.spawn(args, {
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
		env: process.env,
	});

	let timedOut = false;
	let killTimer: ReturnType<typeof setTimeout> | undefined;
	const timer = setTimeout(() => {
		timedOut = true;
		proc.kill();
		// SIGTERM 2s 宽限后强杀
		killTimer = setTimeout(() => proc.kill(9), 2000);
	}, timeoutMs);

	try {
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);

		if (timedOut) {
			return {
				ok: false,
				error: `claude 命名超时（${Math.round(timeoutMs / 1000)}s）`,
			};
		}
		if (exitCode !== 0) {
			const tail = stderr.trim().slice(-200);
			return { ok: false, error: tail || `claude 退出码 ${exitCode}` };
		}

		const suggestions = parseSuggestions(stdout);
		if (suggestions.length === 0) {
			return { ok: false, error: "claude 未生成有效名称" };
		}
		return { ok: true, suggestions };
	} catch (error) {
		return { ok: false, error: (error as Error).message };
	} finally {
		clearTimeout(timer);
		if (killTimer) clearTimeout(killTimer);
	}
}
