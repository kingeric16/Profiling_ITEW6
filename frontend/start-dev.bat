@echo off
cd /d "%~dp0"
echo Starting frontend at http://localhost:5173
echo Keep this window open.
echo.
npm run dev
pause
