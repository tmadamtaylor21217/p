import { isCancel, outro, text } from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";

import {
	getProjectMeta,
	listProjects,
	projectExists,
	saveProjectMeta,
} from "../core/project";
import { filterProjects } from "../utils/project-search";
import { brand, printError, printInfo, printSuccess } from "../utils/ui";

function resolveProjectName(name: string): string | null {
	if (name === ".") {
		const currentDir = process.cwd();
		const projects = listProjects();
		const current = projects.find((p) => p.path === currentDir);
		return current?.name || null;
	}

	if (projectExists(name)) return name;

	const projects = listProjects();
	const filtered = filterProjects(projects, name);
	if (filtered.length === 1) return filtered[0]?.name ?? name;
	if (filtered.length > 1) {
		printError(`匹配到多个项目: ${filtered.map((p) => p.name).join(", ")}`);
		return null;
	}

	printError(`项目不存在: ${name}`);
	return null;
}

async function setFirstPrompt(projectName: string, promptText?: string) {
	let prompt = promptText;

	if (!prompt && prompt !== "") {
		const meta = getProjectMeta(projectName);
		const existing = meta?.firstPrompt || "";

		const result = await text({
			message: `输入 first prompt (${brand.primary(projectName)}):`,
			placeholder: "创建项目时的初始需求...",
			initialValue: existing,
		});

		if (isCancel(result)) {
			outro(pc.dim("已取消"));
			process.exit(0);
		}

		prompt = (result as string).trim();
	}

	if (!prompt) {
		saveProjectMeta(projectName, { firstPrompt: undefined });
		printSuccess(`已清除 ${brand.primary(projectName)} 的 first prompt`);
	} else {
		saveProjectMeta(projectName, { firstPrompt: prompt });
		printSuccess(
			`已为 ${brand.primary(projectName)} 设置 first prompt: ${pc.dim(prompt)}`,
		);
	}
}

async function clearFirstPrompt(projectName: string) {
	saveProjectMeta(projectName, { firstPrompt: undefined });
	printSuccess(`已清除 ${brand.primary(projectName)} 的 first prompt`);
}

async function showFirstPrompt(projectName: string) {
	const meta = getProjectMeta(projectName);
	const prompt = meta?.firstPrompt;

	if (!prompt) {
		printInfo(`${brand.primary(projectName)} 没有 first prompt`);
		return;
	}

	console.log();
	console.log(
		brand.primary(`  ${projectName}`) + pc.dim(": ") + pc.dim(prompt),
	);
	console.log();
}

export const firstPromptCommand = new Command("first-prompt")
	.alias("fp")
	.alias("note")
	.alias("notes")
	.description("管理项目 first prompt（创建时的初始需求）")
	.argument("[project]", "项目名称或 . 表示当前目录")
	.argument("[text]", "新的 first prompt 内容")
	.option("-c, --clear", "清除 first prompt")
	.action(
		async (
			project?: string,
			promptText?: string,
			options?: { clear?: boolean },
		) => {
			// p fp — 无参数，显示当前项目的 first prompt
			if (!project) {
				const currentDir = process.cwd();
				const projects = listProjects();
				const current = projects.find((p) => p.path === currentDir);

				if (!current) {
					printError("当前目录不是 p 管理的项目");
					process.exit(1);
				}

				await showFirstPrompt(current.name);
				return;
			}

			const projectName = resolveProjectName(project);
			if (!projectName) process.exit(1);

			if (options?.clear) {
				await clearFirstPrompt(projectName);
				return;
			}

			await setFirstPrompt(projectName, promptText);
		},
	);
