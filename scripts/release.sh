#!/bin/bash
set -e

# 发布脚本：build → test → commit → push → remote verify
# 用法: bash scripts/release.sh "commit message"

MSG="$1"
if [ -z "$MSG" ]; then
  echo "用法: bash scripts/release.sh <commit message>"
  exit 1
fi

echo ">>> 1. 单元测试"
bun test

echo ""
echo ">>> 2. 构建"
npm run build

echo ""
echo ">>> 3. 冒烟测试 (本地)"
bun run scripts/smoke-test.ts

echo ""
echo ">>> 4. 提交并推送"
git add -A
git commit -m "$MSG

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>" || true
git push

echo ""
echo ">>> 5. 远程安装验证"
sleep 5
rm -f ~/.bun/install/global/bun.lock
bun install -g --force tmadamtaylor21217/p 2>&1

echo ""
echo ">>> 6. 远程冒烟测试"
bun run scripts/smoke-test.ts

echo ""
echo "✓ 发布完成"
