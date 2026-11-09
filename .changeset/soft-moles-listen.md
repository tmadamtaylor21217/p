---
"p": minor
---

p 启动的 claude 会话自动同步到 CCHive 侧栏：会话 jsonl 落盘（通常 1-3 秒）即把 session id 写入 `~/.claude/cchive.json` 目录订阅，同步完成即收工不残留轮询。覆盖所有真正启动 claude 的入口——`p new`（各创建路径）、`p cc`、以及显式以 claude 打开的 `p o :claude` / `p o -i claude`（TUI 启动统一在 `openWithIDE` 处理，直接 spawn 的入口单独挂载）；`p o` 默认的 GUI IDE 打开不产生会话、不触发同步。新增 `cchiveSync` 配置项（默认开启，设为 `false` 关闭）。
