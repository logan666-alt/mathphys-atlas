@echo off
cd /d "%~dp0"
set "MATHPHYS_NODE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined MATHPHYS_NODE set "MATHPHYS_NODE=%%N"
if not defined MATHPHYS_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "MATHPHYS_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined MATHPHYS_NODE (
  echo Node.js 22 or newer is required. See README.md.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4173/ in your browser.
echo Keep this window open. Press Ctrl+C to stop.
"%MATHPHYS_NODE%" server.mjs
pause
