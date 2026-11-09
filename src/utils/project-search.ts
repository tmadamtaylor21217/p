import pc from "picocolors";
import { truncateByWidth } from "./ui";

/**
 * 子序列模糊评分：query 各字符按顺序在 text 中匹配，不匹配返回 0。
 * 加权：连续匹配 > 词首边界（-_/_. 空格后或开头）> 靠前位置 > 散匹配。
 */
export function fuzzyScore(text: string, query: string): number {
	if (!query) return 1;
	const t = text.toLowerCase();
	const q = query.toLowerCase();
	let score = 0;
	let cursor = 0;
	let lastIdx = -2;
	let streak = 0;
	for (let i = 0; i < q.length; i++) {
		const ch = q[i];
		if (!ch) continue;
		const idx = t.indexOf(ch, cursor);
		if (idx === -1) return 0;
		const prev = idx > 0 ? t[idx - 1] : "";
		const isBoundary =
			idx === 0 ||
			prev === "-" ||
			prev === "_" ||
			prev === "/" ||
			prev === "." ||
			prev === " ";
		if (idx === lastIdx + 1) {
			streak++;
			score += 6 + streak * 2;
		} else {
			streak = 0;
		}
		score += 10;
		if (isBoundary) score += 8;
		if (i === 0) score += Math.max(0, 6 - idx);
		cursor = idx + 1;
		lastIdx = idx;
	}
	return score;
}

/**
 * 模糊匹配项目（子序列匹配项目名、模板名或标签，按相关度排序）。
 * 原子串匹配是子序列的特例，行为超集兼容；空 query 返回原顺序全量。
 */
export function filterProjects<
	T extends { name: string; template?: string; tags?: string[] },
>(projects: T[], query: string): T[] {
	const q = query.trim().toLowerCase();
	if (!q) return projects;
	const scored: { project: T; score: number }[] = [];
	for (const p of projects) {
		const candidates: string[] = [p.name];
		if (p.template) candidates.push(p.template);
		for (const tag of p.tags ?? []) candidates.push(tag);
		let best = 0;
		for (const c of candidates) {
			const s = fuzzyScore(c, q);
			if (s > best) best = s;
		}
		if (best > 0) scored.push({ project: p, score: best });
	}
	scored.sort((a, b) => b.score - a.score);
	return scored.map((s) => s.project);
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
