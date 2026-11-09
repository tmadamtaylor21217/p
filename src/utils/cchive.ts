/**
 * CCHive 会话同步：把 p new 起的 claude 会话 id 幂等写进 ~/.claude/cchive.json
 * 的目录订阅（dirs[].session_ids），会话 jsonl 一落盘即同步，CCHive 侧栏刷新即可见。
 * p delete 删项目后反向清掉对应订阅条目，已删项目不在侧栏残留。
 */

import { homedir } from "node:os";
import { join } from "node:path";
import fse from "fs-extra";

/** cchive.json 的目录订阅条目（宽容解析：session_ids 可缺省，遇未知结构不炸） */
interface CchiveSubDir {
	cwd: string;
	session_ids?: string[];
}

/** cchive.json 顶层结构（imports 结构 p 侧不消费，原样保留） */
interface CchiveSubs {
	dirs?: CchiveSubDir[];
	imports?: unknown[];
}

const CCHIVE_SUBS_PATH = join(homedir(), ".claude", "cchive.json");

/**
 * 规范化为真实路径：claude code 全程用 realpath 形态的 cwd（jsonl 内容与
 * ~/.claude/projects 下的 munged 目录名都是），symlink 路径（如 /tmp →
 * /private/tmp）不规范化会导致订阅条目与 cchive 扫描组对不上、监听目录盯错。
 * 导出供命令层在删目录**之前**解析——目录删除后 realpath 失败只能回退原路径。
 */
export function toRealPath(path: string): string {
	try {
		return fse.realpathSync(path);
	} catch {
		return path; // 目录不存在等异常 → 用原路径
	}
}

/** 会话 jsonl 文件名 = 小写 uuid（claude code 落盘命名） */
const UUID_JSONL_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/;

/**
 * claude code 把 cwd 映射为 ~/.claude/projects/ 下的目录名：
 * 非字母数字字符全部替换为 -（如 /Users/Apple/.p/projects/foo → -Users-Apple--p-projects-foo）
 */
export function mungeCwd(cwd: string): string {
	return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}

/**
 * 幂等把 session id 追加进目录订阅（纯函数，不碰文件系统）
 */
export function upsertSessionIds(
	subs: CchiveSubs,
	cwd: string,
	sessionIds: string[],
): { subs: CchiveSubs; changed: boolean } {
	if (sessionIds.length === 0) return { subs, changed: false };
	const dirs = subs.dirs ?? [];
	const existing = dirs.find((d) => d.cwd === cwd);
	if (!existing) {
		return {
			subs: {
				...subs,
				dirs: [...dirs, { cwd, session_ids: [...sessionIds] }],
			},
			changed: sessionIds.length > 0,
		};
	}
	const before = existing.session_ids ?? [];
	const merged = [...before];
	for (const id of sessionIds) {
		if (!merged.includes(id)) merged.push(id);
	}
	if (merged.length === before.length) return { subs, changed: false };
	return {
		subs: {
			...subs,
			dirs: dirs.map((d) =>
				d.cwd === cwd ? { ...d, session_ids: merged } : d,
			),
		},
		changed: true,
	};
}

/**
 * 幂等从目录订阅移除 cwd 条目（纯函数，不碰文件系统）。cwds 须为 realpath
 * 形态（与订阅条目一致），未命中任何条目时引用不变。
 */
export function removeDirEntries(
	subs: CchiveSubs,
	cwds: string[],
): { subs: CchiveSubs; changed: boolean } {
	if (cwds.length === 0 || !subs.dirs) return { subs, changed: false };
	const remove = new Set(cwds);
	const kept = subs.dirs.filter((d) => !remove.has(d.cwd));
	if (kept.length === subs.dirs.length) return { subs, changed: false };
	return { subs: { ...subs, dirs: kept }, changed: true };
}

/**
 * 读改写 cchive.json 的共用骨架：读 → 宽容解析 → mutate → 原子写。不 throw。
 * 文件不存在 → 从空结构创建；解析失败/结构异常 → 返回 false 且绝不写盘
 * （当空结构写盘会把用户全部订阅永久清空）。
 * 写盘走同目录 temp + rename 原子替换，与 cchive 并发写的最坏后果是毫秒级
 * lost-update 窗口内一次操作丢失，单人本地工具可接受。
 */
async function mutateSubsFile(
	subsPath: string,
	mutate: (subs: CchiveSubs) => { subs: CchiveSubs; changed: boolean },
): Promise<boolean> {
	try {
		let subs: CchiveSubs | null = null;
		if (await fse.pathExists(subsPath)) {
			try {
				const parsed: unknown = JSON.parse(
					await fse.readFile(subsPath, "utf8"),
				);
				if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
					subs = parsed as CchiveSubs;
				}
			} catch {
				// 解析失败 → 保持 null → 放弃写盘
			}
		} else {
			subs = { dirs: [], imports: [] };
		}
		if (!subs) return false;

		const { subs: next, changed } = mutate(subs);
		if (!changed) return true;

		const tmp = `${subsPath}.tmp`;
		// 2 空格缩进不带尾换行，对齐 cchive 侧 serde_json to_string_pretty 的输出
		await fse.writeFile(tmp, JSON.stringify(next, null, 2));
		await fse.rename(tmp, subsPath);
		return true;
	} catch {
		return false;
	}
}

/**
 * 读改写 cchive.json：把 session id 幂等追加进 cwd 的订阅条目。
 */
export async function syncCchiveSession(
	cwd: string,
	sessionIds: string[],
	subsPath = CCHIVE_SUBS_PATH,
): Promise<boolean> {
	if (sessionIds.length === 0) return false;
	const realCwd = toRealPath(cwd);
	return mutateSubsFile(subsPath, (subs) =>
		upsertSessionIds(subs, realCwd, sessionIds),
	);
}

/**
 * 读改写 cchive.json：把 cwds 的订阅条目整条移除（p delete 删项目后清订阅，
 * 侧栏不残留）。cwds 传删除前解析好的 realpath（目录已删时 toRealPath 会
 * 回退原路径，symlink 场景对不上条目）。不 throw。
 */
export async function removeCchiveDirs(
	cwds: string[],
	subsPath = CCHIVE_SUBS_PATH,
): Promise<boolean> {
	if (cwds.length === 0) return false;
	const realCwds = [...new Set(cwds.map(toRealPath))];
	return mutateSubsFile(subsPath, (subs) => removeDirEntries(subs, realCwds));
}

/**
 * 按配置开关决定是否移除（cchiveSync 为 false 时跳过）：删项目的入口共用
 */
export async function maybeRemoveCchiveDirs(
	cchiveSync: boolean | undefined,
	cwds: string[],
): Promise<boolean> {
	if (cchiveSync === false || cwds.length === 0) return false;
	return removeCchiveDirs(cwds);
}

/**
 * 轮询 ~/.claude/projects/<munged>/，首批新会话 jsonl 落盘即同步到 cchive 订阅，
 * 同步完成（无论成败）立即自动停止——不陪跑整个会话，几秒内收工。
 * 完全静默（不打印——claude TUI 前台接管 stdio）；一个 tick 发现多个新文件时
 * 合并成一次写盘。不覆盖 /clear 换的新 session（同步完即停，不再监听）。
 * 这是 p 进程内的 setInterval 而非子进程：返回的 stop() 幂等，供调用侧在
 * claude 未启动/异常退出等收不到 jsonl 的场景兜底清理——泄漏的 interval
 * 会阻止进程退出。
 */
export function watchCchiveSync(
	projectPath: string,
	options?: { intervalMs?: number; subsPath?: string },
): { stop: () => void } {
	const realPath = toRealPath(projectPath);
	const dir = join(homedir(), ".claude", "projects", mungeCwd(realPath));
	// 基线在挂载时同步读取：目录已存在 → 旧文件全部视为已知；不存在 → 空基线，
	// 之后出现的全部 jsonl 都算新（目录出现后才建基线会把首个会话误判为已知）
	let known: Set<string>;
	try {
		known = new Set(fse.readdirSync(dir).filter((f) => UUID_JSONL_RE.test(f)));
	} catch {
		known = new Set();
	}

	let stopped = false;
	const stop = () => {
		if (stopped) return;
		stopped = true;
		clearInterval(timer);
	};
	const timer = setInterval(async () => {
		if (stopped) return;
		let entries: string[];
		try {
			entries = await fse.readdir(dir);
		} catch {
			return; // claude 尚未创建会话目录
		}
		const fresh = entries.filter((f) => UUID_JSONL_RE.test(f) && !known.has(f));
		if (fresh.length === 0) return;
		await syncCchiveSession(
			realPath,
			fresh.map((f) => f.replace(/\.jsonl$/, "")),
			options?.subsPath,
		);
		stop(); // 任务完成，自杀收工
	}, options?.intervalMs ?? 1000);

	return { stop };
}

/**
 * 按配置开关决定是否挂 watcher（cchiveSync 为 false 时返回 null）：
 * 所有会启动 claude TUI 新会话的入口共用
 */
export function maybeWatchCchiveSync(
	cchiveSync: boolean | undefined,
	projectPath: string,
): { stop: () => void } | null {
	return cchiveSync === false ? null : watchCchiveSync(projectPath);
}
