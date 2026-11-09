---
"p": minor
---

项目备注正名为 first prompt（创建项目时的第一个 prompt）：存储字段 `note` → `firstPrompt`（旧 meta.json 读取时自动迁移），命令 `p note` → `p first-prompt` / `p fp`（保留 `note`/`notes` 别名）。`p ls` 中 first prompt 移到路径下方按终端宽度折行显示，不再挤在标题行；`p recent` / 搜索 hint 改为 CJK 宽度感知截断。顺手修复 `p note --clear` 不生效的存量 bug（`undefined` 被跳过未写入）。
