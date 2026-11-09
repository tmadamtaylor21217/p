import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";
import { listProjects } from "../core/project";
import { getLocalTemplates, getPublishedTemplates } from "../core/template";
import { TEMPLATES_DIR } from "../utils/paths";
import { brand, formatRelativeTime, printInfo, wrapByWidth } from "../utils/ui";

async function listTemplates(remoteOnly: boolean) {
	const published = getPublishedTemplates();

	if (remoteOnly) {
		const entries = Object.entries(published);
		if (entries.length === 0) {
			console.log();
			printInfo(
				`暂无远程模板，使用 ${brand.primary("p templates publish")} 发布模板`,
			);
			console.log();
			return;
		}

		console.log();
		console.log(
			brand.primary("  📦 远程模板") + pc.dim(` (${entries.length} 个)`),
		);
		console.log(pc.dim("  ─".repeat(20)));
		console.log();

		for (const [, meta] of entries) {
			console.log(`  ${brand.secondary("◆")} ${brand.bold(meta.repo)}`);
			console.log(pc.dim(`    ${meta.url}`));
			console.log();
		}

		console.log(
			pc.dim("  提示: 使用 ") +
				brand.primary("p templates add") +
				pc.dim(" 添加模板"),
		);
		console.log();
		return;
	}

	if (!(await fse.pathExists(TEMPLATES_DIR))) {
		console.log();
		printInfo(`暂无模板，使用 ${brand.primary("p templates add")} 添加模板`);
		console.log();
		return;
	}

	const localTemplates = await getLocalTemplates();
	const entries = Object.values(localTemplates);

	if (entries.length === 0) {
		console.log();
		printInfo(`暂无模板，使用 ${brand.primary("p templates add")} 添加模板`);
		console.log();
		return;
	}

	console.log();
	console.log(
		brand.primary("  📦 模板列表") + pc.dim(` (${entries.length} 个)`),
	);
	console.log(pc.dim("  ─".repeat(20)));
	console.log();

	for (const tpl of entries) {
		const meta = published[tpl.name];
		const remoteTag = meta ? pc.cyan("  🌐 remote") : "";

		console.log(
			`  ${brand.secondary("◆")} ${brand.bold(tpl.name)}${remoteTag}`,
		);
		console.log(pc.dim(`    ${TEMPLATES_DIR}/${tpl.dir || tpl.name}`));
		if (meta) {
			console.log(pc.dim(`    ${meta.url}`));
		}
		console.log();
	}

	console.log(
		pc.dim("  提示: 使用 ") +
			brand.primary("p templates add") +
			pc.dim(" 添加模板"),
	);
	console.log();
}

export const lsCommand = new Command("ls")
	.alias("list")
	.description("列出所有项目")
	.argument("[filter]", "templates / t 列出模板")
	.option("-r, --remote", "配合 templates / t 使用，只列出远程模板")
	.action(async (filter?: string, options?: { remote?: boolean }) => {
		if (filter === "templates" || filter === "t") {
			await listTemplates(!!options?.remote);
			return;
		}

		const projects = listProjects();

		if (projects.length === 0) {
			console.log();
			printInfo(`暂无项目，使用 ${brand.primary("p new")} 创建新项目`);
			console.log();
			return;
		}

		console.log();
		console.log(
			brand.primary("  📂 项目列表") + pc.dim(` (${projects.length} 个)`),
		);
		console.log(pc.dim("  ─".repeat(20)));
		console.log();

		for (const project of projects) {
			const timeStr = formatRelativeTime(project.modifiedAt);
			const templateTag = project.template
				? ` ${pc.cyan(`[${project.template}]`)}`
				: "";
			const tagDisplay =
				project.tags && project.tags.length > 0
					? ` ${project.tags.map((t) => pc.magenta(`#${t}`)).join(" ")}`
					: "";

			console.log(
				"  " +
					brand.secondary("◆") +
					" " +
					brand.bold(project.name) +
					templateTag +
					tagDisplay +
					pc.dim(`  ${timeStr}`),
			);
			console.log(pc.dim(`    ${project.path}`));
			// first prompt 放路径下面，按终端宽度折行
			if (project.firstPrompt) {
				const columns = process.stdout.columns ?? 80;
				for (const line of wrapByWidth(project.firstPrompt, columns - 4)) {
					console.log(pc.dim(`    ${line}`));
				}
			}
			console.log();
		}

		console.log(
			pc.dim("  提示: 使用 ") + brand.primary("p open") + pc.dim(" 打开项目"),
		);
		console.log();
	});
