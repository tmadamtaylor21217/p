#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import pc from "picocolors";
import { addCommand } from "./commands/add";
import { cdCommand } from "./commands/cd";
import { claudeCommand } from "./commands/claude";
import { cloneCommand } from "./commands/clone";
import { configCommand } from "./commands/config";
import { copyCommand } from "./commands/copy";
import { deleteCommand } from "./commands/delete";
import { firstPromptCommand } from "./commands/first-prompt";
import { hookCommand } from "./commands/hook";
import { importCommand } from "./commands/import";
import { lsCommand } from "./commands/ls";
import { metaCommand } from "./commands/meta";
import { newCommand } from "./commands/new";
import { openCommand } from "./commands/open";
import { pathCommand } from "./commands/path";
import { projectCommand } from "./commands/project";
import { publishCommand } from "./commands/publish";
import { pushCommand } from "./commands/push";
import { recentCommand } from "./commands/recent";
import { renameCommand } from "./commands/rename";
import { runCommand } from "./commands/run";
import { syncCommand } from "./commands/sync";
import { tagCommand } from "./commands/tag";
import { templateCommand } from "./commands/template";
import { unzipCommand } from "./commands/unzip";
import { updateCommand } from "./commands/update";
import { ensureInitialized, migrateUserConfig } from "./core/config";
import { brand } from "./utils/ui";

// 读取版本号
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const program = new Command();

// 确保首次运行时初始化
await ensureInitialized();
// 清理配置中废弃的键（如已移除的 AI API 命名字段）
await migrateUserConfig();

program
	.name("p")
	.description(`${brand.primary("⚡ P")} v${pkg.version} — 项目管理工具`)
	.version(pkg.version);

// 显示所有 alias，长的排左边，短的排右边
const Help = (await import("commander")).Help;
// biome-ignore lint/suspicious/noExplicitAny: commander 的 prototype 签名缺类型导出
Help.prototype.subcommandTerm = (cmd: any) => {
	const all = [cmd.name(), ...cmd.aliases()];
	all.sort((a: string, b: string) => b.length - a.length);
	return all.join("|");
};
const origFormatHelp = Help.prototype.formatHelp;
// biome-ignore lint/suspicious/noExplicitAny: 同上，覆写 commander 内部方法需匹配原签名
Help.prototype.formatHelp = function (cmd: any, helper: any) {
	let output = origFormatHelp.call(this, cmd, helper);
	output += `\n  ${pc.dim("查看子命令详情:")} p ${pc.cyan("<command>")} -h\n`;
	return output;
};

// 注册子命令
program.addCommand(addCommand);
program.addCommand(claudeCommand);
program.addCommand(cdCommand);
program.addCommand(cloneCommand);
program.addCommand(copyCommand);
program.addCommand(newCommand);
program.addCommand(lsCommand);
program.addCommand(openCommand);
program.addCommand(pathCommand);
program.addCommand(deleteCommand);
program.addCommand(publishCommand);
program.addCommand(pushCommand);
program.addCommand(renameCommand);
program.addCommand(recentCommand);
program.addCommand(projectCommand);
program.addCommand(runCommand);
program.addCommand(importCommand);
program.addCommand(tagCommand);
program.addCommand(templateCommand);
program.addCommand(configCommand);
program.addCommand(hookCommand);
program.addCommand(metaCommand);
program.addCommand(firstPromptCommand);
program.addCommand(unzipCommand);
program.addCommand(updateCommand);
program.addCommand(syncCommand);

program.parse();
