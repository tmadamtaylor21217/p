# P

项目管理工具 - 快速创建和管理项目。

## 安装

```bash
bun install -g tmadamtaylor21217/p
```

安装完成后，运行 `p` 命令即可使用。

> **需求描述创建**依赖本地已安装 [Claude Code](https://claude.com/claude-code) CLI（`claude` 命令），无需配置 API Key。

### 从源码安装

```bash
git clone https://github.com/tmadamtaylor21217/p.git
cd p
bun install
bun run link
```

### 更新

```bash
p update
```

## 命令

| 命令 | 说明 |
|------|------|
| `p new <name>` | 创建新项目 |
| `p new <name> #tag1 #tag2` | 创建新项目并添加标签 |
| `p new -- <command>` | 在项目目录执行 CLI 初始化（如框架脚手架） |
| `p new -- <alias> <name>` | 使用 config.yaml 中配置的快捷方式初始化 |
| `p new "需求描述"` | 根据需求生成候选项目名，创建后带需求进入 claude 会话开发 |
| `p clone <url> [name]` | 克隆远程仓库到 p 管理 |
| `p copy <path> [name]` | 复制目录作为新项目 |
| `p add <path>` | 添加现有项目 |
| `p ls` | 列出所有项目 |
| `p ls t` | 列出所有模板 |
| `p ls t -r` | 只列出已发布的远程模板 |
| `p open [name]` | 打开项目（实时搜索，按 a 全部打开） |
| `p s [name]` | 模糊搜索项目（实时筛选，回车打开；支持多选批量） |
| `p recent` | 最近项目列表（j/k 移动，o 打开，d 删除） |
| `p open [name] -i <ide>` | 用指定 IDE 打开 |
| `p open . -i <ide>` | 用指定 IDE 打开当前目录 |
| `p open :<ide>` | 快速用指定 IDE 打开当前目录 |
| `p rename [old] [new]` | 重命名项目 |
| `p path <name>` (`p p`) | 打印项目绝对路径（支持模糊匹配） |
| `p delete <name>` | 删除项目 |
| `p delete <a> <b> <c>` | 批量删除多个项目（支持混合通配符） |
| `p delete` | 多选批量删除 |
| `p delete <pattern*>` | 通配符匹配删除（如 `p delete test-*`） |
| `p first-prompt <project> [text]` (`p fp`) | 查看/设置项目 first prompt（创建时的初始需求） |
| `p fp <project> --clear` | 清除 first prompt |
| `p templates` / `p tp` | 管理模板 |
| `p hooks` | 管理 hooks |
| `p config` | 打开配置文件 |
| `p update` | 更新 p |
| `p unzip [project]` | 解压项目所有 zip 文件 |
| `p publish [name]` | 发布项目为 GitHub 模板仓库 |
| `p publish --save` | 发布并同时保存为本地模板 |
| `p sync export [name]` | 导出项目为 ZIP 到 Downloads/p-sync |
| `p sync import [file]` | 从 ZIP 导入项目（自动扫描 Downloads） |

## Clone 命令

从 GitHub 克隆仓库：

```bash
# 自动推断项目名
p clone https://github.com/owner/repo.git

# 自定义项目名
p clone https://github.com/owner/repo.git my-project

# 支持 owner/repo 短格式
p clone owner/repo

# 支持 SSH 地址
p clone git@github.com:owner/repo.git

# 支持不带 .git 的 HTTPS 地址
p clone https://github.com/owner/repo

# 别名
p cl <url>
```

自动检查 `git config user.name` 与仓库 owner 是否一致，不一致则警告提示。

## Copy 命令

复制本地目录作为新项目：

```bash
# 自动推断项目名（使用目录名）
p copy output/www.shadcnblocks.com/blocks

# 自定义项目名
p copy ./my-dir my-project

# 支持绝对路径
p copy /path/to/directory

# 同时复制多个项目（逗号分隔路径，名称数量需对应）
p cp ./foo,./bar,./baz
p cp ./foo,./bar my-foo,my-bar

# Flags
p cp ./foo -o            # 复制完成后用 IDE 打开
p cp ./foo --no-trash    # 保留原始目录（默认会移入回收站）
p cp ./foo,./bar -o      # 多项目组合使用

# 别名
p cp <path>
```

功能：
- 复制整个目录到 `~/.p/projects/`
- 自动初始化 git
- 默认**不打开** IDE，加 `-o/--open` 才打开
- 默认会将原始目录移入回收站（多项目时全部移入），加 `--no-trash` 保留原始目录
- 多项目模式下，若某项目名冲突会直接报错（单项目保留交互式改名）

## Rename 命令

重命名项目：

```bash
# 交互式选择并输入新名称
p rename

# 直接指定
p rename old-name new-name

# 别名
p mv old-name new-name
```

功能：
- 重命名前检查 git 用户与仓库 owner 是否一致
- 如果有 GitHub 远程仓库，自动同步重命名
- 本地目录重命名有 5 秒超时，超时提示关闭 IDE 窗口
- 自动更新元数据

## Path 命令

打印项目绝对路径，常用于 shell 替换：

```bash
p p <name>           # 别名 p, pp
p path <name>        # 全名

# 支持模糊匹配（唯一匹配时直接输出）
p p api              # 匹配到 api-server

# 用于 shell 命令
cd $(p p api)
code $(p p web)

# 多匹配时报错并列出候选
p p s                # ✗ 匹配到 2 个项目，请精确指定
```

输出纯路径（无颜色），便于 `$(...)` 替换；错误信息走 stderr，不污染 stdout。

## Unzip 命令

```bash
# 当前目录
p unzip
p unzip .

# 指定项目
p unzip my-project

# 跳过所有询问，按默认规则自动清理
p unzip --auto

# 手动指定要移除的前缀（可多次使用，不询问）
p unzip --remove-prefix magicuidesign
p unzip -p magicuidesign -p shadcn

# 手动指定要移除的后缀（可多次使用，不询问）
p unzip --remove-suffix template
p unzip -s template -s demo
```

功能：
- 递归查找目录下所有 `.zip` 文件
- 自动过滤 `__MACOSX` 和 `.DS_Store`
- 如果 zip 内根目录与文件名一致，自动扁平化
- 解压成功后自动删除原 zip 文件
- 如果目标目录已存在，会先删除再解压

清理规则（交互式询问，`--auto` 时全部默认 yes）：
- 移除 `-template` 后缀和长十六进制哈希后缀（如 GitHub commit SHA）
- 当 ≥2 个 zip 共享首 token 时（如多个 `magicuidesign-xxx`），询问是否移除公共前缀
- `--remove-prefix <name>` / `--remove-suffix <name>` 手动指定要移除的前缀/后缀，可多次使用，不询问

## Push 命令

提交并推送项目代码到 remote origin（比 publish 更轻量，不涉及模板化）：

```bash
# 当前项目
p push
p push .

# 指定项目
p push my-project

# 跳过所有询问（包括创建仓库）
p push --auto
```

功能：
- 当前目录不是 git 仓库时自动 `git init -b main`
- 已有 remote：直接提交推送
- 无 remote：询问是否创建私有仓库（`--auto` 跳过询问）
- 自动清理嵌套 `.git` 目录，避免 gitlink
- 检测无变更时跳过 commit，避免触发 pre-commit hook

## Publish 命令

发布项目为 GitHub 模板仓库：

```bash
# 当前项目发布（已有 remote 则直接推送）
p publish
p publish .

# 指定项目
p publish my-project

# 指定模板名称
p publish my-project my-template

# 同时保存为本地模板
p publish --save
```

功能：
- 已有 git remote 的项目：直接 `git push`，保留原有提交历史
- 无 remote 的项目：创建 GitHub 仓库并推送
- 默认不创建本地模板，加 `--save` 才保存

## Sync 命令

局域网迁移项目（配合 [LocalSend](https://localsend.org/) 等工具）：

```bash
# 导出项目为 ZIP（输出到 ~/Downloads/p-sync/）
p sync export
p sync export my-project
p sync export .        # 当前项目

# 导入项目（自动扫描 ~/Downloads/ 下的 zip 文件）
p sync import
p sync import path/to/file.zip  # 指定文件
```

功能：
- 导出时打包 `.git` 目录，保留提交历史
- 导入后提示删除 `Downloads/p-sync` 目录
- macOS 通过 shell 命令绕过 TCC 权限限制

## 需求描述创建

`p new` 的位置参数带引号传自然语言需求（含中文或多个词），会调用本地 **Claude Code** CLI（`claude -p`，无需 API Key）生成候选项目名，创建项目后带需求描述直接进入 claude 会话开发：

```bash
p new "做一个 github 私有仓库邀请机器人，让用户安装、接入，然后分发邀请链接"
```

流程：
1. 识别为需求描述（含中文或多个词；单个合法项目名仍走快速模式）
2. `claude -p` 生成 5 个 kebab-case 候选名（自动过滤已存在的项目名）
3. 选择候选 / 直接输入自定义名 / "换一批"（排除已生成过的名称）
4. 跳过模板选择直接使用空项目模板（显式传 `-t` 仍可指定）→ 创建目录 → 执行 hooks
5. 需求描述作为 first prompt 存入项目元数据（`p fp` 可查看），并作为初始 prompt 前台启动 claude 会话

未安装 `claude` CLI 或生成失败/超时（60s）时，自动回退为手动输入项目名，创建后正常打开（`config.ide`）。

## 实时搜索

`p s`、`p open`、`p delete`、`p templates add` 支持实时搜索：

- 边输入边筛选
- ↑↓ 选择，Enter 确认
- Esc 取消

模糊匹配为子序列算法（fzf 风格）：`p s acrs` 能命中 `acards`，连续匹配、词首命中的项目排在前面；项目名、模板名、标签都参与匹配。`p s <name>` 唯一命中时直接打开，多命中进入实时搜索界面。

## First Prompt

项目创建时的第一个 prompt（需求描述）会存为项目的 first prompt，在搜索和列表中显示，方便回忆项目是做什么的：

```bash
# 查看/设置
p fp heroui-v3-pro-test "原生版测试"
p fp . "当前项目的 first prompt"

# 交互输入
p fp heroui-v3-pro-test

# 清除
p fp heroui-v3-pro-test --clear

# 查看当前项目的 first prompt
p fp
```

first prompt 会显示在：
- `p open` / `p delete` 搜索列表的 hint 中（截断显示）
- `p ls` 项目列表中（路径下方，按终端宽度折行）
- `p recent` 中（截断显示）

## 批量删除

```bash
# 多选模式：空格勾选，Enter 确认
p delete

# 通配符匹配
p delete heroui-*
p delete *-test

# 一次性删除多个项目（支持混合通配符）
p delete alpha beta gamma
p delete api-* web-* legacy
```

## 模板管理

```bash
# 添加当前目录为模板
p templates add .
p tp add .

# 更新模板
p templates update .
p tp update .

# 发布模板到 GitHub（创建公开仓库并推送，返回克隆链接）
p templates publish <name>
p tp publish <name>

# 将当前项目保存为模板并发布
p templates publish .
p tp publish .

# 打开模板目录
p templates
p tp
```

## 配置

配置文件位于 `~/.p/config.yaml`。

```yaml
# 默认打开方式（claude 等 AI CLI 会在项目目录直接启动终端会话；也可用 cursor, code 等 GUI IDE）
ide: claude

# 命令快捷方式（用于 p new -- <别名> <项目名>）
shortcuts:
  heroui: npx -y heroui-cli@latest init
  next: npx -y create-next-app@latest

# Hooks 定义
hooks:
  gitInit:
    command: git init

# 模板配置
templates:
  my-template:
    name: 我的模板
    dir: my-template  # 本地模板目录
    hooks:
      - gitInit
```
