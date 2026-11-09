import pc from "picocolors";
import { truncateByWidth } from "./ui";

/**
 * 模糊匹配项目（子串匹配项目名、模板名或标签）
 */
export function filterProjects<
	T extends { name: string; template?: string; tags?: string[] },
>(projects: T[], query: string): T[] {
	const q = query.toLowerCase();
	return projects.filter(
		(p) =>
			p.name.toLowerCase().includes(q) ||
			p.template?.toLowerCase().includes(q) ||
			p.tags?.some((tag) => tag.toLowerCase().includes(q)),
	);
}

/**
 * 构建项目选项的 hint 文本
 */
export function projectHint(p: {
	template?: string;
	tags?: string[];
	path: string;
	firstPrompt?: string;
}): string {
	if (p.firstPrompt) {
		return pc.dim(truncateByWidth(p.firstPrompt, 60));
	}
	const hints: string[] = [];
	if (p.template) hints.push(pc.cyan(p.template));
	if (p.tags && p.tags.length > 0) {
		hints.push(p.tags.map((t) => pc.magenta(`#${t}`)).join(" "));
	}
	return hints.length > 0 ? hints.join(" ") : pc.dim(p.path);
}
