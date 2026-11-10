import { describe, expect, test } from "bun:test";
import { Command } from "commander";
import { searchCommand } from "../src/commands/search";
import { syncCommand } from "../src/commands/sync";
import { filterProjects } from "../src/utils/project-search";

describe("filterProjects 模糊匹配", () => {
	const projects = [
		{ name: "unified-collector", template: "bun-cli", tags: ["mcp"] },
		{ name: "collectui", template: "next", tags: ["design"] },
		{ name: "p", tags: ["cli"] },
		{ name: "api-gateway" },
	];

	test("子串匹配：collect 同时命中两个项目", () => {
		const r = filterProjects(projects, "collect");
		expect(r.map((p) => p.name)).toContain("unified-collector");
		expect(r.map((p) => p.name)).toContain("collectui");
	});

	test("子串匹配：col 命中 2 个，p 不被散字符命中", () => {
		const r = filterProjects(projects, "col");
		expect(r.map((p) => p.name)).not.toContain("p");
		expect(r.length).toBe(2);
	});

	test("非子串不命中：uc 不命中 unified-collector", () => {
		const r = filterProjects(projects, "uc");
		expect(r).toEqual([]);
	});

	test("匹配模板名与标签", () => {
		expect(filterProjects(projects, "mcp").map((p) => p.name)).toEqual([
			"unified-collector",
		]);
		expect(filterProjects(projects, "bun-cli").map((p) => p.name)).toEqual([
			"unified-collector",
		]);
	});

	test("无匹配返回空数组", () => {
		expect(filterProjects(projects, "zzz")).toEqual([]);
	});

	test("空 query 返回全量原顺序", () => {
		expect(filterProjects(projects, "")).toHaveLength(4);
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
