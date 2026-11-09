---
"p": patch
---

provider 溢出的并发计数改为只算 **正在生成** 的会话：读 cc 自己维护的 `~/.claude/sessions/<pid>.json`，仅 `status=busy`（生成中 / 跑工具）计入，停在输入框的 idle、跑 shell 的 shell、等确认的 waiting 都不占并发——套餐限制的是同时在途的请求数，此前只数进程存在会让开着不用的旧标签页把 `defaultMax` 虚占满、每开新会话都误溢出到 DeepSeek。已带 provider 片段的会话也不再计入默认渠道占用（它们走 provider 端点，不占套餐并发）。
