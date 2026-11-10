# p

## 1.24.3

### Patch Changes

- revert: filterProjects 撤回子序列模糊匹配，恢复纯子串匹配（p s 命令保留）

## 1.24.2

### Patch Changes

- fix: TypeScript 严格模式全量修复，tsc --noEmit 归零

## 1.24.1

### Patch Changes

- fix: Biome 全量清零；修复 rename 可能拼出 undefined 前缀 URL、note 空备注误写 undefined

## 1.24.0

### Minor Changes

- 899e06e: feat: 支持用 Claude Code 等 AI CLI 打开项目，默认 ide 改为 claude

  - `openWithIDE` 识别终端 TUI 命令（claude, codex, gemini, aider）：以 cwd 进入目录、继承 stdio 前台运行，路径为文件时进入其所在目录
  - 默认配置 `ide: claude`，所有打开项目的命令（new/open/clone/copy/recent 等）在 TUI 模式下跳过 spinner，避免污染交互界面
  - `p new` 新增 `-i, --ide <ide>` 选项，临时指定打开方式（如 `p new foo -i cursor`）
  - `p recent` 打开项目前先释放 stdin/恢复终端状态，避免与 TUI 抢占键盘输入

## 1.23.1

### Patch Changes

- fix: publish 命令 spinner 复用导致"已推送 N 个文件"重复打印且进程卡死

  `@clack/prompts` 的 spinner 内部把 interval id 存在闭包变量里，多次 `s.start()` 会覆盖变量、泄漏前一个 interval，导致：

  - 第一个 stop 之后，泄漏的 interval 还在不停刷新屏幕，把 stop message 反复打印（用户看到的"打印两次"）
  - 泄漏的 interval 阻止 Node.js/Bun 事件循环退出（用户看到的"转了半天都不停"）

  修复：每个步骤用独立的 spinner 实例（sPrepare / sCreate / sPush），符合 CLAUDE.md 既有规范。

## 1.23.0

### Minor Changes

- `p new -d` 支持多源 fallback。新增 `ai.providers` 优先级列表配置（如 `[deepseek, glm]`），前一个 HTTP/鉴权类失败时自动切到下一个；UI 在 AI 命名建议标题后展示当前使用的源，fallback 时显示 `(智谱 GLM 失败，使用 DeepSeek)`。流式输出开始后不再 fallback，避免结果错乱。

  修复：`applyTemplate` 在模板仅声明 `name` 而无 command/dir/hooks 时（如默认 `empty` 模板）不再报"模板配置无效"，视为合法空模板直接成功。

## 1.22.0

### Minor Changes

- `p new -d` AI 命名支持 DeepSeek。新增 `ai.provider`（`glm` | `deepseek`）字段切换服务商，缺省时按已配置的 key 自动推断。DeepSeek 用 OpenAI 兼容端点 `https://api.deepseek.com/chat/completions`，默认模型 `deepseek-v4-flash`。配置 `ai.model` 若是另一个 provider 的默认值（如切了 provider 没改 model），会自动回落到当前 provider 默认，避免 400 错误。

## 1.21.1

### Patch Changes

- 修复 `p new -d` 选择 AI 命名后误报"项目名称不能为空"：校验对象错误地指向了命令行传入的 `cleanName`（在 `-d` 模式下为空），改为统一校验最终选中的 `projectName`。

## 1.21.0

### Minor Changes

- `p push` 修复：当前目录不是 git 仓库时自动 `git init -b main`，不再报 "not a git repository"。创建 GitHub 私有仓库前增加询问，新增 `-a, --auto` 跳过询问。

### Patch Changes

- `p unzip` 输出精简：长哈希后缀截断到 8 位 + `…` 展示，去掉 `(清理自 …)` 后缀。

## 1.20.2

### Patch Changes

- `p unzip` 的 `--remove-prefix` 短选项从 `-r` 改为 `-p`（与 `--remove-suffix`/`-s` 对称，p=prefix 更直观）。

## 1.20.1

### Patch Changes

- `p unzip` 公共前缀检测从全局 LCP 改为按首 token 聚类，避免一个异类把整组共性拉空。询问顺序调整为前缀 → 后缀 → 执行。

## 1.20.0

### Minor Changes

- `p unzip` 公共前缀检测改为基于 dash-token LCP 算法自动推断（不再维护硬编码模板库列表）。当 ≥2 个 zip 共享 dash-token 公共前缀时询问是否移除。

## 1.19.0

### Minor Changes

- `p unzip` 新增清理能力：自动识别并询问是否移除 `-template` 后缀、十六进制哈希后缀、已知模板库前缀（如 `magicuidesign`）。新增 `--auto` 跳过所有询问，`--remove-prefix <name>` / `--remove-suffix <name>` 手动指定要移除的前缀/后缀（可多次）。

## 1.18.0

### Minor Changes

- `p cp` 默认行为改为自动将原始目录移入回收站（不再询问），需要保留原始目录时加 `--no-trash`。`--trash` flag 因此移除。

## 1.17.0

### Minor Changes

- `p cp` 默认不再自动打开 IDE（改为 `-o/--open` 显式触发）；支持逗号分隔多路径一次复制多个项目；新增 `-t/--trash` 和 `--no-trash` flag 控制是否将原始目录移入回收站（多项目时一次询问，要么全移要么全不移）。

## 1.16.0

### Minor Changes

- 新增 `p path <name>` 命令（别名 `p p`、`p pp`），打印项目绝对路径，支持模糊匹配。输出纯路径便于 shell 替换（如 `cd $(p p foo)`），错误走 stderr 不污染 stdout。

## 1.15.1

### Patch Changes

- 修复 `p push` 在无新变更时因 pre-commit hook (如 lefthook) 报错而中断的问题：改用 `git diff --cached --quiet` 检测 staged 变更，无变更则跳过 commit 步骤；并新增未推送 commits 检测，仅在已与远程同步时才提示"无需推送"。

## 1.15.0

### Minor Changes

- 支持 `p rm`/`p delete` 一次性传入多个项目名进行批量删除，每个参数可以是项目名或通配符模式（如 `p rm alpha beta api-*`）。

## 1.6.0

- unzip 支持 -f/--flatten 解解散 zip 内的根目录
- 使用 adm-zip 替代系统 unzip 命令，支持 Windows
- 配置中的 IDE 直接使用，不再扫描 PATH
- 实时搜索：`p open`、`p delete`、`p template add` 使用实时搜索组件
- `p import` 迁移外部项目、`p tag` 项目标签、模糊匹配增强
- AI 命名（智谱 GLM）、模板管理、hooks 系统
