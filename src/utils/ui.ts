import pc from "picocolors";

/**
 * 品牌颜色 - 橙色主题
 * 使用 ANSI 256 色码来实现橙色
 */
export const brand = {
	// 橙色 (ANSI 256: 208)
	primary: (text: string) => `\x1b[38;5;208m${text}\x1b[0m`,
	// 浅橙色 (ANSI 256: 214)
	secondary: (text: string) => `\x1b[38;5;214m${text}\x1b[0m`,
	success: pc.green,
	warning: pc.yellow,
	error: pc.red,
	dim: pc.dim,
	bold: pc.bold,
};

/**
 * 橙色背景
 */
export const bgOrange = (text: string) =>
	`\x1b[48;2;180;80;20m\x1b[38;2;255;255;255m\x1b[1m${text}\x1b[0m`;

/**
 * 打印欢迎横幅
 */
export function printBanner(): void {
	console.log();
	console.log(brand.primary("  ┌─────────────────────────────┐"));
	console.log(
		brand.primary("  │") +
			brand.bold("    ⚡ P 项目管理器     ") +
			brand.primary("│"),
	);
	console.log(brand.primary("  └─────────────────────────────┘"));
	console.log();
}

/**
 * 打印成功消息
 */
export function printSuccess(message: string): void {
	console.log(`${brand.success("✓")} ${message}`);
}

/**
 * 打印错误消息
 */
export function printError(message: string): void {
	console.log(`${brand.error("✗")} ${message}`);
}

/**
 * 打印警告消息
 */
export function printWarning(message: string): void {
	console.log(`${brand.warning("⚠")} ${message}`);
}

/**
 * 打印信息消息
 */
export function printInfo(message: string): void {
	console.log(`${brand.secondary("◆")} ${message}`);
}

/**
 * 打印路径
 */
export function printPath(label: string, path: string): void {
	console.log(pc.dim(`  ${label}: `) + pc.underline(path));
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} 天前`;
	if (hours > 0) return `${hours} 小时前`;
	if (minutes > 0) return `${minutes} 分钟前`;
	return "刚刚";
}

/**
 * 单个字符的终端显示宽度（CJK/全角按 2 列）
 */
function charDisplayWidth(codePoint: number): number {
	if (
		(codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
		(codePoint >= 0x2e80 && codePoint <= 0xa4cf) || // CJK 部首 ~ Yi 音节
		(codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul 音节
		(codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK 兼容表意
		(codePoint >= 0xfe30 && codePoint <= 0xfe4f) || // CJK 兼容形式
		(codePoint >= 0xff00 && codePoint <= 0xff60) || // 全角 ASCII / 假名
		(codePoint >= 0xffe0 && codePoint <= 0xffe6) || // 全角符号
		(codePoint >= 0x20000 && codePoint <= 0x3fffd) // CJK 扩展
	) {
		return 2;
	}
	return 1;
}

/**
 * 按显示宽度折行（用于长文本缩进展示）
 */
export function wrapByWidth(text: string, maxWidth: number): string[] {
	const lines: string[] = [];
	let line = "";
	let width = 0;

	for (const ch of Array.from(text)) {
		const w = charDisplayWidth(ch.codePointAt(0) ?? 0);
		if (width + w > maxWidth && line) {
			lines.push(line);
			line = "";
			width = 0;
		}
		line += ch;
		width += w;
	}

	if (line) lines.push(line);
	return lines.length > 0 ? lines : [""];
}

/**
 * 按显示宽度截断，超宽补省略号
 */
export function truncateByWidth(text: string, maxWidth: number): string {
	let width = 0;
	for (const [i, ch] of Array.from(text).entries()) {
		const w = charDisplayWidth(ch.codePointAt(0) ?? 0);
		if (width + w > maxWidth - 1) {
			return `${text.slice(0, i)}…`;
		}
		width += w;
	}
	return text;
}
