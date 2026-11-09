import { Command } from "commander";

import { loadConfig } from "../core/config";
import { printError } from "../utils/ui";
import { resolveOpenIde, selectAndOpenProjects } from "./open";

export const searchCommand = new Command("search")
	.alias("s")
	.description("模糊搜索项目（实时筛选，回车打开；支持多选批量）")
	.argument("[name]", "搜索关键词（项目名/模板/标签模糊匹配）")
	.option("-i, --ide <ide>", "指定 IDE")
	.action(async (name?: string, options?: { ide?: string }) => {
		const config = loadConfig();
		const ide = await resolveOpenIde(config, options).catch((error: Error) => {
			printError(error.message);
			process.exit(1);
		});
		await selectAndOpenProjects(ide, options, name);
	});
