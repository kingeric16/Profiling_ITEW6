@echo off
cd /d "%~dp0"
echo Starting Laravel backend at http://127.0.0.1:8000
echo Keep this window open.
echo.
php artisan serve
pause
