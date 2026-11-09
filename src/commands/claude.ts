import { outro, spinner } from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";

import { loadConfig } from "../core/config";
import { getProjectPath, listProjects, projectExists } from "../core/project";
import { maybeWatchCchiveSync } from "../utils/cchive";
import { CANCEL, liveSearch } from "../utils/live-search";
import { filterProjects, projectHint } from "../utils/project-search";
import { resolveOverflowSettings } from "../utils/providers";
import { brand, printError, printInfo } from "../utils/ui";

export const claudeCommand = new Command("claude")
	.alias("cc")
	.description("切换到项目目录并启动 Claude Code")
	.argument("[name]", "项目名称或搜索关键词")
	.action(async (name?: string) => {
		const projects = listProjects();

		if (projects.length === 0) {
			printInfo(`暂无项目，使用 ${brand.primary("p new")} 创建新项目`);
			return;
		}

		let projectName: string;

		if (!name) {
			const options = projects.map((p) => ({
				value: p.name,
				label: p.name,
				hint: projectHint(p),
			}));

			const result = await liveSearch({
				message: "选择项目:",
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
				multiSelect: false,
			});

			if (result === CANCEL) {
				outro(pc.dim("已取消"));
				process.exit(0);
			}

			projectName = result[0] ?? "";
		} else if (!projectExists(name)) {
			const filtered = filterProjects(projects, name);
			if (filtered.length === 1) {
				projectName = filtered[0]?.name ?? name;
				console.log(pc.dim("  匹配到: ") + brand.primary(projectName));
			} else if (filtered.length > 1) {
				console.log(pc.dim(`  匹配到 ${filtered.length} 个项目`));

				const options = projects.map((p) => ({
					value: p.name,
					label: p.name,
					hint: projectHint(p),
				}));

				const result = await liveSearch({
					message: "选择项目:",
					placeholder: "输入名称、模板或标签筛选",
					options,
					filterFn: (query: string) => {
						if (!query) return options;
						const f = filterProjects(projects, query);
						return f.map((p) => ({
							value: p.name,
							label: p.name,
							hint: projectHint(p),
						}));
					},
					initialQuery: name,
					multiSelect: false,
				});

				if (result === CANCEL) {
					outro(pc.dim("已取消"));
					process.exit(0);
				}

				projectName = result[0] ?? "";
			} else {
				printError(`项目不存在: ${name}`);
				console.log(
					pc.dim("使用 ") + brand.primary("p ls") + pc.dim(" 查看所有项目"),
				);
				process.exit(1);
			}
		} else {
			projectName = name;
		}

		const projectPath = getProjectPath(projectName);

		const s = spinner();
		s.start(`正在启动 Claude Code: ${brand.primary(projectName)}`);
		s.stop(
			`${brand.success("✓")} ${brand.primary("claude")} ${pc.dim(`— ${projectName}`)}`,
		);
		console.log();

		// 直接 spawn 不走 openWithIDE，CCHive 同步在此单独挂（cchiveSync 配置，默认开）
		const watcher = maybeWatchCchiveSync(loadConfig().cchiveSync, projectPath);

		// 默认渠道（套餐）全账号并发满 → 溢出到配置的 API provider。注入只能走
		// --settings 片段：settings.json 的 env 块会覆盖继承的进程环境变量。
		const overflow = await resolveOverflowSettings();
		const args = ["claude", "--dangerously-skip-permissions"];
		if (overflow) {
			args.push("--settings", overflow.settingsPath);
			printInfo(
				`默认渠道已满，溢出到 ${brand.primary(overflow.provider.name)}`,
			);
		}

		const proc = Bun.spawn(args, {
			cwd: projectPath,
			stdin: "inherit",
			stdout: "inherit",
			stderr: "inherit",
			env: { ...process.env },
		});

		let exitCode: number;
		try {
			exitCode = await proc.exited;
		} finally {
			watcher?.stop();
		}
		process.exit(exitCode);
	});
