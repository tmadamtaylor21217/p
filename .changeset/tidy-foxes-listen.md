---
"p": patch
---

`p d`（delete）删除项目后同步清理 CCHive 订阅（`~/.claude/cchive.json` 对应目录条目），已删项目不再在 CCHive 侧栏残留；受同一 `cchiveSync` 配置开关控制（`false` 时跳过），会话 jsonl 本身保留不删。
