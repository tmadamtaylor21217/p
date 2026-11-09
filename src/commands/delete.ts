import {
	confirm,
	intro,
	isCancel,
	multiselect,
	outro,
	spinner,
} from "@clack/prompts";
import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";

import { loadConfig } from "../core/config";
import {
	clearAllProjectMeta,
	deleteProjectMeta,
	getProjectPath,
	listProjects,
	projectExists,
} from "../core/project";
import { maybeRemoveCchiveDirs, toRealPath } from "../utils/cchive";
import { CANCEL, liveSearch } from "../utils/live-search";
import { filterProjects, projectHint } from "../utils/project-search";
import { bgOrange, brand, printError, printInfo } from "../utils/ui";

/**
 * 搜索并选择要删除的项目（实时搜索）
 */
async function searchAndSelectDelete(
	projects: ReturnType<typeof listProjects>,
	initialQuery?: string,
): Promise<string[]> {
	const options = projects.map((p) => ({
		value: p.name,
		label: p.name,
		hint: projectHint(p),
	}));

	const result = await liveSearch({
		message: "搜索要删除的项目:",
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
 * 通配符匹配项目名
 */
function wildcardMatch(
	projects: ReturnType<typeof listProjects>,
	pattern: string,
): string[] {
	const regexStr = `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`;
	const regex = new RegExp(regexStr, "i");
	return projects.filter((p) => regex.test(p.name)).map((p) => p.name);
}

/**
 * 批量删除项目
 */
async function batchDelete(projectNames: string[]) {
	if (projectNames.length === 0) {
		printInfo("没有匹配的项目");
		return;
	}

	console.log();
	console.log(pc.dim("  将要删除的项目:"));
	for (const name of projectNames) {
		console.log(`  ${brand.secondary("•")} ${name}`);
	}
	console.log();

	const shouldDelete = await confirm({
		message: `确定要删除 ${brand.primary(String(projectNames.length))} 个项目吗？此操作不可恢复！`,
		initialValue: true,
	});

	if (isCancel(shouldDelete) || !shouldDelete) {
		outro(pc.dim("已取消"));
		process.exit(0);
	}

	console.log();
	const s = spinner();
	s.start("正在删除项目...");

	const results = await Promise.allSettled(
		projectNames.map(async (name, index) => {
			try {
				const path = getProjectPath(name);
				// 删除前解析 realpath：CCHive 订阅存 realpath 形态，目录删除后 real 不出来
				const realPath = toRealPath(path);
				await fse.remove(path);
				return { success: true as const, name, realPath, index };
			} catch (error) {
				const err = error as Error;
				return { success: false as const, name, error: err.message, index };
			}
		}),
	);

	s.stop();

	console.log();
	let deletedCount = 0;
	const errors: string[] = [];
	const removedCwds: string[] = [];

	for (const result of results) {
		if (result.status === "fulfilled") {
			const r = result.value;
			if (r.success) {
				deletedCount++;
				deleteProjectMeta(r.name);
				removedCwds.push(r.realPath);
				console.log(
					`  ${brand.success("✓")} [${r.index + 1}/${projectNames.length}] ${r.name}`,
				);
			} else {
				errors.push(`${r.name}: ${r.error}`);
				console.log(
					`  ${brand.error("✗")} [${r.index + 1}/${projectNames.length}] ${r.name} - ${r.error}`,
				);
			}
		}
	}

	// 同步 CCHive：清掉已删项目的目录订阅，侧栏不残留（静默，失败不影响删除结果）
	await maybeRemoveCchiveDirs(loadConfig().cchiveSync, removedCwds);

	console.log();
	if (errors.length > 0) {
		outro(
			`${brand.success("✓")} 已删除 ${deletedCount} 个项目，${errors.length} 个失败`,
		);
	} else {
		outro(`${brand.success("✓")} 已成功删除 ${deletedCount} 个项目`);
	}
}

export const deleteCommand = new Command("delete")
	.alias("d")
	.alias("rm")
	.description("删除项目")
	.argument("[names...]", "项目名称、通配符模式，或 'all'（支持多个）")
	.action(async (names?: string[]) => {
		const args = names ?? [];
		const projects = listProjects();

		if (projects.length === 0) {
			console.log();
			printInfo("暂无项目");
			console.log();
			return;
		}

		// 处理 delete all 命令
		if (args.length === 1 && args[0] === "all") {
			intro(bgOrange(" 删除所有项目 "));

			console.log();
			console.log(pc.dim("  将要删除的项目:"));
			for (const project of projects) {
				const templateInfo = project?.template
					? pc.cyan(` (${project.template})`)
					: "";
				console.log(`  ${brand.secondary("•")} ${project.name}${templateInfo}`);
			}
			console.log();

			// 确认删除
			const shouldDelete = await confirm({
				message: `确定要删除 ${brand.primary(String(projects.length))} 个项目吗？此操作不可恢复！`,
				initialValue: true,
			});

			if (isCancel(shouldDelete) || !shouldDelete) {
				outro(pc.dim("已取消"));
				process.exit(0);
			}

			console.log();
			const s = spinner();
			s.start("正在删除项目...");

			// 并发删除所有项目
			const results = await Promise.allSettled(
				projects.map(async (project, index) => {
					try {
						// 删除前解析 realpath：CCHive 订阅存 realpath 形态，目录删除后 real 不出来
						const realPath = toRealPath(project.path);
						await fse.remove(project.path);
						return { success: true as const, project, realPath, index };
					} catch (error) {
						const err = error as Error;
						return {
							success: false as const,
							project,
							error: err.message,
							index,
						};
					}
				}),
			);

			s.stop();

			// 统计结果并显示
			console.log();
			let deletedCount = 0;
			const errors: string[] = [];
			const removedCwds: string[] = [];

			// 按索引排序结果以保持显示顺序
			const sortedResults = results
				.map((result, idx) => ({ result, originalIndex: idx }))
				.sort((a, b) => {
					const aIndex =
						a.result.status === "fulfilled"
							? a.result.value.index
							: a.originalIndex;
					const bIndex =
						b.result.status === "fulfilled"
							? b.result.value.index
							: b.originalIndex;
					return aIndex - bIndex;
				});

			for (const { result } of sortedResults) {
				if (result.status === "fulfilled") {
					if (result.value.success) {
						deletedCount++;
						removedCwds.push(result.value.realPath);
						console.log(
							`  ${brand.success("✓")} [${result.value.index + 1}/${projects.length}] ${result.value.project.name}`,
						);
					} else {
						errors.push(`${result.value.project.name}: ${result.value.error}`);
						console.log(
							`  ${brand.error("✗")} [${result.value.index + 1}/${projects.length}] ${result.value.project.name} - ${result.value.error}`,
						);
					}
				} else {
					errors.push(`删除失败: ${result.reason}`);
				}
			}

			// 清除所有元数据；同步 CCHive：清掉已删项目的目录订阅（静默，失败不影响删除结果）
			clearAllProjectMeta();
			await maybeRemoveCchiveDirs(loadConfig().cchiveSync, removedCwds);

			console.log();
			if (errors.length > 0) {
				outro(
					`${brand.success("✓")} 已删除 ${deletedCount} 个项目，${errors.length} 个失败`,
				);
			} else {
				outro(`${brand.success("✓")} 已成功删除所有 ${deletedCount} 个项目`);
			}

			return;
		}

		// 通配符模式（单参数）
		if (args.length === 1 && args[0]?.includes("*")) {
			const name = args[0] ?? "";
			let matched = wildcardMatch(projects, name);

			if (matched.length === 0) {
				// 去掉通配符，用关键词模糊搜索
				const keyword = name.replace(/\*/g, "");
				const similar = keyword
					? filterProjects(projects, keyword).map((p) => p.name)
					: [];

				if (similar.length === 0) {
					printError(`没有匹配 '${name}' 的项目`);
					process.exit(1);
				}

				printError(`没有匹配 '${name}' 的项目`);
				console.log();
				console.log(pc.dim("  是否删除以下项目？"));
				for (const n of similar) {
					console.log(`    ${brand.secondary("•")} ${n}`);
				}
				console.log();

				const shouldDelete = await confirm({
					message: `删除这 ${brand.primary(String(similar.length))} 个项目？`,
					initialValue: true,
				});

				if (isCancel(shouldDelete) || !shouldDelete) {
					outro(pc.dim("已取消"));
					process.exit(0);
				}

				matched = similar;
			}

			intro(bgOrange(" 批量删除 "));
			await batchDelete(matched);
			return;
		}

		// 无参数 → 多选模式
		if (args.length === 0) {
			intro(bgOrange(" 批量删除 "));

			const result = await multiselect({
				message: "选择要删除的项目（空格选择）:",
				options: projects.map((p) => ({
					value: p.name,
					label: p.name,
					hint: projectHint(p),
				})),
			});

			if (isCancel(result)) {
				outro(pc.dim("已取消"));
				process.exit(0);
			}

			const selected = result as string[];
			await batchDelete(selected);
			return;
		}

		// 多参数 → 批量删除（支持混合项目名、通配符）
		if (args.length > 1) {
			intro(bgOrange(" 批量删除 "));

			const matched: string[] = [];
			const notFound: string[] = [];
			const seen = new Set<string>();

			for (const arg of args) {
				let current: string[] = [];

				if (arg.includes("*")) {
					current = wildcardMatch(projects, arg);
				} else if (projectExists(arg)) {
					current = [arg];
				} else {
					const filtered = filterProjects(projects, arg);
					current = filtered.map((p) => p.name);
				}

				if (current.length === 0) {
					notFound.push(arg);
					continue;
				}

				for (const n of current) {
					if (!seen.has(n)) {
						seen.add(n);
						matched.push(n);
					}
				}
			}

			if (notFound.length > 0) {
				for (const n of notFound) {
					console.log(`  ${brand.error("✗")} ${n} - 项目不存在`);
				}
				console.log();
			}

			if (matched.length === 0) {
				printError("没有匹配的项目");
				process.exit(1);
			}

			await batchDelete(matched);
			return;
		}

		// 单参数搜索删除
		const name = args[0] ?? "";
		let projectNames: string[];

		if (projectExists(name)) {
			projectNames = [name];
		} else {
			const filtered = filterProjects(projects, name);
			if (filtered.length === 0) {
				printError(`项目不存在: ${name}`);
				console.log(
					pc.dim("使用 ") + brand.primary("p ls") + pc.dim(" 查看所有项目"),
				);
				process.exit(1);
			}
			if (filtered.length === 1) {
				const matchedName = filtered[0]?.name ?? name;
				projectNames = [matchedName];
				console.log(pc.dim("  匹配到: ") + brand.primary(matchedName));
			} else {
				console.log(pc.dim(`  匹配到 ${filtered.length} 个项目`));
				projectNames = await searchAndSelectDelete(projects, name);
			}
		}

		if (projectNames.length > 1) {
			intro(bgOrange(" 批量删除 "));
			await batchDelete(projectNames);
			return;
		}

		const projectName = projectNames[0] ?? name;
		const projectPath = getProjectPath(projectName);

		// 确认删除
		const shouldDelete = await confirm({
			message: `确定要删除项目 ${brand.primary(projectName)} 吗？此操作不可恢复！`,
			initialValue: true,
		});

		if (isCancel(shouldDelete) || !shouldDelete) {
			outro(pc.dim("已取消"));
			process.exit(0);
		}

		const s = spinner();
		s.start(`正在删除 ${projectName}...`);

		try {
			// 删除前解析 realpath：CCHive 订阅存 realpath 形态，目录删除后 real 不出来
			const realPath = toRealPath(projectPath);
			await fse.remove(projectPath);
			deleteProjectMeta(projectName);
			// 同步 CCHive：清掉目录订阅，侧栏不残留（静默，失败不影响删除结果）
			await maybeRemoveCchiveDirs(loadConfig().cchiveSync, [realPath]);
			s.stop(`${brand.success("✓")} 已删除: ${brand.primary(projectName)}`);
		} catch (error) {
			s.stop("删除失败");
			const err = error as Error;
			printError(err.message);
			process.exit(1);
		}
	});
