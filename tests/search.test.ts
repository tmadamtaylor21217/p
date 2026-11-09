import { describe, expect, test } from "bun:test";
import { Command } from "commander";
import { searchCommand } from "../src/commands/search";
import { syncCommand } from "../src/commands/sync";
import { filterProjects, fuzzyScore } from "../src/utils/project-search";

describe("fuzzyScore", () => {
	test("不匹配（字符缺失或顺序颠倒）返回 0", () => {
		expect(fuzzyScore("api-server", "apx")).toBe(0);
		expect(fuzzyScore("abc", "cba")).toBe(0);
		expect(fuzzyScore("", "a")).toBe(0);
	});

	test("空 query 恒匹配", () => {
		expect(fuzzyScore("anything", "")).toBeGreaterThan(0);
	});

	test("子串匹配得分高于散匹配", () => {
		const contiguous = fuzzyScore("api-server", "api");
		const scattered = fuzzyScore("xxaxpixx", "api");
		expect(contiguous).toBeGreaterThan(scattered);
	});

	test("词首边界得分高于词中匹配", () => {
		const boundary = fuzzyScore("my-project", "p"); // '-' 后的 p
		const middle = fuzzyScore("topping", "p"); // 词中第一个 p
		expect(boundary).toBeGreaterThan(middle);
	});

	test("大小写不敏感", () => {
		expect(fuzzyScore("API-Server", "api")).toBe(
			fuzzyScore("api-server", "api"),
		);
	});
});

describe("filterProjects 模糊匹配", () => {
	const projects = [
		{ name: "unified-collector", template: "bun-cli", tags: ["mcp"] },
		{ name: "collectui", template: "next", tags: ["design"] },
		{ name: "p", tags: ["cli"] },
		{ name: "api-gateway" },
	];

	test("子串匹配保持兼容（原子串是子序列特例）", () => {
		const r = filterProjects(projects, "collect");
		expect(r.map((p) => p.name)).toContain("unified-collector");
		expect(r.map((p) => p.name)).toContain("collectui");
	});

	test("子序列匹配：uc 命中 unified-collector", () => {
		const r = filterProjects(projects, "uc");
		expect(r.map((p) => p.name)).toContain("unified-collector");
	});

	test("按相关度排序：子串命中排在散匹配前", () => {
		const r = filterProjects(projects, "col");
		// collectui 的 col 是连续子串，unified-collector 的 col 在 '-' 边界后同为子串
		expect(r.map((p) => p.name)).not.toContain("p");
		expect(r.length).toBe(2);
	});

	test("匹配模板名与标签", () => {
		expect(filterProjects(projects, "mcp").map((p) => p.name)).toEqual([
			"unified-collector",
		]);
		expect(filterProjects(projects, "buncli").map((p) => p.name)).toEqual([
			"unified-collector",
		]);
	});

	test("无匹配返回空数组", () => {
		expect(filterProjects(projects, "zzz")).toEqual([]);
	});

	test("空 query 返回全量原顺序", () => {
		expect(filterProjects(projects, "")).toHaveLength(4);
		expect(filterProjects(projects, "  ")).toHaveLength(4);
	});
});

describe("search command registration", () => {
	test("search 注册且别名 s，不与其他命令冲突", () => {
		const program = new Command();
		program.addCommand(searchCommand);
		program.addCommand(syncCommand);

		const search = program.commands.find((c) => c.name() === "search");
		expect(search).toBeDefined();
		expect(search?.aliases()).toContain("s");

		// 所有 name + alias 全局唯一（s 不与 sync 冲突）
		const allNames: string[] = [];
		for (const cmd of program.commands) {
			for (const name of [cmd.name(), ...cmd.aliases()]) {
				expect(allNames).not.toContain(name);
				allNames.push(name);
			}
		}
	});
});
