@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    🚀 AI Visualization Platform Launcher
echo ===================================================
echo.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install it.
    pause
    exit /b
)

:: Check for NPM
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/NPM not found! Please install it.
    pause
    exit /b
)

echo [1/4] Starting Local AI (Ollama)...
start "Ollama AI" /min cmd /c "ollama serve"

echo [2/4] Starting AI Backend (Port 8000)...
start "AI Backend" /min cmd /c "cd backend && python main.py"

echo [3/4] Starting AI Frontend (Port 5173)...
start "AI Frontend" /min cmd /c "cd frontend && npm run dev"

echo.
echo [4/4] Finalizing startup...
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ===================================================
echo    ✨ Launching Browser: http://localhost:5173
echo ===================================================
echo.

start http://localhost:5173

echo Application is running in the background.
echo To stop everything, close the command windows or use Task Manager.
echo.
pause
