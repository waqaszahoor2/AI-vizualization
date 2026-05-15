@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    🌟 AI Visualization Platform - One-Click Setup
echo ===================================================
echo.

:: 1. Check Prerequisites
echo [1/7] Checking for Python and Node.js...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. 
    echo Please download and install it from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/NPM is not installed. 
    echo Please download and install it from: https://nodejs.org/
    pause
    exit /b
)

:: 2. Environment Setup
echo [2/7] Setting up environment variables...
if not exist ".env" (
    echo Creating backend .env...
    (
        echo DEBUG=True
        echo SERVER_HOST=0.0.0.0
        echo SERVER_PORT=8000
        echo OLLAMA_URL=http://localhost:11434
        echo OLLAMA_MODEL=deepseek-coder:6.7b
        echo DATABASE_URL=sqlite:///./dashboards.db
        echo SECRET_KEY=%RANDOM%%RANDOM%
    ) > .env
)

if not exist "frontend\.env" (
    echo Creating frontend .env...
    echo VITE_API_URL=http://localhost:8000 > frontend\.env
)

:: 3. Python Virtual Environment
if not exist "backend\.venv" (
    echo [3/7] Creating Python virtual environment...
    python -m venv backend\.venv
)
echo Installing/Updating backend dependencies...
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt

:: 4. Frontend Dependencies
echo [4/7] Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies for the first time...
    npm install
) else (
    echo Updating dependencies (checking for new packages like html2canvas)...
    npm install --silent
)
cd ..

:: 5. Ollama & AI Model
echo [5/7] Checking AI Service (Ollama)...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is not installed. AI features will not work.
    echo Get it at https://ollama.com/
) else (
    echo Starting Ollama service...
    start "Ollama AI" /min cmd /c "ollama serve"
    echo.
    echo [IMPORTANT] The AI models are now optimized (~1.8GB total). 
    echo This is much faster than the previous 8GB version.
    echo.
    echo Pulling Light-weight AI Models (Qwen & Moondream)...
    ollama pull qwen2.5-coder:1.5b
    ollama pull moondream
)

:: 6. Launch Application
echo.
echo [6/7] Launching Services...
echo.

start "AI Backend" /min cmd /c "cd backend && .venv\Scripts\python main.py"
start "AI Frontend" /min cmd /c "cd frontend && npm run dev"

:: 7. Success & Open
echo ===================================================
echo    🚀 AI VIZ IS READY!
echo ===================================================
echo    - Dashboard:  http://localhost:5173/dashboard
echo    - Workspace:  http://localhost:5173/workspace
echo    - API Docs:   http://localhost:8000/docs
echo.
echo [7/7] Opening Dashboard in browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173/dashboard

echo.
echo Application is running. 
echo - To test, run: backend\.venv\Scripts\python create_demo.py
echo.
echo Press any key to close this terminal (services will keep running in background).
pause >nul
