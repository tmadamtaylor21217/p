import * as readline from "node:readline";
import { Writable } from "node:stream";
import { Command } from "commander";
import fse from "fs-extra";
import pc from "picocolors";
import { cursor as ansiCursor } from "sisteransi";
import { loadConfig } from "../core/config";
import { deleteProjectMeta, listProjects } from "../core/project";
import { openWithIDE } from "../utils/shell";
import {
	brand,
	formatRelativeTime,
	printInfo,
	truncateByWidth,
} from "../utils/ui";

const MAX_VISIBLE = 10;

export const recentCommand = new Command("recent")
	.alias("re")
	.description("查看最近项目")
	.action(async () => {
		const config = loadConfig();
		const projects = listProjects();

		if (projects.length === 0) {
			console.log();
			printInfo(`暂无项目，使用 ${brand.primary("p new")} 创建新项目`);
			console.log();
			return;
		}

		const recent = projects.slice(0, config.recentCount ?? 5);

		const stdin = process.stdin as NodeJS.ReadStream;
		const stdout = process.stdout as NodeJS.WriteStream;

		const interceptStream = new Writable({
			write(_chunk, _encoding, callback) {
				callback();
			},
		});

		stdin.setRawMode(true);
		stdin.resume();
		stdout.write(ansiCursor.hide);

		const rl = readline.createInterface({
			input: stdin,
			output: interceptStream,
			terminal: true,
		});
		readline.emitKeypressEvents(stdin, rl);

		let selectedIndex = 0;
		let scrollOffset = 0;
		let blockHeight = 0;
		let done = false;
		const currentProjects = recent;
		let mode: "list" | "confirm" | "deleting" = "list";

		function render() {
			const parts: string[] = [];
			if (blockHeight > 0) parts.push(ansiCursor.up(blockHeight));

			const lines: string[] = [];

			// 标题
			lines.push(
				`  ${brand.secondary("◆")} 最近项目 ${pc.dim(`(${currentProjects.length})`)}`,
			);
			lines.push(`  ${brand.secondary("│")}`);

			// 项目列表
			const visibleCount = Math.min(
				MAX_VISIBLE,
				currentProjects.length - scrollOffset,
			);
			const visible = currentProjects.slice(
				scrollOffset,
				scrollOffset + visibleCount,
			);

			for (let i = 0; i < visible.length; i++) {
				const idx = scrollOffset + i;
				const isSelected = idx === selectedIndex;
				const p = visible[i];
				if (!p) continue;
				const marker = isSelected ? brand.primary("◉") : pc.dim("○");
				const name = isSelected ? brand.bold(p.name) : p.name;
				const time = pc.dim(`  ${formatRelativeTime(p.modifiedAt)}`);
				const note = p.firstPrompt
					? pc.dim(` — ${truncateByWidth(p.firstPrompt, 40)}`)
					: "";
				const tpl = p.template ? ` ${pc.cyan(`[${p.template}]`)}` : "";
				const tags = p.tags?.length
					? ` ${pc.magenta(p.tags.map((t) => `#${t}`).join(" "))}`
					: "";

				lines.push(
					`  ${brand.secondary("│")} ${marker} ${name}${tpl}${tags}${note}${time}`,
				);
			}

			// 底部提示：根据模式变化
			if (mode === "list") {
				lines.push(
					`  ${brand.secondary("└")} ${pc.dim("j/k 移动 · o 打开 · d 删除 · q 退出")}`,
				);
			} else if (mode === "confirm") {
				const p = currentProjects[selectedIndex];
				lines.push(
					`  ${brand.secondary("└")} ${pc.yellow(`确认删除 ${p?.name}？`)} ${pc.inverse(" Y ")}/n`,
				);
			} else if (mode === "deleting") {
				lines.push(`  ${brand.secondary("└")} ${pc.dim("正在删除...")}`);
			}

			for (const line of lines) {
				parts.push(`${line}\x1b[K\n`);
			}

			if (blockHeight > lines.length) {
				for (let i = lines.length; i < blockHeight; i++) {
					parts.push("\x1b[K\n");
				}
				parts.push(ansiCursor.up(blockHeight - lines.length));
			}

			stdout.write(parts.join(""));
			blockHeight = lines.length;
		}

		render();

		function scrollSelectedIntoView() {
			if (selectedIndex < scrollOffset) {
				scrollOffset = selectedIndex;
			} else if (selectedIndex >= scrollOffset + MAX_VISIBLE) {
				scrollOffset = selectedIndex - MAX_VISIBLE + 1;
			}
		}

		function cleanup() {
			if (done) return;
			done = true;
			stdin.removeListener("keypress", onKey);
			stdin.setRawMode(false);
			stdin.pause();
			rl.close();
			stdout.write(ansiCursor.show);
		}

		function clearBlock() {
			if (blockHeight === 0) return;
			const parts: string[] = [];
			parts.push(ansiCursor.up(blockHeight));
			for (let i = 0; i < blockHeight; i++) {
				parts.push("\x1b[2K\n");
			}
			parts.push(ansiCursor.up(blockHeight));
			stdout.write(parts.join(""));
			blockHeight = 0;
		}

		async function handleOpen() {
			const project = currentProjects[selectedIndex];
			if (!project) return;

			clearBlock();
			blockHeight = 0;

			stdout.write(
				`  ${brand.success("✓")} 正在打开 ${brand.primary(project.name)}...\n`,
			);

			// 先释放 stdin、恢复终端状态，避免与 TUI（如 claude）抢占键盘输入
			cleanup();

			try {
				await openWithIDE(config.ide, project.path);
			} catch (error) {
				stdout.write(`  ${pc.red("✗")} ${(error as Error).message}\n`);
			}
		}

		async function handleDeleteConfirm() {
			const project = currentProjects[selectedIndex];
			if (!project) return;

			mode = "deleting";
			render();

			try {
				await fse.remove(project.path);
				deleteProjectMeta(project.name);
				currentProjects.splice(selectedIndex, 1);
				if (selectedIndex >= currentProjects.length) {
					selectedIndex = Math.max(0, currentProjects.length - 1);
				}
				scrollSelectedIntoView();
			} catch (_error) {
				// 删除失败，保持列表不变
			}

			if (currentProjects.length === 0) {
				clearBlock();
				blockHeight = 0;
				cleanup();
				console.log();
				printInfo("已无项目");
				console.log();
				return;
			}

			mode = "list";
			render();
		}

		function onKey(_char: string, key: readline.Key) {
			if (done) return;

			// confirm 模式下的按键处理
			if (mode === "confirm") {
				if (
					key.name === "escape" ||
					key.name === "q" ||
					key.sequence === "\x03"
				) {
					mode = "list";
					render();
					return;
				}
				if (key.name === "return" || key.name === "y") {
					handleDeleteConfirm();
					return;
				}
				if (key.name === "n") {
					mode = "list";
					render();
					return;
				}
				return;
			}

			if (
				key.sequence === "\x03" ||
				key.name === "q" ||
				key.name === "escape"
			) {
				clearBlock();
				blockHeight = 0;
				cleanup();
				return;
			}

			switch (key.name) {
				case "up":
				case "k":
					if (selectedIndex > 0) selectedIndex--;
					scrollSelectedIntoView();
					break;
				case "down":
				case "j":
					if (selectedIndex < currentProjects.length - 1) selectedIndex++;
					scrollSelectedIntoView();
					break;
				case "o":
					handleOpen();
					return;
				case "d":
					mode = "confirm";
					break;
				default:
					return;
			}

			render();
		}

		stdin.on("keypress", onKey);
	});
