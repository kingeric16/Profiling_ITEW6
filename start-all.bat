@echo off
cd /d "%~dp0"
echo Starting BACKEND (Laravel) in new window...
start "Laravel Backend" cmd /k "cd /d %~dp0backend && php artisan serve"
timeout /t 2 /nobreak >nul
echo Starting FRONTEND (React) in new window...
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Two windows opened:
echo   - Backend:  http://127.0.0.1:8000
echo   - Frontend: http://localhost:5173
echo.
echo Open your browser at http://localhost:5173
echo Close this window when done (the other two must stay open).
pause
