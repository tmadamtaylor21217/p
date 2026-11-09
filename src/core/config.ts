import { dirname, join } from "node:path";
import fse from "fs-extra";
import { parse } from "yaml";
import type { Config } from "../types";
import {
	CONFIG_PATH,
	HOOKS_DIR,
	P_ROOT,
	PROJECTS_DIR,
	TEMPLATES_DIR,
} from "../utils/paths";
import { printInfo } from "../utils/ui";

function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
	const result = { ...base } as Record<string, unknown>;
	for (const key of Object.keys(override)) {
		const bVal = result[key];
		const oVal = override[key];
		if (
			typeof oVal === "object" &&
			oVal !== null &&
			!Array.isArray(oVal) &&
			typeof bVal === "object" &&
			bVal !== null &&
			!Array.isArray(bVal)
		) {
			result[key] = deepMerge(
				bVal as Record<string, unknown>,
				oVal as Record<string, unknown>,
			);
		} else {
			result[key] = oVal;
		}
	}
	return result as T;
}

function getDefaultConfigPath(): string {
	const execPath = process.argv[1];
	if (!execPath) return "";
	return join(dirname(execPath), "config.yaml");
}

/**
 * 确保 p 目录结构已初始化
 */
export async function ensureInitialized(): Promise<void> {
	const dirs = [P_ROOT, PROJECTS_DIR, TEMPLATES_DIR, HOOKS_DIR];
	for (const dir of dirs) {
		await fse.ensureDir(dir);
	}

	// 只在用户配置不存在时才复制默认配置（首次安装）
	if (!(await fse.pathExists(CONFIG_PATH))) {
		const defaultConfigPath = getDefaultConfigPath();
		if (await fse.pathExists(defaultConfigPath)) {
			await fse.copyFile(defaultConfigPath, CONFIG_PATH);
		}
	}
}

/**
 * 读取配置文件（智能合并：默认配置为基础，用户配置覆盖）
 */
export function loadConfig(): Config {
	if (!fse.existsSync(CONFIG_PATH)) {
		throw new Error("配置文件不存在，请运行 p config 创建配置文件");
	}

	try {
		const userContent = fse.readFileSync(CONFIG_PATH, "utf-8");
		const userConfig = (parse(userContent) || {}) as Record<string, unknown>;

		// 读取默认配置，合并新增的 keys
		let defaultConfig: Record<string, unknown> = {};
		const defaultConfigPath = getDefaultConfigPath();
		if (defaultConfigPath && fse.existsSync(defaultConfigPath)) {
			const defaultContent = fse.readFileSync(defaultConfigPath, "utf-8");
			defaultConfig = (parse(defaultContent) || {}) as Record<string, unknown>;
		}

		// yaml 解析的动态结构，经 unknown 中转断言为 Config
		return deepMerge(defaultConfig, userConfig) as unknown as Config;
	} catch (error) {
		throw new Error(`配置文件解析失败: ${(error as Error).message}`);
	}
}

// 已废弃的顶层配置键（v1.25 移除 AI API 命名功能后不再读取，迁移时自动清理）
const DEPRECATED_CONFIG_KEYS = ["apiKey", "deepseekApiKey", "ai"];

/**
 * 从 config.yaml 文本中移除废弃的顶层键（连同前导注释与子块），保留其余内容与注释。
 * 纯文本处理，避免 yaml round-trip 丢失全部注释。
 */
export function stripDeprecatedKeys(
	content: string,
	keys: string[],
): { content: string; removed: string[] } {
	const lines = content.split("\n");
	const out: string[] = [];
	let pending: string[] = []; // 注释/空行缓冲，可能属于下一个键的前导说明
	let skipping = false; // 正在跳过废弃键的子块
	const removed: string[] = [];

	for (const line of lines) {
		const key = line.match(/^([A-Za-z_][\w-]*):/)?.[1]; // 顶层键行（无缩进）

		if (key && keys.includes(key)) {
			if (!removed.includes(key)) removed.push(key);
			// 丢弃前导注释：pending 中最后一个空行之后的连续注释行
			let cut = 0;
			for (let i = pending.length - 1; i >= 0; i--) {
				if (!pending[i]?.trim()) {
					cut = i + 1;
					break;
				}
			}
			out.push(...pending.slice(0, cut));
			pending = [];
			skipping = true;
			continue;
		}

		if (key) {
			out.push(...pending, line);
			pending = [];
			skipping = false;
			continue;
		}

		// 废弃键子块内的缩进行（子键/值/缩进注释）整体跳过
		if (skipping && /^[ \t]+\S/.test(line)) continue;

		if (line.trim() === "" || line.trimStart().startsWith("#")) {
			if (skipping) {
				// 废弃块内的空行直接跳过，避免删除区遗留连续空行
				if (line.trim() === "") continue;
				// 顶层注释（无缩进）结束子块跳过，视为下一键的前导注释
				skipping = false;
			}
			pending.push(line);
			continue;
		}

		// 缩进的值行，属于已落盘的键
		out.push(...pending, line);
		pending = [];
	}

	out.push(...pending);
	return { content: out.join("\n"), removed };
}

/**
 * 清理用户配置中废弃的键（一次性迁移，清理后不再触发）
 */
export async function migrateUserConfig(): Promise<void> {
	if (!fse.existsSync(CONFIG_PATH)) return;
	const content = fse.readFileSync(CONFIG_PATH, "utf-8");
	const { content: cleaned, removed } = stripDeprecatedKeys(
		content,
		DEPRECATED_CONFIG_KEYS,
	);
	if (removed.length === 0) return;
	await fse.writeFile(CONFIG_PATH, cleaned, "utf-8");
	printInfo(`已清理配置中的废弃字段: ${removed.join(", ")}`);
}
