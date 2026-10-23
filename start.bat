@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Устанавливаю Flask (один раз)...
python -m pip install -r requirements.txt --quiet
if not exist config.json copy config.example.json config.json >nul
start "" http://localhost:8000
python server\app.py
pause
