import { intro, isCancel, outro, spinner, text } from "@clack/prompts";
import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";

import {
	deleteProjectMeta,
	getProjectPath,
	listProjects,
	projectExists,
	saveProjectMeta,
	validateProjectNameFormat,
} from "../core/project";
import { CANCEL, liveSearch } from "../utils/live-search";
import { filterProjects, projectHint } from "../utils/project-search";
import { execAndCapture } from "../utils/shell";
import { bgOrange, brand, printError, printInfo } from "../utils/ui";

async function searchAndSelect(
	projects: ReturnType<typeof listProjects>,
	initialQuery?: string,
): Promise<string> {
	const options = projects.map((p) => ({
		value: p.name,
		label: p.name,
		hint: projectHint(p),
	}));

	const result = await liveSearch({
		message: "搜索要重命名的项目:",
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
	});

	if (result === CANCEL) {
		outro(pc.dim("已取消"));
		process.exit(0);
	}

	return (result as string[])[0] ?? "";
}

function extractRepoSlug(url: string): string | null {
	let match = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
	if (match) return match[1] ?? null;
	match = url.match(/git@[^:]+:([^/]+\/[^/]+?)(?:\.git)?$/);
	if (match) return match[1] ?? null;
	return null;
}

async function getRemoteOrigin(projectPath: string): Promise<string | null> {
	const result = await execAndCapture("git remote get-url origin", projectPath);
	if (result.success && result.output.trim()) {
		return result.output.trim();
	}
	return null;
}

async function renameGitHubRepo(
	oldSlug: string,
	newName: string,
): Promise<{ success: boolean; error?: string }> {
	const result = await execAndCapture(
		`gh repo rename ${newName} --repo ${oldSlug} --yes`,
		process.cwd(),
	);
	if (!result.success) {
		return { success: false, error: result.error || result.output };
	}
	return { success: true };
}

async function moveWithTimeout(
	src: string,
	dest: string,
	timeoutMs: number,
): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			resolve({
				success: false,
				error: `操作超时（${timeoutMs / 1000}秒），可能有 IDE 正在占用目录，请关闭该项目窗口后重试`,
			});
		}, timeoutMs);

		fse
			.move(src, dest)
			.then(() => {
				clearTimeout(timer);
				resolve({ success: true });
			})
			.catch((error) => {
				clearTimeout(timer);
				resolve({ success: false, error: error.message });
			});
	});
}

export const renameCommand = new Command("rename")
	.alias("mv")
	.description("重命名项目")
	.argument("[oldName]", "当前项目名称")
	.argument("[newName]", "新项目名称")
	.action(async (oldName?: string, newName?: string) => {
		const projects = listProjects();

		if (projects.length === 0) {
			console.log();
			printInfo("暂无项目");
			console.log();
			return;
		}

		let projectName = oldName;
		if (!projectName) {
			projectName = await searchAndSelect(projects);
		} else if (!projectExists(projectName)) {
			const filtered = filterProjects(projects, projectName);
			if (filtered.length === 1) {
				console.log(
					pc.dim("  匹配到: ") + brand.primary(filtered[0]?.name ?? ""),
				);
				projectName = filtered[0]?.name ?? "";
			} else if (filtered.length > 1) {
				console.log(pc.dim(`  匹配到 ${filtered.length} 个项目`));
				projectName = await searchAndSelect(projects, projectName);
			} else {
				printError(`项目不存在: ${projectName}`);
				console.log(
					pc.dim("使用 ") + brand.primary("p ls") + pc.dim(" 查看所有项目"),
				);
				process.exit(1);
			}
		}

		const projectPath = getProjectPath(projectName);

		let newProjectName = newName;
		if (!newProjectName) {
			const result = await text({
				message: "输入新项目名称:",
				placeholder: projectName,
				initialValue: projectName,
				validate: (value) => {
					const v = validateProjectNameFormat(value);
					if (!v.valid) return v.message;
					if (value === projectName) return "新名称不能与当前名称相同";
					if (projectExists(value)) return "项目已存在";
					return undefined;
				},
			});

			if (result === CANCEL) {
				outro(pc.dim("已取消"));
				process.exit(0);
			}

			newProjectName = (result as string).trim();
		}

		const nameCheck = validateProjectNameFormat(newProjectName);
		if (!nameCheck.valid) {
			printError(nameCheck.message || "项目名称无效");
			process.exit(1);
		}

		if (newProjectName === projectName) {
			printError("新名称不能与当前名称相同");
			process.exit(1);
		}

		if (projectExists(newProjectName)) {
			printError(`项目已存在: ${newProjectName}`);
			process.exit(1);
		}

		intro(bgOrange(" 重命名项目 "));
		console.log();
		console.log(pc.dim("  当前名称: ") + brand.secondary(projectName));
		console.log(pc.dim("  新名称:   ") + brand.primary(newProjectName));
		console.log();

		// 1. 重命名本地目录
		const s = spinner();
		s.start("正在重命名本地目录...");

		const newPath = getProjectPath(newProjectName);
		const moveResult = await moveWithTimeout(projectPath, newPath, 5000);

		if (!moveResult.success) {
			s.stop("重命名失败");
			printError(moveResult.error || "未知错误");
			process.exit(1);
		}

		// 清理残留的源目录（如 .next 等被锁定的文件可能残留）
		if (await fse.pathExists(projectPath)) {
			await fse.remove(projectPath);
		}

		const oldMeta = projects.find((p) => p.name === projectName);
		deleteProjectMeta(projectName);
		saveProjectMeta(newProjectName, {
			template: oldMeta?.template,
			tags: oldMeta?.tags,
		});

		s.stop(`${brand.success("✓")} 已重命名: ${brand.primary(newProjectName)}`);

		// 2. 询问是否重命名远程仓库
		const remoteUrl = await getRemoteOrigin(newPath);
		const repoSlug = remoteUrl ? extractRepoSlug(remoteUrl) : null;

		if (repoSlug) {
			const currentRepoName = repoSlug.split("/")[1];
			console.log();
			console.log(
				pc.dim("  当前远程仓库: ") + pc.underline(`github.com/${repoSlug}`),
			);
			console.log();

			const remoteName = await text({
				message: "输入新的远程仓库名称（留空跳过）:",
				placeholder: currentRepoName,
				initialValue: newProjectName,
			});

			if (!isCancel(remoteName) && (remoteName as string).trim()) {
				const finalName = (remoteName as string).trim();
				const renameSpinner = spinner();
				renameSpinner.start("正在重命名 GitHub 仓库...");

				const result = await renameGitHubRepo(repoSlug, finalName);

				if (!result.success) {
					renameSpinner.stop("重命名 GitHub 仓库失败");
					printError(result.error || "未知错误");
				} else {
					renameSpinner.stop(
						`${brand.success("✓")} GitHub 仓库已重命名为 ${brand.primary(finalName)}`,
					);

					// 更新本地 git remote URL
					const owner = repoSlug.split("/")[0];
					let newRemoteUrl: string;
					if (remoteUrl?.includes("@")) {
						newRemoteUrl = `git@github.com:${owner}/${finalName}.git`;
					} else {
						const tokenMatch = remoteUrl?.match(
							/^(https?:\/\/[^@]*@)?github\.com/,
						);
						const prefix = tokenMatch?.[1] ?? "https://github.com/";
						newRemoteUrl = `${prefix}github.com/${owner}/${finalName}.git`;
					}
					await execAndCapture(
						`git remote set-url origin ${newRemoteUrl}`,
						newPath,
					);
				}
			}
		}

		console.log();
		outro(brand.success("✨ 重命名完成！"));
	});
