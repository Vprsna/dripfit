@echo off
chcp 65001 >nul
cd /d "%~dp0"
python --version >nul 2>&1 || (echo Python не найден. Установи его с python.org и поставь галочку "Add python.exe to PATH". & pause & exit /b)
python -c "import flask" >nul 2>&1 && goto run
echo Устанавливаю Flask (один раз)...
python -m pip install -r requirements.txt --quiet
python -c "import flask" >nul 2>&1 && goto run
echo Сеть проверяет сертификаты по-своему (школьная/рабочая сеть или антивирус). Пробую ещё раз...
python -m pip install -r requirements.txt --quiet --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org
python -c "import flask" >nul 2>&1 || (echo Не получилось установить Flask. Пришли скриншот этого окна. & pause & exit /b)
:run
if not exist config.json copy config.example.json config.json >nul
start "" http://localhost:8000
python server\app.py
pause
