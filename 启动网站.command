#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin; do
    if [ -x "$candidate/node" ]; then export PATH="$candidate:$PATH"; fi
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 的 LTS 版本，再双击本文件。"
  echo "下载地址：https://nodejs.org/zh-cn"
  read -r -p "按回车键关闭…" reply
  exit 1
fi
node scripts/start.mjs
result=$?
if [ "$result" -ne 0 ] && [ "$result" -ne 130 ] && [ "$result" -ne 143 ]; then
  read -r -p "按回车键关闭…" reply
fi
exit "$result"
