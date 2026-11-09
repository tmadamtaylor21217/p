import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { $ } from "bun";
import pc from "picocolors";
import { loadConfig } from "../core/config";
import { maybeWatchCchiveSync } from "./cchive";
import { P_ROOT } from "./paths";
import { isClaudeCommand, resolveOverflowSettings } from "./providers";
import { brand, printInfo } from "./ui";

// IDE 缓存文件路径
const IDE_CACHE_PATH = join(P_ROOT, "ide-cache.json");

// 内存缓存
let ideCache: Record<string, string> | null = null;

/**
 * 加载 IDE 缓存
 */
function loadIDECache(): Record<string, string> {
	if (ideCache) return ideCache;
	if (!existsSync(IDE_CACHE_PATH)) {
		ideCache = {};
		return ideCache;
	}
	try {
		ideCache =
			(JSON.parse(readFileSync(IDE_CACHE_PATH, "utf-8")) as Record<
				string,
				string
			>) ?? {};
		return ideCache;
	} catch {
		ideCache = {};
		return ideCache;
	}
}

/**
 * 保存 IDE 缓存
 */
function saveIDECache(): void {
	writeFileSync(IDE_CACHE_PATH, JSON.stringify(ideCache, null, 2));
}

/**
 * 在指定目录执行命令（显示命令和输出）
 */
export async function execInDir(
	command: string,
	cwd: string,
	options: { silent?: boolean; captureStderr?: boolean } = {},
): Promise<{ success: boolean; output: string; stderr?: string }> {
	if (!options.silent) {
		console.log(pc.dim("  $ ") + brand.secondary(command));
	}

	try {
		const isWindows = process.platform === "win32";
		const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
		const shellArgs = isWindows ? ["/c"] : ["-c"];

		const proc = Bun.spawn([shell, ...shellArgs, command], {
			cwd,
			stdin: "inherit",
			stdout: "inherit",
			stderr: options.captureStderr ? "pipe" : "inherit",
			env: {
				...process.env,
				FORCE_COLOR: "3",
			},
		});

		let stderrOutput = "";
		if (options.captureStderr && proc.stderr) {
			const reader = proc.stderr.getReader();
			const decoder = new TextDecoder();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				stderrOutput += decoder.decode(value, { stream: true });
				process.stderr.write(value);
			}
		}

		const exitCode = await proc.exited;

		return {
			success: exitCode === 0,
			output: "",
			stderr: stderrOutput,
		};
	} catch (error) {
		const err = error as Error;
		return { success: false, output: err.message };
	}
}

/**
 * 在指定目录执行命令并捕获输出（用于需要解析输出的场景）
 */
export async function execAndCapture(
	command: string,
	cwd: string,
): Promise<{ success: boolean; output: string; error: string }> {
	try {
		const isWindows = process.platform === "win32";
		const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
		const shellArgs = isWindows ? ["/c"] : ["-c"];

		const proc = Bun.spawn([shell, ...shellArgs, command], {
			cwd,
			stdio: ["pipe", "pipe", "pipe"],
			env: process.env,
		});

		const exitCode = await proc.exited;
		const output = await new Response(proc.stdout).text();
		const errorOutput = await new Response(proc.stderr).text();

		return {
			success: exitCode === 0,
			output: output.trim(),
			error: errorOutput.trim(),
		};
	} catch (error) {
		const err = error as Error;
		return { success: false, output: "", error: err.message };
	}
}

// 终端 TUI 类命令：需前台继承 stdio 运行，且位置参数不是路径（如 claude [prompt]）
const TUI_COMMANDS = new Set(["claude", "codex", "gemini", "aider"]);

/**
 * 判断是否为终端 TUI 命令（如 claude），调用方需避免在其运行期间使用 spinner
 */
export function isTUICommand(ide: string): boolean {
	return TUI_COMMANDS.has(ide.trim().split(/\s+/)[0] ?? "");
}

// 支持"位置参数为初始 prompt"前台启动的 TUI 命令
// （--dangerously-skip-permissions 是 claude 专属 flag，故白名单仅 claude；codex/gemini 实测后再加）
const PROMPT_TUI_COMMANDS = new Set(["claude"]);

/**
 * 判断 TUI 命令是否支持带初始 prompt 启动（如 claude "需求描述"）
 */
export function supportsPromptArg(ide: string): boolean {
	return PROMPT_TUI_COMMANDS.has(ide.trim().split(/\s+/)[0] ?? "");
}

/** POSIX shell 单引号转义（片段路径含空格/引号时安全） */
function shellQuote(value: string): string {
	return `'${value.replace(/'/g, "'\\''")}'`;
}

/**
 * 用 IDE 打开路径
 */
export async function openWithIDE(
	ide: string,
	path: string,
	fuzzy = false,
): Promise<{ resolved: string }> {
	const resolved = fuzzy ? resolveCommand(ide) : ide;

	// TUI 命令（如 claude）以 cwd 进入目录前台运行，直到会话退出
	if (isTUICommand(resolved)) {
		// 路径为文件时（如 config.yaml）进入其所在目录
		let cwd = path;
		try {
			if (statSync(path).isFile()) cwd = dirname(path);
		} catch {
			// 路径不存在时由下方 existsSync 兜底
		}
		if (!existsSync(cwd)) {
			throw new Error(`路径不存在: ${cwd}`);
		}

		const isWindows = process.platform === "win32";
		const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
		const shellArgs = isWindows ? ["/c"] : ["-c"];

		// TUI 启动的新会话自动同步到 CCHive（cchiveSync 配置，默认开）——
		// 所有经 openWithIDE 打开 TUI 的命令（new/open/cc/recent/clone 等）统一在此覆盖
		const watcher = maybeWatchCchiveSync(loadConfig().cchiveSync, cwd);

		// 默认渠道（套餐）全账号并发满 → 溢出到配置的 API provider。注入只能走
		// --settings 片段：settings.json 的 env 块会覆盖继承的进程环境变量。
		// 仅 claude 走这条（codex/gemini/aider 不吃该参数，也没有 provider 配置）。
		const overflow = isClaudeCommand(resolved)
			? await resolveOverflowSettings()
			: null;
		const command = overflow
			? `${resolved} --settings ${shellQuote(overflow.settingsPath)}`
			: resolved;
		if (overflow) {
			printInfo(
				`默认渠道已满，溢出到 ${brand.primary(overflow.provider.name)}`,
			);
		}

		try {
			const proc = Bun.spawn([shell, ...shellArgs, command], {
				cwd,
				stdin: "inherit",
				stdout: "inherit",
				stderr: "inherit",
				env: process.env,
			});
			await proc.exited;
			return { resolved };
		} catch {
			throw new Error(
				`无法打开 ${ide}，请确保 ${resolved} 命令已安装并添加到 PATH 环境变量。`,
			);
		} finally {
			watcher?.stop();
		}
	}

	try {
		await $`${resolved} ${path}`.quiet();
		return { resolved };
	} catch {
		throw new Error(
			`无法打开 ${ide}，请确保 ${resolved} 命令已安装并添加到 PATH 环境变量。`,
		);
	}
}

/**
 * 在 PATH 中查找以 prefix 开头的命令（带缓存）
 */
function resolveCommand(prefix: string): string {
	const cache = loadIDECache();

	if (cache[prefix]) {
		return cache[prefix];
	}

	const isWindows = process.platform === "win32";
	const pathEnv = process.env.PATH || "";
	const pathSep = isWindows ? ";" : ":";
	const paths = pathEnv.split(pathSep);

	const candidates: string[] = [];

	for (const dir of paths) {
		try {
			const files = readdirSync(dir);
			for (const file of files) {
				const name =
					isWindows && file.endsWith(".exe") ? file.slice(0, -4) : file;
				if (name.startsWith(prefix)) {
					candidates.push(name);
				}
			}
		} catch {
			// 目录不存在或无权限，跳过
		}
	}

	const resolved = candidates.includes(prefix)
		? prefix
		: candidates[0] || prefix;

	if (resolved !== prefix) {
		cache[prefix] = resolved;
		saveIDECache();
	}

	return resolved;
}

/**
 * 检查命令是否存在
 */
export async function commandExists(command: string): Promise<boolean> {
	try {
		await $`which ${command}`.quiet();
		return true;
	} catch {
		return false;
	}
}

/**
 * 移动目录到系统回收站（macOS / Linux）
 */
export async function moveToTrash(path: string): Promise<boolean> {
	if (process.platform === "darwin") {
		const proc = Bun.spawn(
			[
				"osascript",
				"-e",
				`tell application "Finder" to move POSIX file "${path}" to trash`,
			],
			{
				stdio: ["pipe", "pipe", "pipe"],
			},
		);
		return (await proc.exited) === 0;
	}

	const trashCmds = ["gio trash", "trash-put", "trash"];
	for (const cmd of trashCmds) {
		if (
			await commandExists(
				cmd === "gio trash"
					? "gio"
					: cmd === "trash-put"
						? "trash-put"
						: "trash",
			)
		) {
			const args = cmd === "gio trash" ? ["trash", path] : [path];
			const bin = cmd === "gio trash" ? "gio" : cmd;
			const proc = Bun.spawn([bin, ...args], {
				stdio: ["pipe", "pipe", "pipe"],
			});
			return (await proc.exited) === 0;
		}
	}

	return false;
}
