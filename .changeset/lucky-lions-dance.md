---
"p": minor
---

`p o <项目>` 默认改用 GUI IDE 打开（`config.editor`，缺省自动探测 cursor/code/windsurf/trae），不再默认启动 Claude Code；需要 AI CLI 时用 `p o :claude` 或 `p o -i claude` 显式指定。移除组合参数机制（`p oi`）与 `p open -e` 选项（GUI IDE 已是默认行为）。
