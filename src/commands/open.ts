import { confirm, isCancel, outro, spinner } from "@clack/prompts";
import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";

import { loadConfig } from "../core/config";
import {
	clearOriginalPath,
	getProjectMeta,
	getProjectPath,
	listProjects,
	projectExists,
} from "../core/project";
import type { Config } from "../types";
import { CANCEL, liveSearch } from "../utils/live-search";
import { filterProjects, projectHint } from "../utils/project-search";
import { commandExists, isTUICommand, openWithIDE } from "../utils/shell";
import { brand, printError, printInfo } from "../utils/ui";

/**
 * 搜索并选择项目（实时搜索），支持 a 键全部打开
 */
async function searchAndSelect(
	projects: ReturnType<typeof listProjects>,
	initialQuery?: string,
): Promise<string[]> {
	const options = projects.map((p) => ({
		value: p.name,
		label: p.name,
		hint: projectHint(p),
	}));

	const result = await liveSearch({
		message: "搜索项目:",
		placeholder: "输入名称、模板或标签筛选",
		options,
		filterFn: (query: string) => {
			if (!query) return options;
			const filtered = filterProjects(projects, query);
			return filtered.map((p) => ({
				value: p.name,
				label: p.name,
				hint: projectHint(p),
			}));
		},
		initialQuery,
		multiSelect: true,
	});

	if (result === CANCEL) {
		outro(pc.dim("已取消"));
		process.exit(0);
	}

	return result as string[];
}

/**
 * 解析实际打开方式：-i 显式指定 > config.editor > 自动探测 GUI IDE
 */
async function resolveOpenIde(
	config: Config,
	options?: { ide?: string },
): Promise<string> {
	if (options?.ide) return options.ide;
	if (config.editor) return config.editor;
	for (const cmd of ["cursor", "code", "windsurf", "trae"]) {
		if (await commandExists(cmd)) return cmd;
	}
	throw new Error(
		"未找到可用的 GUI IDE，请在 ~/.p/config.yaml 中配置 editor 字段（如 editor: cursor）",
	);
}

export const openCommand = new Command("open")
	.alias("o")
	.description(
		"打开项目（默认 GUI IDE 打开，p o :claude 可用 Claude Code 打开）",
	)
	.argument("[name]", "项目名称、搜索关键词，或 :ide 快速切换")
	.option("-i, --ide <ide>", "指定 IDE")
	.action(async (name?: string, options?: { ide?: string }) => {
		const config = loadConfig();

		// 处理 `:ide` 语法：快速用指定 IDE 打开当前目录
		if (name?.startsWith(":")) {
			const ide = name.slice(1);
			if (isTUICommand(ide)) {
				// TUI（如 claude）前台运行，不能用 spinner
				try {
					await openWithIDE(ide, process.cwd(), true);
				} catch (error) {
					printError((error as Error).message);
					process.exit(1);
				}
				return;
			}

			const s = spinner();
			s.start(`正在查找 ${ide}...`);

			try {
				const { resolved } = await openWithIDE(ide, process.cwd(), true);
				s.stop(
					`${brand.success("✓")} 已用 ${brand.primary(resolved)} 打开当前目录`,
				);
			} catch (error) {
				s.stop("打开失败");
				printError((error as Error).message);
				process.exit(1);
			}
			return;
		}

		// 解析打开方式（-i 指定 > config.editor > 自动探测）
		const ide = await resolveOpenIde(config, options).catch((error: Error) => {
			printError(error.message);
			process.exit(1);
		});

		// 处理 `p open . -i ide` 的情况：用指定 IDE 打开当前目录
		if (name === ".") {
			if (isTUICommand(ide)) {
				// TUI（如 claude）前台运行，不能用 spinner
				try {
					await openWithIDE(ide, process.cwd(), !!options?.ide);
				} catch (error) {
					printError((error as Error).message);
					process.exit(1);
				}
				return;
			}

			const s = spinner();
			s.start(`正在打开...`);

			try {
				const { resolved } = await openWithIDE(
					ide,
					process.cwd(),
					!!options?.ide,
				);
				s.stop(
					`${brand.success("✓")} 已用 ${brand.primary(resolved)} 打开当前目录`,
				);
			} catch (error) {
				s.stop("打开失败");
				printError((error as Error).message);
				process.exit(1);
			}
			return;
		}

		const projects = listProjects();

		if (projects.length === 0) {
			console.log();
			printInfo(`暂无项目，使用 ${brand.primary("p new")} 创建新项目`);
			console.log();
			return;
		}

		let projectNames: string[];

		if (!name) {
			projectNames = await searchAndSelect(projects);
		} else if (!projectExists(name)) {
			const filtered = filterProjects(projects, name);
			if (filtered.length === 1) {
				const matchedName = filtered[0]?.name ?? name;
				console.log(pc.dim("  匹配到: ") + brand.primary(matchedName));
				projectNames = [matchedName];
			} else if (filtered.length > 1) {
				console.log(pc.dim(`  匹配到 ${filtered.length} 个项目`));
				projectNames = await searchAndSelect(projects, name);
			} else {
				printError(`项目不存在: ${name}`);
				console.log(
					pc.dim("使用 ") + brand.primary("p ls") + pc.dim(" 查看所有项目"),
				);
				process.exit(1);
			}
		} else {
			projectNames = [name];
		}

		// 批量打开
		if (projectNames.length > 1) {
			for (const pName of projectNames) {
				try {
					await openWithIDE(ide, getProjectPath(pName));
					console.log(`${brand.success("✓")} 已打开: ${brand.primary(pName)}`);
				} catch (error) {
					printError(`${pName}: ${(error as Error).message}`);
				}
			}
			return;
		}

		// 单个打开
		const projectName = projectNames[0] ?? name ?? "";
		const projectPath = getProjectPath(projectName);
		const currentDir = process.cwd();

		if (projectPath === currentDir) {
			console.log();
			printInfo(`已在项目目录: ${brand.primary(projectName)}`);
			console.log();
			return;
		}

		const meta = getProjectMeta(projectName);
		if (meta?.originalPath && fse.existsSync(meta.originalPath)) {
			const shouldDelete = await confirm({
				message: `检测到原始路径仍存在: ${pc.underline(meta.originalPath)}\n  是否删除原始目录？`,
				initialValue: false,
			});

			if (!isCancel(shouldDelete) && shouldDelete) {
				const s = spinner();
				s.start("正在删除原始目录...");
				try {
					await fse.remove(meta.originalPath);
					clearOriginalPath(projectName);
					s.stop("原始目录已删除");
				} catch (error) {
					s.stop("删除原始目录失败");
					printError((error as Error).message);
				}
			}
		}

		if (isTUICommand(ide)) {
			// TUI（如 claude）前台运行，不能用 spinner
			try {
				await openWithIDE(ide, projectPath, !!options?.ide);
			} catch (error) {
				console.log();
				printError((error as Error).message);
				console.log();
				console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
				console.log();
				process.exit(1);
			}
			return;
		}

		const s = spinner();
		s.start(`正在打开...`);

		try {
			const { resolved } = await openWithIDE(ide, projectPath, !!options?.ide);
			s.stop(
				`${brand.success("✓")} 已用 ${brand.primary(resolved)} 打开: ${brand.secondary(projectName)}`,
			);
		} catch (error) {
			s.stop("打开失败");
			console.log();
			printError((error as Error).message);
			console.log();
			console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
			console.log();
			process.exit(1);
		}
	});
