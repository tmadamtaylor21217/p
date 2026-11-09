import { describe, expect, test } from "bun:test";

import {
	buildNamingPrompt,
	isDescriptionInput,
	parseNameSuggestions,
	parseSuggestions,
} from "../src/utils/naming";
import { supportsPromptArg } from "../src/utils/shell";

describe("isDescriptionInput", () => {
	test("单个 ASCII 词是项目名", () => {
		expect(isDescriptionInput("myproj")).toBe(false);
		expect(isDescriptionInput("blog2")).toBe(false);
		expect(isDescriptionInput("#clone")).toBe(false);
		expect(isDescriptionInput("  ")).toBe(false);
		expect(isDescriptionInput("")).toBe(false);
	});

	test("纯中文（无空格）也是描述", () => {
		expect(isDescriptionInput("邀请机器人")).toBe(true);
	});

	test("多词英文是描述", () => {
		expect(isDescriptionInput("github invite bot")).toBe(true);
	});

	test("完整自然语言需求是描述", () => {
		expect(
			isDescriptionInput(
				"做一个 github 私有仓库邀请机器人，让用户安装、接入，然后分发邀请链接，其他用户访问这个链接，就能直接加入私有仓库。支持个人和组织",
			),
		).toBe(true);
	});
});

describe("parseNameSuggestions", () => {
	test("干净的每行一个名称", () => {
		expect(
			parseNameSuggestions("github-invite-bot\nrepo-inviter\ngh-invite"),
		).toEqual(["github-invite-bot", "repo-inviter", "gh-invite"]);
	});

	test("剥离编号列表前缀（1. / 2) / 3、）", () => {
		expect(
			parseNameSuggestions("1. foo-bar\n2) baz-qux\n3、invite-bot"),
		).toEqual(["foo-bar", "baz-qux", "invite-bot"]);
	});

	test("剥离 markdown 子弹与 code fence 包裹", () => {
		expect(parseNameSuggestions("```\n- foo-bar\n* baz-qux\n```")).toEqual([
			"foo-bar",
			"baz-qux",
		]);
	});

	test("JSON 数组输出直接采纳", () => {
		expect(parseNameSuggestions('["foo-bar", "baz-qux"]')).toEqual([
			"foo-bar",
			"baz-qux",
		]);
	});

	test("剥离成对引号与反引号", () => {
		expect(
			parseNameSuggestions("`foo-bar`\n\"baz-qux\"\n'invite-bot'"),
		).toEqual(["foo-bar", "baz-qux", "invite-bot"]);
	});

	test("前置说明与中文释义行被过滤", () => {
		expect(
			parseNameSuggestions("以下是 5 个项目名：\nfoo-bar\n用于邀请\nbaz-qux"),
		).toEqual(["foo-bar", "baz-qux"]);
	});

	test("非 kebab-case（下划线/大写/数字开头/连字符开头）被过滤", () => {
		expect(parseNameSuggestions("foo_bar\nFooBar\n2bot\n-bot")).toEqual([]);
	});

	test("去重并按 max 截断", () => {
		expect(parseNameSuggestions("foo\nfoo\nbar\nbaz", 2)).toEqual([
			"foo",
			"bar",
		]);
	});

	test("空输入与纯 fence 返回空数组", () => {
		expect(parseNameSuggestions("")).toEqual([]);
		expect(parseNameSuggestions("```\n```")).toEqual([]);
	});
});

describe("parseSuggestions", () => {
	test("JSON 对象数组：name + reason", () => {
		expect(
			parseSuggestions(
				'[{"name": "github-invite-bot", "reason": "直白描述功能"}, {"name": "repo-inviter", "reason": "强调仓库邀请"}]',
			),
		).toEqual([
			{ name: "github-invite-bot", reason: "直白描述功能" },
			{ name: "repo-inviter", reason: "强调仓库邀请" },
		]);
	});

	test("code fence 包裹的 JSON 也能采纳", () => {
		expect(
			parseSuggestions('```json\n[{"name": "foo-bar", "reason": "解释"}]\n```'),
		).toEqual([{ name: "foo-bar", reason: "解释" }]);
	});

	test("纯字符串 JSON 数组降级为无解释", () => {
		expect(parseSuggestions('["foo-bar", "baz-qux"]')).toEqual([
			{ name: "foo-bar", reason: "" },
			{ name: "baz-qux", reason: "" },
		]);
	});

	test("JSON 里的非法 name 与缺 reason 容错", () => {
		expect(
			parseSuggestions(
				'[{"name": "foo_bar", "reason": "非法"}, {"name": "ok-bot"}, 42]',
			),
		).toEqual([{ name: "ok-bot", reason: "" }]);
	});

	test("超长 reason 截断", () => {
		const result = parseSuggestions(
			'[{"name": "foo-bar", "reason": "这一句解释特别特别特别特别特别特别特别特别长"}]',
		);
		expect(result[0]?.reason.length).toBeLessThanOrEqual(21); // 20 字 + 省略号
		expect(result[0]?.reason.endsWith("…")).toBe(true);
	});

	test('"name — 解释" 行格式', () => {
		expect(
			parseSuggestions("foo-bar — 直白功能名\nbaz-qux：强调邀请方"),
		).toEqual([
			{ name: "foo-bar", reason: "直白功能名" },
			{ name: "baz-qux", reason: "强调邀请方" },
		]);
	});

	test('"name 解释" 空格格式（含 "- 解释" 残留清理）', () => {
		expect(
			parseSuggestions("foo-bar GitHub 邀请机器人\nbaz-qux - 邀请分发"),
		).toEqual([
			{ name: "foo-bar", reason: "GitHub 邀请机器人" },
			{ name: "baz-qux", reason: "邀请分发" },
		]);
	});

	test("纯名称行 reason 为空，解释行被过滤", () => {
		expect(parseSuggestions("foo-bar\n用于邀请\nbaz-qux")).toEqual([
			{ name: "foo-bar", reason: "" },
			{ name: "baz-qux", reason: "" },
		]);
	});

	test("按 name 去重", () => {
		expect(
			parseSuggestions(
				'[{"name": "foo", "reason": "a"}, {"name": "foo", "reason": "b"}]',
			),
		).toEqual([{ name: "foo", reason: "a" }]);
	});
});

describe("buildNamingPrompt", () => {
	test("包含需求原文、命名规则与解释要求", () => {
		const prompt = buildNamingPrompt("做一个邀请机器人");
		expect(prompt).toContain("做一个邀请机器人");
		expect(prompt).toContain("kebab-case");
		expect(prompt).toContain("JSON");
		expect(prompt).toContain("reason");
		expect(prompt).toContain("解释");
		expect(prompt).not.toContain("不要使用以下");
	});

	test("exclude 非空时包含排除列表", () => {
		const prompt = buildNamingPrompt("做一个邀请机器人", ["foo", "bar"]);
		expect(prompt).toContain("不要使用以下");
		expect(prompt).toContain("foo\nbar");
	});
});

describe("supportsPromptArg", () => {
	test("claude 支持 prompt 启动", () => {
		expect(supportsPromptArg("claude")).toBe(true);
	});

	test("其他 TUI / GUI 编辑器暂不支持", () => {
		expect(supportsPromptArg("aider")).toBe(false);
		expect(supportsPromptArg("codex")).toBe(false);
		expect(supportsPromptArg("gemini")).toBe(false);
		expect(supportsPromptArg("code")).toBe(false);
		expect(supportsPromptArg("cursor")).toBe(false);
	});

	test("按首 token 判定并容忍空白", () => {
		expect(supportsPromptArg(" claude ")).toBe(true);
	});
});
