@echo off
rem ============================================================================
rem  Long March Journey - local command wrapper
rem  Works in both cmd.exe and PowerShell. No long paths to type.
rem
rem  Usage (run from the project folder):
rem    run install          install dependencies
rem    run fetch:basemap    download the base map
rem    run verify           end-to-end check
rem    run check:data       history data check only
rem    run build            production build
rem    run dev              start dev server  (http://127.0.0.1:5173)
rem    run preview          preview the build (http://127.0.0.1:4173)
rem
rem  If the paths below are wrong on your machine, edit DSH_NODE / DSH_PNPM.
rem  This file is ASCII-only on purpose: batch files are read using the
rem  console codepage, so embedding a non-ASCII path here would garble it.
rem  %USERPROFILE% expands to the user folder, so no literal path is needed.
rem  chcp 65001 is set so the Node scripts' Chinese output displays correctly.
rem  node's folder is prepended to PATH so nested "node" calls also resolve.
rem ============================================================================

chcp 65001 >nul
setlocal

set "DSH_NODE_DIR=%USERPROFILE%\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin"
set "DSH_NODE=%DSH_NODE_DIR%\node.exe"
set "DSH_PNPM=%USERPROFILE%\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs"

rem Put node on PATH for this session. Dependency install scripts invoke a bare
rem "node" (esbuild's postinstall runs "node install.js"), and the Vite/esbuild
rem toolchain does too, so relying on the absolute path alone is not enough.
set "PATH=%DSH_NODE_DIR%;%PATH%"

if not exist "%DSH_NODE%" (
  echo [ERROR] Node executable not found:
  echo         %DSH_NODE%
  echo         Edit DSH_NODE at the top of this file to point at your node.exe.
  exit /b 1
)

if not exist "%DSH_PNPM%" (
  echo [ERROR] pnpm entry script not found:
  echo         %DSH_PNPM%
  echo         Edit DSH_PNPM at the top of this file.
  exit /b 1
)

rem Always operate on the folder this file lives in, whatever the caller's cwd.
cd /d "%~dp0"

if "%~1"=="" (
  echo.
  echo  Usage:  run ^<command^>
  echo.
  echo    run install          install dependencies
  echo    run fetch:basemap    download the base map
  echo    run verify           end-to-end check
  echo    run check:data       history data check only
  echo    run build            production build
  echo    run dev              start dev server
  echo    run preview          preview the build
  echo.
  exit /b 0
)

"%DSH_NODE%" "%DSH_PNPM%" %*
exit /b %ERRORLEVEL%
