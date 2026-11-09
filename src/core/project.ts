import { join } from "node:path";
import fse from "fs-extra";
import type { Metadata, ProjectInfo, ProjectMetaData } from "../types";
import { METADATA_PATH, PROJECTS_DIR } from "../utils/paths";

/** meta.json 里的旧字段名（firstPrompt 前身），读取时自动迁移 */
type LegacyMeta = ProjectMetaData & { note?: string };

function legacyNote(meta: ProjectMetaData | undefined): string | undefined {
	return (meta as LegacyMeta | undefined)?.note;
}

/**
 * 读取全局元数据
 */
function loadMetadata(): Metadata {
	if (!fse.existsSync(METADATA_PATH)) {
		return { projects: {} };
	}

	try {
		const content = fse.readFileSync(METADATA_PATH, "utf-8");
		return JSON.parse(content);
	} catch {
		return { projects: {} };
	}
}

/**
 * 保存全局元数据
 */
function saveMetadata(metadata: Metadata): void {
	fse.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");
}

/**
 * 获取所有项目列表
 */
export function listProjects(): ProjectInfo[] {
	if (!fse.existsSync(PROJECTS_DIR)) {
		return [];
	}

	const entries = fse.readdirSync(PROJECTS_DIR, { withFileTypes: true });
	const metadata = loadMetadata();
	const projects: ProjectInfo[] = [];

	for (const entry of entries) {
		if (entry.isDirectory()) {
			const projectPath = join(PROJECTS_DIR, entry.name);
			const stat = fse.statSync(projectPath);

			// 读取项目元数据
			const meta = metadata.projects[entry.name];

			projects.push({
				name: entry.name,
				path: projectPath,
				template:
					meta?.template && meta.template !== "empty"
						? meta.template
						: undefined,
				savedTemplate: meta?.savedTemplate,
				createdAt: meta?.createdAt ? new Date(meta.createdAt) : stat.birthtime,
				modifiedAt: stat.mtime,
				originalPath: meta?.originalPath,
				tags: meta?.tags,
				firstPrompt: meta?.firstPrompt ?? legacyNote(meta),
			});
		}
	}

	// 按修改时间降序排列
	return projects.sort(
		(a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
	);
}

/**
 * 获取项目元数据
 */
export function getProjectMeta(projectName: string): ProjectMetaData | null {
	const metadata = loadMetadata();
	const meta = metadata.projects[projectName] as LegacyMeta | undefined;
	if (!meta) return null;
	// 旧 note 字段归并为 firstPrompt
	if (meta.firstPrompt === undefined && meta.note !== undefined) {
		return { ...meta, firstPrompt: meta.note };
	}
	return meta;
}

/**
 * 保存项目元数据
 */
export function saveProjectMeta(
	projectName: string,
	data: Partial<ProjectMetaData> = {},
): void {
	const metadata = loadMetadata();
	const existing = metadata.projects[projectName] as LegacyMeta | undefined;
	const { note: legacy, ...legacyRest } = existing ?? {};
	const rest: Partial<ProjectMetaData> = existing ? legacyRest : {};

	metadata.projects[projectName] = {
		...rest,
		template: data.template ?? rest.template,
		savedTemplate: data.savedTemplate ?? rest.savedTemplate,
		createdAt: rest.createdAt || new Date().toISOString(),
		...(data.originalPath !== undefined && { originalPath: data.originalPath }),
		...(data.tags !== undefined && { tags: data.tags }),
		// "in" 判断：显式传 undefined 即清除（修复旧版 --clear 不生效的问题）
		firstPrompt:
			"firstPrompt" in data ? data.firstPrompt : (rest.firstPrompt ?? legacy),
	};

	saveMetadata(metadata);
}

/**
 * 删除项目元数据
 */
export function deleteProjectMeta(projectName: string): void {
	const metadata = loadMetadata();
	delete metadata.projects[projectName];
	saveMetadata(metadata);
}

/**
 * 清除项目的原始路径
 */
export function clearOriginalPath(projectName: string): void {
	const metadata = loadMetadata();
	const existing = metadata.projects[projectName];
	if (existing) {
		delete existing.originalPath;
		saveMetadata(metadata);
	}
}

/**
 * 清除所有项目元数据
 */
export function clearAllProjectMeta(): void {
	saveMetadata({ projects: {} });
}

/**
 * 检查项目是否存在
 */
export function projectExists(name: string): boolean {
	const projectPath = join(PROJECTS_DIR, name);
	return fse.existsSync(projectPath);
}

/**
 * 获取项目路径
 */
export function getProjectPath(name: string): string {
	return join(PROJECTS_DIR, name);
}

/**
 * 验证项目名称（不含存在性检查）
 */
export function validateProjectNameFormat(name: string): {
	valid: boolean;
	message?: string;
} {
	if (!name || name.trim() === "") {
		return { valid: false, message: "项目名称不能为空" };
	}

	const invalidChars = /[<>:"/\\|?*]/;
	if (invalidChars.test(name)) {
		return { valid: false, message: "项目名称包含非法字符" };
	}

	if (name.startsWith(".") || name.startsWith(" ") || name.endsWith(" ")) {
		return { valid: false, message: "项目名称格式不正确" };
	}

	return { valid: true };
}

/**
 * 验证项目名称
 */
export function validateProjectName(name: string): {
	valid: boolean;
	message?: string;
} {
	const format = validateProjectNameFormat(name);
	if (!format.valid) return format;

	if (projectExists(name)) {
		return { valid: false, message: "项目已存在" };
	}

	return { valid: true };
}
