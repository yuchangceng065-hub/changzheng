@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js LTS：https://nodejs.org/zh-cn
  pause
  exit /b 1
)
node scripts/start.mjs
if errorlevel 1 pause
