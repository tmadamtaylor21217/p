import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	confirm,
	intro,
	isCancel,
	outro,
	select,
	spinner,
	text,
} from "@clack/prompts";
import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";

import { loadConfig } from "../core/config";
import { runHooks } from "../core/hooks";
import {
	getProjectPath,
	listProjects,
	projectExists,
	saveProjectMeta,
	validateProjectName,
	validateProjectNameFormat,
} from "../core/project";
import {
	applyTemplate,
	getAllTemplates,
	getTemplateChoices,
} from "../core/template";
import { maybeWatchCchiveSync } from "../utils/cchive";
import {
	buildNamingPrompt,
	generateNamesViaClaude,
	isDescriptionInput,
	type NameSuggestion,
} from "../utils/naming";
import { CONFIG_PATH, PROJECTS_DIR } from "../utils/paths";
import { isClaudeCommand, resolveOverflowSettings } from "../utils/providers";
import { CANCEL, selectOrInput } from "../utils/select-or-input";
import {
	commandExists,
	execAndCapture,
	execInDir,
	isTUICommand,
	openWithIDE,
	supportsPromptArg,
} from "../utils/shell";
import { bgOrange, brand, printError, printInfo } from "../utils/ui";

/**
 * 项目已存在：提示后直接打开已有项目
 */
async function openExistingProject(
	projectName: string,
	openIde: string,
): Promise<void> {
	const projectPath = getProjectPath(projectName);
	printError(
		`项目已存在: ${brand.primary(projectName)}${pc.dim("，直接打开")}`,
	);

	if (isTUICommand(openIde)) {
		// TUI（如 claude）前台运行，不能用 spinner
		try {
			await openWithIDE(openIde, projectPath);
		} catch (error) {
			printError((error as Error).message);
			console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
		}
		return;
	}

	const s = spinner();
	s.start(`正在打开 ${openIde}...`);
	try {
		await openWithIDE(openIde, projectPath);
		s.stop(`已用 ${openIde} 打开`);
	} catch (error) {
		s.stop(`打开 ${openIde} 失败`);
		printError((error as Error).message);
		console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
	}
}

export const newCommand = new Command("new")
	.alias("n")
	.alias("create")
	.description("创建新项目")
	.argument("[name]", "项目名称（支持 #tag 添加标签）")
	.option("-t, --template [template]", "使用指定模板")
	.option("-i, --ide <ide>", "指定打开方式（claude, cursor, code 等）")
	.allowExcessArguments(true)
	.action(
		async (
			name?: string,
			options?: {
				template?: string | boolean;
				ide?: string;
			},
			command?: Command,
		) => {
			// 检测 p new -- <command> 模式
			const rawArgs = process.argv;
			const ddIdx = rawArgs.indexOf("--");
			const newIdx = rawArgs.lastIndexOf("new");

			if (ddIdx !== -1 && ddIdx > newIdx) {
				let cmd = rawArgs.slice(ddIdx + 1).join(" ");
				if (!cmd) {
					printError("-- 后需要提供命令");
					process.exit(1);
				}

				// 检测别名：第一个 token 匹配 config.shortcuts
				const config = loadConfig();
				const tokens = rawArgs.slice(ddIdx + 1);
				const firstToken = tokens[0] ?? "";
				const alias = config.shortcuts?.[firstToken];
				if (alias) {
					const remaining = tokens.slice(1).join(" ");
					cmd = remaining ? `${alias} ${remaining}` : alias;
					console.log();
					console.log(
						pc.dim("  别名: ") +
							brand.primary(firstToken) +
							pc.dim(` → ${alias}`),
					);
					console.log(pc.dim("  配置: ") + pc.underline(CONFIG_PATH));
				}

				console.log();
				console.log(pc.dim("  工作目录: ") + pc.underline(PROJECTS_DIR));
				console.log();

				await fse.ensureDir(PROJECTS_DIR);

				const existingProjects = new Set(listProjects().map((p) => p.name));

				const result = await execInDir(cmd, PROJECTS_DIR, {
					captureStderr: true,
				});

				if (!result.success) {
					// 扫描新创建的目录
					let createdDirs: string[] = [];
					try {
						const afterAll = await fse.readdir(PROJECTS_DIR, {
							withFileTypes: true,
						});
						const afterDirNames = afterAll
							.filter((e) => e.isDirectory())
							.map((e) => e.name);
						createdDirs = afterDirNames.filter(
							(name) => !existingProjects.has(name),
						);
					} catch {
						// ignore
					}

					// pnpm ignored builds recovery
					if (
						result.stderr?.includes("ERR_PNPM_IGNORED_BUILDS") &&
						createdDirs.length > 0
					) {
						const projectDir = join(PROJECTS_DIR, createdDirs[0] ?? "");
						console.log();
						const runApprove = await confirm({
							message:
								"检测到 pnpm 需要批准构建脚本，是否运行 pnpm approve-builds？",
						});

						if (!isCancel(runApprove) && runApprove) {
							console.log();
							await execInDir("pnpm approve-builds", projectDir);
						}
					} else if (createdDirs.length === 0) {
						// GitHub API rate limit recovery
						if (
							!process.env.GITHUB_TOKEN &&
							result.stderr?.toLowerCase().includes("rate limit") &&
							(await commandExists("gh"))
						) {
							const retry = await confirm({
								message:
									"检测到 GitHub API 速率限制，是否使用当前 gh auth 的 token 重试？",
							});

							if (!isCancel(retry) && retry) {
								const tokenResult = await execAndCapture(
									"gh auth token",
									process.cwd(),
								);
								if (tokenResult.success && tokenResult.output) {
									const token = tokenResult.output.trim();
									process.env.GITHUB_TOKEN = token;

									const patchFile = join(tmpdir(), "p-github-auth-patch.cjs");
									fse.writeFileSync(
										patchFile,
										`const _f=globalThis.fetch;globalThis.fetch=async(u,o={})=>{const s=typeof u==="string"?u:u?.url||"";if(s.includes("api.github.com"))o={...o,headers:{...o.headers,Authorization:"Bearer "+process.env.GITHUB_TOKEN}};return _f(u,o)};`,
									);
									const prevNodeOpts = process.env.NODE_OPTIONS || "";
									process.env.NODE_OPTIONS =
										prevNodeOpts +
										` --require ${patchFile.replace(/\\/g, "/")}`;

									console.log();
									console.log(pc.dim("  已注入 GITHUB_TOKEN，正在重试..."));
									console.log();
									const retryResult = await execInDir(cmd, PROJECTS_DIR);

									process.env.NODE_OPTIONS = prevNodeOpts || undefined;
									try {
										fse.unlinkSync(patchFile);
									} catch {}

									if (!retryResult.success) {
										console.log();
										printError("重试仍然失败");
										process.exit(1);
									}
								} else {
									console.log();
									printError("获取 gh auth token 失败");
									process.exit(1);
								}
							} else {
								console.log();
								printError("命令执行失败");
								process.exit(1);
							}
						} else {
							console.log();
							printError("命令执行失败");
							process.exit(1);
						}
					}
				}

				// 扫描新项目目录并创建
				const entries = await fse.readdir(PROJECTS_DIR, {
					withFileTypes: true,
				});
				const newProjects: string[] = [];

				for (const entry of entries) {
					if (entry.isDirectory() && !existingProjects.has(entry.name)) {
						saveProjectMeta(entry.name, {});
						newProjects.push(entry.name);
					}
				}

				console.log();
				if (newProjects.length > 0) {
					const config = loadConfig();
					for (const n of newProjects) {
						console.log(
							`  ${brand.success("✓")} 已创建项目: ${brand.primary(n)}`,
						);
					}

					// 用 IDE 打开第一个新项目
					const firstProject = getProjectPath(newProjects[0] ?? "");
					const openIde = options?.ide || config.ide;

					if (isTUICommand(openIde)) {
						// TUI（如 claude）前台运行，不能用 spinner（会污染交互界面）
						console.log(
							pc.dim(`  正在启动 ${openIde}: `) +
								brand.primary(newProjects[0] ?? ""),
						);
						// CCHive 同步由 openWithIDE 的 TUI 分支统一处理
						try {
							await openWithIDE(openIde, firstProject);
						} catch (error) {
							printError((error as Error).message);
						}
					} else {
						const s = spinner();
						s.start(`正在打开 ${openIde}...`);
						try {
							await openWithIDE(openIde, firstProject);
							s.stop(`已用 ${openIde} 打开`);
						} catch (error) {
							s.stop("打开失败");
							printError((error as Error).message);
						}
					}
				} else {
					printInfo("未检测到新项目目录");
				}

				return;
			}

			const config = loadConfig();
			const allTemplates = await getAllTemplates(config.templates);

			// 从名称参数中提取 #tag（如 p new myproj #clone #pnpm）
			const nameParts = (name || "").split(/\s+/);
			const tags = nameParts
				.filter((p) => p.startsWith("#"))
				.map((t) => t.slice(1).toLowerCase());
			const cleanName =
				nameParts.filter((p) => !p.startsWith("#")).join(" ") || name;

			// 完整位置参数（剔除 #tag）：含中文或多个词 → 视为需求描述
			const rawInput = (command?.args ?? [])
				.filter((token) => !token.startsWith("#"))
				.join(" ")
				.trim();
			const isDesc = isDescriptionInput(rawInput);

			// 快速模式：单个合法项目名，无 -t → 使用 empty 模板
			const isQuickMode = !isDesc && cleanName && !options?.template;

			if (isQuickMode) {
				// 验证项目名称格式
				const validation = validateProjectNameFormat(cleanName);
				if (!validation.valid) {
					printError(validation.message ?? "项目名称无效");
					process.exit(1);
				}

				// 项目已存在：提示后直接打开
				if (projectExists(cleanName)) {
					await openExistingProject(cleanName, options?.ide || config.ide);
					return;
				}

				const projectPath = getProjectPath(cleanName);

				// 创建空目录
				try {
					await fse.ensureDir(projectPath);
				} catch (error) {
					const err = error as Error;
					printError(err.message);
					process.exit(1);
				}

				// 执行 empty 模板的 hooks
				const emptyTemplate = config.templates.empty;

				if (emptyTemplate?.hooks && emptyTemplate.hooks.length > 0) {
					await runHooks(config, "empty", projectPath, cleanName);
				}

				// 保存项目元数据
				saveProjectMeta(cleanName, { template: "empty", tags });

				// 打开
				const openIde = options?.ide || config.ide;

				if (isTUICommand(openIde)) {
					// TUI（如 claude）先打印结果再进入会话，退出会话后结束
					console.log(
						brand.success("✓") +
							" " +
							brand.primary(name ?? cleanName) +
							pc.dim(` 已创建，启动 ${openIde}...`),
					);
					try {
						await openWithIDE(openIde, projectPath);
					} catch (error) {
						printError((error as Error).message);
						console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
					}
					return;
				}

				try {
					await openWithIDE(openIde, projectPath);
					console.log(
						brand.success("✓") +
							" " +
							brand.primary(name ?? cleanName) +
							pc.dim(" 已创建并打开"),
					);
				} catch (error) {
					console.log();
					printError((error as Error).message);
					console.log();
					console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
					console.log();
				}
				return;
			}

			// 交互模式
			intro(bgOrange(" 创建新项目 "));

			// 1. 获取项目名称
			let projectName = isDesc ? "" : cleanName;

			// 需求描述模式：调用本地 claude CLI 生成候选项目名
			let description = "";
			if (isDesc) {
				description = rawInput;

				const seen: string[] = []; // 换一批时排除的已生成名称
				let suggestions: NameSuggestion[] = [];

				const filterSuggestions = (items: NameSuggestion[]): NameSuggestion[] =>
					items.filter(
						(s) =>
							validateProjectNameFormat(s.name).valid && !projectExists(s.name),
					);

				let hasClaude = await commandExists("claude");
				if (hasClaude) {
					const sGen = spinner();
					sGen.start("正在生成候选项目名…");
					const result = await generateNamesViaClaude(
						buildNamingPrompt(description),
					);
					if (result.ok) {
						suggestions = filterSuggestions(result.suggestions);
						seen.push(...result.suggestions.map((s) => s.name));
						sGen.stop(`已生成 ${suggestions.length} 个候选名`);
					} else {
						hasClaude = false;
						sGen.stop("候选名生成失败");
						console.log(pc.dim(`  原因: ${result.error}（可直接手动输入）`));
					}
				} else {
					console.log(pc.dim("  未检测到 claude CLI，请直接输入项目名"));
				}

				if (hasClaude) {
					// 选择循环
					for (;;) {
						const choice = await selectOrInput({
							message: "选择项目名称:",
							options: [
								...suggestions.map((s) => ({
									value: s.name,
									label: s.name,
									hint: s.reason ? pc.dim(s.reason) : undefined,
								})),
								{
									value: "__regenerate__",
									label: pc.cyan("换一批"),
									hint: "重新生成",
								},
							],
							placeholder: "直接输入自定义名称...",
							validate: (value) => {
								const validation = validateProjectName(value);
								if (!validation.valid) return validation.message;
							},
						});

						if (choice === CANCEL) {
							outro(pc.dim("已取消"));
							process.exit(0);
						}

						if (choice === "__regenerate__") {
							const sRegen = spinner();
							sRegen.start("换一批生成中…");
							const result = await generateNamesViaClaude(
								buildNamingPrompt(description, seen),
							);
							if (result.ok) {
								suggestions = filterSuggestions(result.suggestions);
								seen.push(...result.suggestions.map((s) => s.name));
								sRegen.stop(`已生成 ${suggestions.length} 个候选名`);
							} else {
								sRegen.stop("重新生成失败，保留上一批");
							}
							continue;
						}

						projectName = choice as string;
						break;
					}
				}
			}

			if (!projectName) {
				const result = await text({
					message: "请输入项目名称:",
					placeholder: "my-awesome-project",
					validate: (value) => {
						const validation = validateProjectName(value);
						if (!validation.valid) return validation.message;
					},
				});

				if (isCancel(result)) {
					outro(pc.dim("已取消"));
					process.exit(0);
				}
				projectName = result as string;
			} else {
				// 验证项目名称（命令行传入或描述命名）
				const validation = validateProjectName(projectName);
				if (!validation.valid) {
					// 项目已存在：收尾后直接打开
					if (projectExists(projectName)) {
						outro(pc.dim("直接打开已有项目"));
						await openExistingProject(projectName, options?.ide || config.ide);
						return;
					}
					printError(validation.message ?? "项目名称无效");
					process.exit(1);
				}
			}

			// 2. 获取模板
			let templateKey: string;
			const templateChoices = getTemplateChoices(allTemplates);

			if (options?.template === true || options?.template === "") {
				// -t 没有值，显示选择菜单
				const result = await select({
					message: "请选择项目模板:",
					options: templateChoices,
				});

				if (isCancel(result)) {
					outro(pc.dim("已取消"));
					process.exit(0);
				}
				templateKey = result as string;
			} else if (options?.template) {
				// -t 有值
				templateKey = options.template;
				if (!allTemplates[templateKey]) {
					// 模糊匹配
					const q = templateKey.toLowerCase();
					const keys = Object.keys(allTemplates);
					const matched = keys.filter((k) => k.toLowerCase().includes(q));

					if (matched.length === 1) {
						templateKey = matched[0] ?? templateKey;
					} else if (matched.length > 1) {
						const result = await select({
							message: `模板 '${options.template}' 匹配到多个:`,
							options: matched.map((k) => ({
								value: k,
								label: allTemplates[k]?.name ?? k,
							})),
						});
						if (isCancel(result)) {
							outro(pc.dim("已取消"));
							process.exit(0);
						}
						templateKey = result as string;
					} else {
						printError(`模板不存在: ${templateKey}`);
						console.log(pc.dim(`可用模板: ${keys.join(", ")}`));
						process.exit(1);
					}
				}
			} else if (isDesc) {
				// 需求描述模式：跳过模板选择，直接用 empty 模板
				templateKey = "empty";
			} else {
				// 没有 -t 参数但进入了交互模式（没有项目名）
				const result = await select({
					message: "请选择项目模板:",
					options: templateChoices,
				});

				if (isCancel(result)) {
					outro(pc.dim("已取消"));
					process.exit(0);
				}
				templateKey = result as string;
			}

			const template = allTemplates[templateKey];
			if (!template) {
				printError(`模板不存在: ${templateKey}`);
				process.exit(1);
			}

			const projectPath = getProjectPath(projectName);

			// 3. 显示信息
			console.log();
			console.log(pc.dim("  项目名称: ") + brand.primary(projectName));
			console.log(pc.dim("  使用模板: ") + brand.secondary(template.name));
			console.log(pc.dim("  项目路径: ") + pc.dim(projectPath));

			// 4. 创建项目目录
			try {
				await fse.ensureDir(projectPath);
			} catch (error) {
				const err = error as Error;
				printError(err.message);
				process.exit(1);
			}

			// 5. 应用模板（显示命令和输出）
			const templateResult = await applyTemplate(template, projectPath);

			if (!templateResult.success) {
				// 模板应用失败，删除已创建的项目目录
				try {
					await fse.remove(projectPath);
				} catch {
					// 忽略删除失败的错误，继续显示模板应用失败的错误
				}
				printError(templateResult.message);
				process.exit(1);
			}

			// 6. 执行 hooks（显示命令和输出）
			await runHooks(config, templateKey, projectPath, projectName);

			// 7. 保存项目元数据（需求描述即 first prompt）
			saveProjectMeta(projectName, {
				template: templateKey,
				tags,
				firstPrompt: description || undefined,
			});

			// 8. 打开
			const openIde = options?.ide || config.ide;
			console.log();

			if (isTUICommand(openIde) && supportsPromptArg(openIde)) {
				// 支持 prompt 的 TUI（claude）：收尾后带需求描述进入会话，直接开始开发
				// （直接 spawn 不走 openWithIDE，CCHive 同步在此单独挂）
				outro(brand.success("✨ 项目创建成功！进入开发…"));
				const watcher = maybeWatchCchiveSync(config.cchiveSync, projectPath);
				const bin = openIde.trim().split(/\s+/)[0] ?? openIde;

				// 默认渠道（套餐）全账号并发满 → 溢出到配置的 API provider
				const overflow = isClaudeCommand(bin)
					? await resolveOverflowSettings()
					: null;
				if (overflow) {
					printInfo(
						`默认渠道已满，溢出到 ${brand.primary(overflow.provider.name)}`,
					);
				}

				const proc = Bun.spawn(
					[
						bin,
						"--dangerously-skip-permissions",
						...(overflow ? ["--settings", overflow.settingsPath] : []),
						description,
					],
					{
						cwd: projectPath,
						stdin: "inherit",
						stdout: "inherit",
						stderr: "inherit",
						env: { ...process.env },
					},
				);
				try {
					await proc.exited;
				} finally {
					watcher?.stop();
				}
				return;
			}

			if (isTUICommand(openIde)) {
				// TUI（如 claude）先收尾输出，再前台进入会话
				// （CCHive 同步由 openWithIDE 的 TUI 分支统一处理）
				outro(brand.success("✨ 项目创建成功！"));
				try {
					await openWithIDE(openIde, projectPath);
				} catch (error) {
					printError((error as Error).message);
					console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
				}
				return;
			}

			const s = spinner();
			s.start(`正在打开 ${openIde}...`);
			try {
				await openWithIDE(openIde, projectPath);
				s.stop(`已用 ${openIde} 打开`);
			} catch (error) {
				s.stop(`打开 ${openIde} 失败`);
				console.log();
				printError((error as Error).message);
				console.log();
				console.log(pc.dim("  项目路径: ") + pc.underline(projectPath));
			}

			// 9. 完成
			outro(brand.success("✨ 项目创建成功！"));
		},
	);
