import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
	mungeCwd,
	removeCchiveDirs,
	removeDirEntries,
	upsertSessionIds,
} from "../src/utils/cchive";

describe("mungeCwd", () => {
	test("普通路径：斜杠替换为 -", () => {
		expect(mungeCwd("/Users/Apple/projects/foo")).toBe(
			"-Users-Apple-projects-foo",
		);
	});

	test("含点号目录：. 与 / 都替换", () => {
		expect(mungeCwd("/Users/Apple/.p/projects/p")).toBe(
			"-Users-Apple--p-projects-p",
		);
	});

	test("下划线与尾斜杠也替换", () => {
		expect(mungeCwd("/tmp/my_app/")).toBe("-tmp-my-app-");
	});
});

describe("upsertSessionIds", () => {
	test("条目不存在时新建并写入全部 id", () => {
		const { subs, changed } = upsertSessionIds(
			{ dirs: [], imports: [] },
			"/a",
			["id-1", "id-2"],
		);
		expect(changed).toBe(true);
		expect(subs.dirs).toEqual([{ cwd: "/a", session_ids: ["id-1", "id-2"] }]);
	});

	test("条目已存在时幂等追加多个 id", () => {
		const { subs, changed } = upsertSessionIds(
			{ dirs: [{ cwd: "/a", session_ids: ["id-1"] }] },
			"/a",
			["id-2", "id-3"],
		);
		expect(changed).toBe(true);
		expect(subs.dirs?.[0]?.session_ids).toEqual(["id-1", "id-2", "id-3"]);
	});

	test("id 全部已存在时不产生变更（changed=false 且引用不变）", () => {
		const origin = { dirs: [{ cwd: "/a", session_ids: ["id-1"] }] };
		const { subs, changed } = upsertSessionIds(origin, "/a", ["id-1"]);
		expect(changed).toBe(false);
		expect(subs).toBe(origin);
	});

	test("保留 imports 与其他目录条目", () => {
		const { subs } = upsertSessionIds(
			{
				dirs: [{ cwd: "/keep", session_ids: ["x"] }],
				imports: [{ id: "imp-1" }],
			},
			"/new",
			["id-1"],
		);
		expect(subs.dirs?.map((d) => d.cwd)).toEqual(["/keep", "/new"]);
		expect(subs.imports).toEqual([{ id: "imp-1" }]);
	});

	test("空 id 列表不新建条目", () => {
		const { subs, changed } = upsertSessionIds({ dirs: [] }, "/a", []);
		expect(changed).toBe(false);
		expect(subs.dirs).toEqual([]);
	});
});

describe("removeDirEntries", () => {
	test("命中时移除条目并保留其他条目", () => {
		const { subs, changed } = removeDirEntries(
			{
				dirs: [
					{ cwd: "/a", session_ids: ["id-1"] },
					{ cwd: "/b", session_ids: ["id-2"] },
				],
			},
			["/a"],
		);
		expect(changed).toBe(true);
		expect(subs.dirs).toEqual([{ cwd: "/b", session_ids: ["id-2"] }]);
	});

	test("批量移除多个 cwd", () => {
		const { subs, changed } = removeDirEntries(
			{
				dirs: [
					{ cwd: "/a", session_ids: ["id-1"] },
					{ cwd: "/b", session_ids: ["id-2"] },
					{ cwd: "/c", session_ids: ["id-3"] },
				],
			},
			["/a", "/c"],
		);
		expect(changed).toBe(true);
		expect(subs.dirs?.map((d) => d.cwd)).toEqual(["/b"]);
	});

	test("未命中时不产生变更（changed=false 且引用不变）", () => {
		const origin = { dirs: [{ cwd: "/a", session_ids: ["id-1"] }] };
		const { subs, changed } = removeDirEntries(origin, ["/nope"]);
		expect(changed).toBe(false);
		expect(subs).toBe(origin);
	});

	test("保留 imports 与未知字段（archived 等）", () => {
		const origin = {
			dirs: [
				{ cwd: "/a", session_ids: ["id-1"] },
				{ cwd: "/keep", session_ids: ["id-2"] },
			],
			imports: [{ id: "imp-1" }],
			archived: ["arch-1"],
		};
		const { subs } = removeDirEntries(origin, ["/a"]);
		expect(subs.dirs?.map((d) => d.cwd)).toEqual(["/keep"]);
		expect(subs.imports).toEqual([{ id: "imp-1" }]);
		expect((subs as { archived?: string[] }).archived).toEqual(["arch-1"]);
	});

	test("空 cwds 与 dirs 缺省均为无变更", () => {
		const origin = { dirs: [{ cwd: "/a", session_ids: ["id-1"] }] };
		expect(removeDirEntries(origin, []).changed).toBe(false);
		expect(removeDirEntries({ dirs: undefined }, ["/a"]).changed).toBe(false);
	});
});

describe("removeCchiveDirs（IO）", () => {
	const tmpDirs: string[] = [];

	afterEach(() => {
		for (const d of tmpDirs.splice(0))
			rmSync(d, { recursive: true, force: true });
	});

	function newSubsPath(initial?: string): string {
		const dir = mkdtempSync(join(tmpdir(), "p-cchive-test-"));
		tmpDirs.push(dir);
		const subsPath = join(dir, "cchive.json");
		if (initial !== undefined) {
			writeFileSync(subsPath, initial);
		}
		return subsPath;
	}

	test("命中移除条目、保留其余内容与缩进格式", async () => {
		const subsPath = newSubsPath(
			JSON.stringify({
				dirs: [
					{ cwd: "/keep", session_ids: ["id-2"] },
					{ cwd: "/gone", session_ids: ["id-1"] },
				],
				imports: [],
				archived: ["arch-1"],
			}),
		);
		const ok = await removeCchiveDirs(["/gone"], subsPath);
		expect(ok).toBe(true);
		const after = JSON.parse(readFileSync(subsPath, "utf8"));
		expect(after.dirs).toEqual([{ cwd: "/keep", session_ids: ["id-2"] }]);
		expect(after.archived).toEqual(["arch-1"]);
	});

	test("未命中时不写盘（mtime 之外以内容引用不变验证）", async () => {
		const initial = JSON.stringify({
			dirs: [{ cwd: "/a", session_ids: ["id-1"] }],
		});
		const subsPath = newSubsPath(initial);
		const ok = await removeCchiveDirs(["/nope"], subsPath);
		expect(ok).toBe(true); // 无需变更也算成功（与 syncCchiveSession 语义一致）
		expect(readFileSync(subsPath, "utf8")).toBe(initial);
	});

	test("文件不存在 → 无变更、不创建文件", async () => {
		const subsPath = newSubsPath();
		const ok = await removeCchiveDirs(["/a"], subsPath);
		expect(ok).toBe(true); // 空结构无命中 → 无变更即成功
		expect(existsSync(subsPath)).toBe(false);
	});

	test("解析失败 → false 且原内容不动", async () => {
		const subsPath = newSubsPath("{ not json");
		const ok = await removeCchiveDirs(["/a"], subsPath);
		expect(ok).toBe(false);
		expect(readFileSync(subsPath, "utf8")).toBe("{ not json");
	});

	test("空 cwds → false", async () => {
		expect(await removeCchiveDirs([])).toBe(false);
	});
});
