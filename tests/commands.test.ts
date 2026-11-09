import { describe, expect, test } from "bun:test";
import { Command } from "commander";

// 重新导出所有命令注册，验证无冲突
async function buildProgram() {
	const { templateCommand } = await import("../src/commands/template");
	const { tagCommand } = await import("../src/commands/tag");

	const program = new Command();
	program.addCommand(tagCommand);
	program.addCommand(templateCommand);
	return program;
}

describe("command registration", () => {
	test("tag and template commands register without conflict", async () => {
		const program = await buildProgram();
		const cmds = program.commands.map((c) => ({
			name: c.name(),
			aliases: c.aliases(),
		}));

		expect(cmds).toContainEqual(expect.objectContaining({ name: "tag" }));
		expect(cmds).toContainEqual(expect.objectContaining({ name: "template" }));

		// 所有 alias 不重复
		const allAliases: string[] = [];
		for (const cmd of cmds) {
			const names = [cmd.name, ...cmd.aliases];
			for (const name of names) {
				expect(allAliases).not.toContain(name);
				allAliases.push(name);
			}
		}
	});

	test("template has expected aliases", async () => {
		const program = await buildProgram();
		const template = program.commands.find((c) => c.name() === "template");
		expect(template).toBeDefined();
		expect(template?.aliases()).toContain("templates");
		expect(template?.aliases()).toContain("tp");
	});

	test("tag has expected aliases", async () => {
		const program = await buildProgram();
		const tag = program.commands.find((c) => c.name() === "tag");
		expect(tag).toBeDefined();
		expect(tag?.aliases()).toContain("t");
		expect(tag?.aliases()).toContain("tags");
	});
});
