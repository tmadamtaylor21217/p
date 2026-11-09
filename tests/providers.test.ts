import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	type ClaudeSessions,
	ensureFragment,
	fragmentStem,
	isClaudeCommand,
	loadProvidersConfig,
	type Provider,
	type ProvidersConfig,
	parseClaudeSessions,
	pickProvider,
	readSessionStatus,
	resolveOverflowSettings,
	sanitizeName,
	settingsFragmentPath,
} from "../src/utils/providers";

const FRAGMENT_DIR = "/Users/x/.claude/cchive-provider-fragments";

function provider(over: Partial<Provider> = {}): Provider {
	return {
		name: "DeepSeek",
		baseUrl: "https://api.deepseek.com/anthropic",
		token: "sk-test",
		maxConcurrent: 50,
		...over,
	};
}

function config(over: Partial<ProvidersConfig> = {}): ProvidersConfig {
	return { defaultMax: 3, providers: [provider()], ...over };
}

describe("sanitizeName", () => {
	test("保留安全字符", () => {
		expect(sanitizeName("DeepSeek")).toBe("DeepSeek");
		expect(sanitizeName("deep-seek_2")).toBe("deep-seek_2");
	});

	test("非法字符替换为 -，防路径穿越", () => {
		expect(sanitizeName("Deep Seek/../etc")).toBe("Deep-Seek----etc");
	});

	test("中文等 Unicode 字母保留（与 CCHive Rust 口径一致）", () => {
		expect(sanitizeName("中文")).toBe("中文");
	});

	test("净化后为空时回退 provider", () => {
		expect(sanitizeName("")).toBe("provider");
	});
});

describe("isClaudeCommand", () => {
	test("裸命令 / 绝对路径 / 带参数都算", () => {
		expect(isClaudeCommand("claude")).toBe(true);
		expect(isClaudeCommand("/Users/x/.local/bin/claude")).toBe(true);
		expect(isClaudeCommand("claude --dangerously-skip-permissions")).toBe(true);
	});

	test("其他 TUI / shell 包裹 / 路径片段不算", () => {
		expect(isClaudeCommand("codex")).toBe(false);
		expect(isClaudeCommand("/bin/sh -c claude")).toBe(false);
		expect(isClaudeCommand("bun run claude")).toBe(false);
		expect(isClaudeCommand("grep claude")).toBe(false);
	});
});

describe("settingsFragmentPath", () => {
	test("--settings <path> 空格形式", () => {
		expect(
			settingsFragmentPath(
				`claude --dangerously-skip-permissions --settings ${FRAGMENT_DIR}/DeepSeek.json`,
			),
		).toBe(`${FRAGMENT_DIR}/DeepSeek.json`);
	});

	test("--settings=<path> 等号形式", () => {
		expect(settingsFragmentPath("claude --settings=/tmp/frag.json")).toBe(
			"/tmp/frag.json",
		);
	});

	test("引号包裹的参数可解析", () => {
		expect(settingsFragmentPath('claude "--settings" "/tmp/a b.json"')).toBe(
			"/tmp/a b.json",
		);
	});

	test("无 --settings 或值缺失 → null", () => {
		expect(settingsFragmentPath("claude --dangerously-skip-permissions")).toBe(
			null,
		);
		expect(settingsFragmentPath("claude --settings")).toBe(null);
	});
});

describe("fragmentStem", () => {
	test("片段目录下的 json → 片段名", () => {
		expect(fragmentStem(`${FRAGMENT_DIR}/DeepSeek.json`, FRAGMENT_DIR)).toBe(
			"DeepSeek",
		);
	});

	test("其他目录 / 非 json 不算 provider", () => {
		expect(fragmentStem("/tmp/DeepSeek.json", FRAGMENT_DIR)).toBe(null);
		expect(fragmentStem(`${FRAGMENT_DIR}/DeepSeek.txt`, FRAGMENT_DIR)).toBe(
			null,
		);
	});
});

describe("parseClaudeSessions", () => {
	const psOutput = [
		"  100 /Users/Apple/.local/bin/claude --dangerously-skip-permissions",
		"  101 claude --resume abc",
		`  102 /Users/Apple/.local/bin/claude -p --settings ${FRAGMENT_DIR}/DeepSeek.json`,
		`  103 claude --settings=${FRAGMENT_DIR}/Other.json`,
		"  104 bun run claude",
		"  105 /usr/bin/grep claude",
		"  106 /bin/sh -c claude",
		"  107 claude",
		"  108 claude --settings /tmp/not-fragment.json",
	].join("\n");

	test("首段 basename 为 claude 且未溢出到 provider 的计入默认渠道", () => {
		const sessions = parseClaudeSessions(psOutput, FRAGMENT_DIR);
		// 100/101/107/108 走默认渠道；102/103 已溢出到 provider、不占套餐并发；
		// 104（bun）、105（grep）、106（sh 包裹）不是 claude 进程
		expect(sessions.total).toBe(4);
	});

	test("按片段名统计各 provider 占用，非片段目录的 --settings 不归入 provider", () => {
		const sessions = parseClaudeSessions(psOutput, FRAGMENT_DIR);
		expect(sessions.overflow.get("DeepSeek")).toBe(1);
		expect(sessions.overflow.get("Other")).toBe(1);
		expect(sessions.overflow.has("not-fragment")).toBe(false);
	});

	test("空输出 → 0 会话", () => {
		expect(parseClaudeSessions("").total).toBe(0);
	});

	test("只统计 busy 会话：idle / shell / waiting / starting 都不占并发", () => {
		const status: Record<number, string> = {
			100: "idle",
			101: "idle",
			102: "busy",
			103: "shell",
			107: "waiting",
			108: "starting",
		};
		const sessions = parseClaudeSessions(
			psOutput,
			FRAGMENT_DIR,
			(pid) => status[pid] ?? null,
		);
		// 只剩 102（DeepSeek 片段，不算默认渠道）；103 状态 shell 不算
		expect(sessions.total).toBe(0);
		expect(sessions.overflow.get("DeepSeek")).toBe(1);
		expect(sessions.overflow.has("Other")).toBe(false);
	});

	test("读不到状态（null）的会话按空闲处理", () => {
		const sessions = parseClaudeSessions(psOutput, FRAGMENT_DIR, () => null);
		expect(sessions.total).toBe(0);
	});
});

describe("readSessionStatus（IO）", () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const d of tmpDirs.splice(0))
			rmSync(d, { recursive: true, force: true });
	});

	function sessionDir(): string {
		const dir = mkdtempSync(join(tmpdir(), "p-sessions-test-"));
		tmpDirs.push(dir);
		return dir;
	}

	test("读取 busy / idle", () => {
		const dir = sessionDir();
		writeFileSync(
			join(dir, "100.json"),
			JSON.stringify({ pid: 100, status: "busy" }),
		);
		writeFileSync(
			join(dir, "101.json"),
			JSON.stringify({ pid: 101, status: "idle" }),
		);
		expect(readSessionStatus(100, dir)).toBe("busy");
		expect(readSessionStatus(101, dir)).toBe("idle");
	});

	test("缺文件 / 损坏 / pid 对不上（pid 复用）→ null", () => {
		const dir = sessionDir();
		writeFileSync(join(dir, "102.json"), "{ not json");
		writeFileSync(
			join(dir, "103.json"),
			JSON.stringify({ pid: 999, status: "busy" }),
		);
		writeFileSync(join(dir, "104.json"), JSON.stringify({ pid: 104 }));
		expect(readSessionStatus(102, dir)).toBe(null);
		expect(readSessionStatus(103, dir)).toBe(null);
		expect(readSessionStatus(104, dir)).toBe(null);
		expect(readSessionStatus(105, dir)).toBe(null);
	});
});

describe("pickProvider", () => {
	const busy = (map: Record<string, number> = {}) =>
		new Map(Object.entries(map));

	test("默认渠道还有余量 → 不溢出", () => {
		expect(pickProvider(config(), 2, busy())).toBe(null);
	});

	test("恰好满载 → 选第一个可用 provider", () => {
		expect(pickProvider(config(), 3, busy())?.name).toBe("DeepSeek");
	});

	test("第一家满 → 落到第二家", () => {
		const cfg = config({
			defaultMax: 2,
			providers: [
				provider({ name: "a", maxConcurrent: 2 }),
				provider({ name: "b", maxConcurrent: 2 }),
			],
		});
		expect(pickProvider(cfg, 2, busy({ a: 2 }))?.name).toBe("b");
	});

	test("全部占满 → null（照旧挤默认渠道）", () => {
		const cfg = config({
			defaultMax: 1,
			providers: [provider({ name: "a", maxConcurrent: 1 })],
		});
		expect(pickProvider(cfg, 1, busy({ a: 1 }))).toBe(null);
	});

	test("配置不完整（缺 token / baseUrl / name）的条目跳过", () => {
		const cfg = config({
			defaultMax: 1,
			providers: [
				provider({ name: "no-token", token: "" }),
				provider({ name: "no-url", baseUrl: "" }),
				provider({ name: "", maxConcurrent: 5 }),
				provider({ name: "ok" }),
			],
		});
		expect(pickProvider(cfg, 1, busy())?.name).toBe("ok");
	});

	test("缺省 defaultMax=3 / maxConcurrent=50", () => {
		expect(
			pickProvider(
				{ providers: [provider({ maxConcurrent: undefined })] },
				2,
				busy(),
			),
		).toBe(null);
		expect(
			pickProvider(
				{ providers: [provider({ maxConcurrent: undefined })] },
				3,
				busy({ DeepSeek: 49 }),
			)?.name,
		).toBe("DeepSeek");
		expect(
			pickProvider(
				{ providers: [provider({ maxConcurrent: undefined })] },
				3,
				busy({ DeepSeek: 50 }),
			),
		).toBe(null);
	});

	test("providers 缺省 / 非数组 → null", () => {
		expect(pickProvider({ defaultMax: 1 }, 1, busy())).toBe(null);
		expect(
			pickProvider(
				{ defaultMax: 1, providers: "x" as unknown as Provider[] },
				1,
				busy(),
			),
		).toBe(null);
	});
});

describe("loadProvidersConfig（IO）", () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const d of tmpDirs.splice(0))
			rmSync(d, { recursive: true, force: true });
	});

	function tmpFile(content?: string): string {
		const dir = mkdtempSync(join(tmpdir(), "p-providers-test-"));
		tmpDirs.push(dir);
		const file = join(dir, "cchive-providers.json");
		if (content !== undefined) writeFileSync(file, content);
		return file;
	}

	test("正常解析", () => {
		const cfg = loadProvidersConfig(tmpFile(JSON.stringify(config())));
		expect(cfg?.defaultMax).toBe(3);
		expect(cfg?.providers?.[0]?.name).toBe("DeepSeek");
	});

	test("缺文件 → null", () => {
		expect(loadProvidersConfig(tmpFile())).toBe(null);
	});

	test("JSON 损坏 / 顶层为数组 → null", () => {
		expect(loadProvidersConfig(tmpFile("{ not json"))).toBe(null);
		expect(loadProvidersConfig(tmpFile("[]"))).toBe(null);
	});
});

describe("ensureFragment（IO）", () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const d of tmpDirs.splice(0))
			rmSync(d, { recursive: true, force: true });
	});

	function fragmentDir(): string {
		const dir = mkdtempSync(join(tmpdir(), "p-fragment-test-"));
		tmpDirs.push(dir);
		return join(dir, "cchive-provider-fragments");
	}

	test("写入 baseUrl/token 与全部模型映射，权限 0600", () => {
		const dir = fragmentDir();
		const path = ensureFragment(
			provider({
				model: "deepseek-flash[1m]",
				opusModel: "opus-x",
				sonnetModel: "sonnet-x",
				haikuModel: "haiku-x",
				subagentModel: "sub-x",
			}),
			dir,
		);
		expect(path).toBe(join(dir, "DeepSeek.json"));
		const body = JSON.parse(readFileSync(path, "utf8"));
		expect(body).toEqual({
			env: {
				ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
				ANTHROPIC_AUTH_TOKEN: "sk-test",
				ANTHROPIC_MODEL: "deepseek-flash[1m]",
				ANTHROPIC_DEFAULT_OPUS_MODEL: "opus-x",
				ANTHROPIC_DEFAULT_SONNET_MODEL: "sonnet-x",
				ANTHROPIC_DEFAULT_HAIKU_MODEL: "haiku-x",
				CLAUDE_CODE_SUBAGENT_MODEL: "sub-x",
			},
		});
		expect(statSync(path).mode & 0o777).toBe(0o600);
	});

	test("模型映射为空时不注入对应键", () => {
		const dir = fragmentDir();
		const path = ensureFragment(provider(), dir);
		const body = JSON.parse(readFileSync(path, "utf8"));
		expect(Object.keys(body.env)).toEqual([
			"ANTHROPIC_BASE_URL",
			"ANTHROPIC_AUTH_TOKEN",
		]);
	});

	test("幂等重写：配置变更后同一路径立即反映新值", () => {
		const dir = fragmentDir();
		const path = ensureFragment(provider(), dir);
		ensureFragment(provider({ token: "sk-new", model: "m2" }), dir);
		const body = JSON.parse(readFileSync(path, "utf8"));
		expect(body.env.ANTHROPIC_AUTH_TOKEN).toBe("sk-new");
		expect(body.env.ANTHROPIC_MODEL).toBe("m2");
	});
});

describe("resolveOverflowSettings（IO）", () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const d of tmpDirs.splice(0))
			rmSync(d, { recursive: true, force: true });
	});

	function paths(): { configPath: string; fragmentDir: string } {
		const dir = mkdtempSync(join(tmpdir(), "p-overflow-test-"));
		tmpDirs.push(dir);
		return {
			configPath: join(dir, "cchive-providers.json"),
			fragmentDir: join(dir, "fragments"),
		};
	}

	function sessions(total: number, overflow: Record<string, number> = {}) {
		return {
			total,
			overflow: new Map(Object.entries(overflow)),
		} satisfies ClaudeSessions;
	}

	test("满载 → 选中 provider 并生成片段", async () => {
		const p = paths();
		writeFileSync(p.configPath, JSON.stringify(config()));
		const sel = await resolveOverflowSettings({ ...p, sessions: sessions(3) });
		expect(sel?.provider.name).toBe("DeepSeek");
		expect(sel?.settingsPath).toBe(join(p.fragmentDir, "DeepSeek.json"));
		expect(existsSync(sel?.settingsPath ?? "")).toBe(true);
	});

	test("未满载 → null（不生成片段）", async () => {
		const p = paths();
		writeFileSync(p.configPath, JSON.stringify(config()));
		expect(await resolveOverflowSettings({ ...p, sessions: sessions(2) })).toBe(
			null,
		);
		expect(existsSync(p.fragmentDir)).toBe(false);
	});

	test("配置缺失 → null（静默走默认渠道）", async () => {
		const p = paths();
		expect(
			await resolveOverflowSettings({ ...p, sessions: sessions(99) }),
		).toBe(null);
	});

	test("provider 全满 → null", async () => {
		const p = paths();
		writeFileSync(
			p.configPath,
			JSON.stringify(config({ providers: [provider({ maxConcurrent: 1 })] })),
		);
		expect(
			await resolveOverflowSettings({
				...p,
				sessions: sessions(3, { DeepSeek: 1 }),
			}),
		).toBe(null);
	});
});
