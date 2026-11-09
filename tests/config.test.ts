import { describe, expect, test } from "bun:test";

import { stripDeprecatedKeys } from "../src/core/config";

const DEPRECATED = ["apiKey", "deepseekApiKey", "ai"];

describe("stripDeprecatedKeys", () => {
	test("移除废弃键及其前导注释与子块，保留其他内容", () => {
		const content = [
			"# P 配置文件",
			"",
			"# 默认打开方式",
			"ide: claude",
			"",
			"# GUI IDE",
			"#editor: cursor",
			"",
			"# 智谱 GLM API Key",
			"apiKey:",
			"",
			"# DeepSeek API Key",
			"deepseekApiKey:",
			"",
			"# AI 命名配置",
			"ai:",
			"  # provider: glm",
			"  count: 5",
			"",
			"# 命令快捷方式",
			"#shortcuts:",
			"hooks:",
			"  gitInit:",
			"    command: git init",
		].join("\n");

		const { content: cleaned, removed } = stripDeprecatedKeys(
			content,
			DEPRECATED,
		);
		expect(removed).toEqual(["apiKey", "deepseekApiKey", "ai"]);
		expect(cleaned).not.toContain("apiKey");
		expect(cleaned).not.toContain("deepseekApiKey");
		expect(cleaned).not.toContain("ai:");
		expect(cleaned).not.toContain("智谱");
		expect(cleaned).not.toContain("count: 5");
		// 无关注释与内容保留
		expect(cleaned).toContain("#editor: cursor");
		expect(cleaned).toContain("# 命令快捷方式");
		expect(cleaned).toContain("#shortcuts:");
		expect(cleaned).toContain("ide: claude");
		expect(cleaned).toContain("hooks:");
		expect(cleaned).toContain("command: git init");
	});

	test("键带同行值也能移除", () => {
		const { removed } = stripDeprecatedKeys("apiKey: abc123", DEPRECATED);
		expect(removed).toEqual(["apiKey"]);
	});

	test("无废弃键时内容原样返回", () => {
		const content =
			"ide: claude\n\nhooks:\n  gitInit:\n    command: git init\n";
		const { content: cleaned, removed } = stripDeprecatedKeys(
			content,
			DEPRECATED,
		);
		expect(removed).toEqual([]);
		expect(cleaned).toBe(content);
	});

	test("清理后再跑一次（幂等）不再有变化", () => {
		const once = stripDeprecatedKeys(
			"ide: claude\nai:\n  count: 5",
			DEPRECATED,
		);
		const twice = stripDeprecatedKeys(once.content, DEPRECATED);
		expect(twice.removed).toEqual([]);
		expect(twice.content).toBe(once.content);
	});
});
