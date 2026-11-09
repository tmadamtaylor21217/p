/**
 * 模型 provider 溢出选路（与 CCHive 同口径）：默认渠道（~/.claude/settings.json
 * env 块里的套餐，有并发上限）满载后，把新会话溢出到
 * ~/.claude/cchive-providers.json 配置的 API provider。
 *
 * 关键协议（Mac 实测 2026-10-20）：cc 启动时用 settings.json 的 env 块**覆盖**
 * 继承的进程环境变量，spawn 时直接传 ANTHROPIC_BASE_URL 会被套餐配置盖掉；
 * 唯一覆盖通道是命令行 `--settings <片段>`（优先级高于 user settings.json）。
 * 片段落 ~/.claude/cchive-provider-fragments/<name>.json（0600，幂等重写），
 * 与 CCHive 共用同格式同目录。
 *
 * 计数是全账号口径：系统里所有 **正在生成、且仍在默认渠道上** 的 claude
 * 会话（外部终端 / CCHive / p 拉起的）挤同一个套餐并发池，故用 ps 全局扫描
 * + cc 自己维护的会话状态（~/.claude/sessions/<pid>.json）筛出 status=busy
 * 的会话；已带 provider 片段的会话走 provider 端点，不占套餐并发。
 * 停在输入框的空闲会话不占套餐并发（套餐限制的是同时在途的请求数），
 * 只数进程存在会让开着的旧标签页把并发数虚占满、误溢出到 DeepSeek。
 */

import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import fse from "fs-extra";

/** provider 配置（camelCase，与 CCHive 的 serde rename_all 输出一致） */
export interface Provider {
	/** 显示名，同时是片段文件名 */
	name: string;
	/** Anthropic 兼容端点（如 https://api.deepseek.com/anthropic） */
	baseUrl: string;
	/** API Key（注入 ANTHROPIC_AUTH_TOKEN） */
	token: string;
	model?: string;
	opusModel?: string;
	sonnetModel?: string;
	haikuModel?: string;
	subagentModel?: string;
	/** 该 provider 允许的并发会话数（按量计费，默认宽裕） */
	maxConcurrent?: number;
}

export interface ProvidersConfig {
	/** 默认渠道（继承 settings.json）的并发上限，满载才溢出 */
	defaultMax?: number;
	providers?: Provider[];
}

/**
 * 一次 ps 扫描的结果：默认渠道正在生成的会话数（不含已溢出到 provider
 * 的，它们不占套餐并发）+ 各 provider 片段名下的会话数
 */
export interface ClaudeSessions {
	total: number;
	overflow: Map<string, number>;
}

export interface OverflowSelection {
	provider: Provider;
	/** 新建/重写的 --settings 片段路径 */
	settingsPath: string;
}

export const PROVIDERS_PATH = join(
	homedir(),
	".claude",
	"cchive-providers.json",
);
export const FRAGMENT_DIR = join(
	homedir(),
	".claude",
	"cchive-provider-fragments",
);
/** cc 维护的活会话注册表：<pid>.json（含 status / sessionId / cwd） */
export const SESSION_DIR = join(homedir(), ".claude", "sessions");

const DEFAULT_MAX = 3;
const DEFAULT_MAX_CONCURRENT = 50;

/** JSON 里的数值不可信：非正整数一律回退缺省 */
function positiveInt(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? Math.floor(value)
		: fallback;
}

/** name/baseUrl/token 齐备才算配置完整（模型映射可空＝交给端点自动映射） */
function isUsable(p: Provider): boolean {
	return (
		typeof p.name === "string" &&
		p.name.length > 0 &&
		typeof p.baseUrl === "string" &&
		p.baseUrl.length > 0 &&
		typeof p.token === "string" &&
		p.token.length > 0
	);
}

/**
 * 读取 provider 配置。缺文件 / 解析失败 / 结构异常 → null（静默走默认渠道，
 * 零回归）。
 */
export function loadProvidersConfig(
	configPath = PROVIDERS_PATH,
): ProvidersConfig | null {
	try {
		const parsed: unknown = JSON.parse(fse.readFileSync(configPath, "utf8"));
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as ProvidersConfig;
		}
	} catch {
		// 缺文件 / JSON 损坏 → 不启用溢出
	}
	return null;
}

/**
 * 片段文件名净化：只留安全字符，防路径穿越。字母/数字判定用 Unicode 属性，
 * 与 CCHive 的 Rust 实现（char::is_alphanumeric）同口径，中文 provider 名
 * 两侧生成同一个片段文件。
 */
export function sanitizeName(name: string): string {
	const cleaned = name.replace(/[^\p{L}\p{N}_-]/gu, "-");
	return cleaned || "provider";
}

/** 命令首段（可执行文件）的 basename，如 /Users/x/.local/bin/claude → claude */
function commandBasename(command: string): string {
	const first = command.trim().split(/\s+/)[0] ?? "";
	return first.split("/").pop() ?? "";
}

/** 该命令行是否在拉起 claude（首段 basename == claude） */
export function isClaudeCommand(command: string): boolean {
	return commandBasename(command) === "claude";
}

/** 按 shell 引号规则切分命令行（ps 里可能带引号包裹的含空格参数） */
function tokenizeCommand(command: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let quote: string | null = null;
	for (const ch of command) {
		if (quote) {
			if (ch === quote) quote = null;
			else current += ch;
		} else if (ch === '"' || ch === "'") {
			quote = ch;
		} else if (/\s/.test(ch)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
		} else {
			current += ch;
		}
	}
	if (current) tokens.push(current);
	return tokens;
}

/**
 * 从命令行提取 --settings 片段路径（支持 `--settings <path>` 与
 * `--settings=<path>`；路径含空格时由 shell 引号包裹，分词后仍可取到）。
 */
export function settingsFragmentPath(command: string): string | null {
	const tokens = tokenizeCommand(command);
	for (const [i, token] of tokens.entries()) {
		if (token === "--settings") {
			const next = tokens[i + 1];
			return next && next.length > 0 ? next : null;
		}
		if (token.startsWith("--settings=")) {
			const value = token.slice("--settings=".length);
			return value.length > 0 ? value : null;
		}
	}
	return null;
}

/** 片段路径 → 片段名（仅认片段目录下的 .json；其他 --settings 文件不算 provider） */
export function fragmentStem(
	fragmentPath: string,
	fragmentDir = FRAGMENT_DIR,
): string | null {
	if (dirname(fragmentPath) !== fragmentDir) return null;
	const base = basename(fragmentPath);
	return base.endsWith(".json") ? base.slice(0, -".json".length) : null;
}

/**
 * 读某 pid 的会话状态（cc 自己维护，值域：busy / idle / shell / waiting /
 * starting …）。busy＝正在生成或执行工具，会真的发出模型请求；idle 停在
 * 输入框、shell 在跑用户 shell、waiting 等确认，都不占套餐并发。
 * 文件缺失 / 损坏 / 记录的 pid 对不上（进程已退、pid 复用）→ null。
 */
export function readSessionStatus(
	pid: number,
	sessionDir = SESSION_DIR,
): string | null {
	try {
		const parsed: unknown = JSON.parse(
			fse.readFileSync(join(sessionDir, `${pid}.json`), "utf8"),
		);
		if (!parsed || typeof parsed !== "object") return null;
		const record = parsed as { pid?: unknown; status?: unknown };
		if (record.pid !== pid) return null;
		return typeof record.status === "string" ? record.status : null;
	} catch {
		return null;
	}
}

/**
 * 解析 `ps -eo pid=,command=` 输出，只统计 statusOf(pid) === "busy" 的会话
 * （默认全算，供读不到状态的场景与单测使用）。首段 basename == claude 的
 * 进程才参与（不排除 p 自身——p 启动瞬间还没有子 claude 进程）；带
 * `--settings <片段目录>/<name>.json` 的会话按片段名归入该 provider，
 * 且不计入默认渠道 total（走 provider 的请求不占套餐并发）。
 */
export function parseClaudeSessions(
	psOutput: string,
	fragmentDir = FRAGMENT_DIR,
	statusOf: (pid: number) => string | null = () => "busy",
): ClaudeSessions {
	const overflow = new Map<string, number>();
	let total = 0;

	for (const line of psOutput.split("\n")) {
		const matched = /^\s*(\d+)\s+(.+)$/.exec(line);
		if (!matched) continue;
		const pid = Number(matched[1]);
		const command = matched[2] ?? "";
		if (!isClaudeCommand(command)) continue;
		if (statusOf(pid) !== "busy") continue;

		const settingsPath = settingsFragmentPath(command);
		const stem = settingsPath ? fragmentStem(settingsPath, fragmentDir) : null;
		if (stem) {
			overflow.set(stem, (overflow.get(stem) ?? 0) + 1);
			continue;
		}
		total++;
	}

	return { total, overflow };
}

/**
 * 系统里正在生成的 claude 会话数 + 各 provider 占用（ps 不可用 → 0，走默认渠道）
 */
export async function scanClaudeSessions(
	sessionDir = SESSION_DIR,
	fragmentDir = FRAGMENT_DIR,
): Promise<ClaudeSessions> {
	if (process.platform === "win32") {
		return { total: 0, overflow: new Map() };
	}
	try {
		const proc = Bun.spawn(["ps", "-eo", "pid=,command="], {
			stdin: "ignore",
			stdout: "pipe",
			stderr: "ignore",
		});
		const output = await new Response(proc.stdout).text();
		await proc.exited;
		return parseClaudeSessions(output, fragmentDir, (pid) =>
			readSessionStatus(pid, sessionDir),
		);
	} catch {
		return { total: 0, overflow: new Map() };
	}
}

/**
 * 选路：默认渠道还有余量 → null（照旧继承）；否则按序找第一个配置完整且
 * 未满的 provider。全满也返回 null——照旧挤默认渠道比启动失败强。
 */
export function pickProvider(
	config: ProvidersConfig,
	totalBusy: number,
	overflowBusy: ReadonlyMap<string, number>,
): Provider | null {
	if (totalBusy < positiveInt(config.defaultMax, DEFAULT_MAX)) return null;
	const providers = Array.isArray(config.providers) ? config.providers : [];
	return (
		providers.find((p) => {
			if (!isUsable(p)) return false;
			const busy = overflowBusy.get(sanitizeName(p.name)) ?? 0;
			return busy < positiveInt(p.maxConcurrent, DEFAULT_MAX_CONCURRENT);
		}) ?? null
	);
}

/**
 * 生成（重写）provider 的 --settings 片段，返回路径。每次选路都重写：
 * 文件极小，换来「改完配置立即生效」不用记失效逻辑；权限幂等收敛到 0600。
 */
export function ensureFragment(
	provider: Provider,
	fragmentDir = FRAGMENT_DIR,
): string {
	fse.mkdirSync(fragmentDir, { recursive: true });

	const env: Record<string, string> = {
		ANTHROPIC_BASE_URL: provider.baseUrl,
		ANTHROPIC_AUTH_TOKEN: provider.token,
	};
	const models: Array<[string, string | undefined]> = [
		["ANTHROPIC_MODEL", provider.model],
		["ANTHROPIC_DEFAULT_OPUS_MODEL", provider.opusModel],
		["ANTHROPIC_DEFAULT_SONNET_MODEL", provider.sonnetModel],
		["ANTHROPIC_DEFAULT_HAIKU_MODEL", provider.haikuModel],
		["CLAUDE_CODE_SUBAGENT_MODEL", provider.subagentModel],
	];
	for (const [key, value] of models) {
		if (value) env[key] = value;
	}

	const settingsPath = join(fragmentDir, `${sanitizeName(provider.name)}.json`);
	fse.writeFileSync(settingsPath, JSON.stringify({ env }), { mode: 0o600 });
	// writeFileSync 的 mode 只在新建时生效，已有文件需显式收敛权限
	fse.chmodSync(settingsPath, 0o600);
	return settingsPath;
}

/**
 * spawn claude 前的溢出决策：默认渠道满载 → 选中 provider 并确保其
 * --settings 片段就绪。任何异常（缺配置 / ps 失败 / 全部占满 / 写片段失败）
 * 都返回 null，静默走默认渠道。
 */
export async function resolveOverflowSettings(
	options: {
		configPath?: string;
		fragmentDir?: string;
		/** 测试注入用；缺省实时 ps 扫描 */
		sessions?: ClaudeSessions;
	} = {},
): Promise<OverflowSelection | null> {
	const config = loadProvidersConfig(options.configPath);
	if (!config) return null;

	const sessions = options.sessions ?? (await scanClaudeSessions());
	const provider = pickProvider(config, sessions.total, sessions.overflow);
	if (!provider) return null;

	try {
		return {
			provider,
			settingsPath: ensureFragment(provider, options.fragmentDir),
		};
	} catch {
		// 片段写不出来 → 照旧挤默认渠道，不让启动失败
		return null;
	}
}
