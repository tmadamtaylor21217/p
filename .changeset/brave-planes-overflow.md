---
"p": minor
---

`p` 的所有 claude 启动入口统一接入模型 provider 溢出：启动前用 `ps` 统计全系统活 claude 会话（全账号套餐并发池口径，外部终端 / CCHive / p 拉起的都算），达到 `~/.claude/cchive-providers.json` 的 `defaultMax`（缺省 3）后，按序溢出到第一个配置完整且未占满的 provider，并通过 `--settings` 片段注入（与 CCHive 共用 `~/.claude/cchive-provider-fragments/`，0600 幂等重写）。覆盖 `p claude` / `p cc`、`p new`（含带需求描述直启）、`openWithIDE` 系（`p open -i claude` / `p o :claude` / `p recent` / `p clone` / `p copy` 等），以及 `claude -p` 命名助手。配置缺失 / 解析失败 / 全部占满时静默走默认渠道，零行为变化。
