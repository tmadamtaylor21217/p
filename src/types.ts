/**
 * 模板配置
 */
export interface TemplateConfig {
	name: string;
	command?: string; // 命令模式
	dir?: string; // 本地模板文件夹名（在 ~/.p/templates/ 下）
	hooks?: string[]; // 该模板需要执行的 hooks 列表
}

/**
 * Hook 定义（根节点声明）
 */
export interface HookDefinition {
	name: string;
	command?: string; // 命令模式
	file?: string; // 脚本文件名（在 ~/.p/hooks/ 下）
}

/**
 * 主配置文件
 */
export interface Config {
	ide: string;
	editor?: string; // GUI IDE（p o 用它打开；留空时自动探测 cursor/code/windsurf/trae）
	hooks: Record<string, HookDefinition>;
	templates: Record<string, TemplateConfig>;
	shortcuts?: Record<string, string>;
	recentCount?: number;
	cchiveSync?: boolean; // p new 启动 claude 会话后自动同步到 CCHive 侧栏（~/.claude/cchive.json）
	ignore?: string[];
	sync?: {
		exclude?: string[];
	};
}

/**
 * 模板发布元数据
 */
export interface TemplateMeta {
	owner: string;
	repo: string;
	url: string;
	publishedAt: string;
}

/**
 * 模板元数据文件结构
 */
export interface TemplatesMeta {
	[templateName: string]: TemplateMeta;
}

/**
 * 项目元数据（存储在 metadata.json 中的单个项目）
 */
export interface ProjectMetaData {
	template?: string;
	savedTemplate?: string;
	createdAt: string;
	originalPath?: string;
	tags?: string[];
	/** 创建项目时的第一个 prompt（原 note 字段，读取时自动迁移） */
	firstPrompt?: string;
}

/**
 * 全局元数据文件结构
 */
export interface Metadata {
	projects: Record<string, ProjectMetaData>; // key 为项目名
}

/**
 * 项目信息
 */
export interface ProjectInfo {
	name: string;
	path: string;
	template?: string;
	savedTemplate?: string;
	createdAt: Date;
	modifiedAt: Date;
	originalPath?: string;
	tags?: string[];
	firstPrompt?: string;
}
