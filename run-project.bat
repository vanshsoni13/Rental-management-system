@echo off
setlocal enabledelayedexpansion
title Rental Management System - Startup Launcher

echo ======================================================================
echo           RENTAL MANAGEMENT SYSTEM - SINGLE CLICK LAUNCHER
echo ======================================================================
echo.

REM 1. Check Python installation for the FastAPI backend
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not found in system PATH.
    echo Please install Python 3.10 or higher.
    pause
    exit /b 1
)

REM 2. Check Node.js installation for the existing Vite frontend
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM 3. Check npm installation
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not found in system PATH.
    echo Please ensure npm is installed alongside Node.js.
    pause
    exit /b 1
)

REM 4. Verify directory structure
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

if not exist "%BACKEND_DIR%\app\main.py" (
    echo [ERROR] Python backend entry point not found at: %BACKEND_DIR%\app\main.py
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend directory or package.json not found at: %FRONTEND_DIR%
    pause
    exit /b 1
)

REM Prefer the project environment, but only if its interpreter and Uvicorn work
set "PYTHON_EXE="
if exist "%ROOT_DIR%.venv-py313\Scripts\python.exe" (
    "%ROOT_DIR%.venv-py313\Scripts\python.exe" -c "import uvicorn" >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_EXE=%ROOT_DIR%.venv-py313\Scripts\python.exe"
        echo [OK] Using project Python environment: %ROOT_DIR%.venv-py313
    ) else (
        echo [WARNING] Project Python environment is unavailable or missing Uvicorn.
        echo [INFO] Checking Python from system PATH...
    )
)

if not defined PYTHON_EXE (
    python -c "import uvicorn" >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_EXE=python"
        echo [OK] Using Python from system PATH:
        python -c "import sys; print(sys.executable)"
    )
)

if not defined PYTHON_EXE (
    echo [ERROR] No available Python interpreter with Uvicorn was found.
    echo From the project root, install the backend requirements for your PATH Python:
    echo   python -m pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo [OK] Python, Node.js, npm, and project directories verified.
echo.

REM 4. Detect and Start MySQL Database Service / Daemon
echo [INFO] Checking MySQL Database connection on port 3306...
powershell -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 3306); exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] MySQL Database service is already running on port 3306.
    goto MYSQL_READY
)

echo [INFO] MySQL is not active on port 3306. Attempting to start MySQL service...

REM Try Windows Service Names first
set "MYSQL_SERVICE="
for %%s in (MySQL80 MySQL mysql MySQL57 MariaDB) do (
    sc query "%%s" >nul 2>nul
    if !errorlevel! equ 0 (
        set "MYSQL_SERVICE=%%s"
        goto START_MYSQL_SERVICE
    )
)

:START_MYSQL_SERVICE
if defined MYSQL_SERVICE (
    echo [INFO] Found Windows MySQL Service: !MYSQL_SERVICE!
    net start "!MYSQL_SERVICE!" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Started MySQL Service: !MYSQL_SERVICE!
        goto MYSQL_READY
    )
)

REM Try XAMPP MySQL path if Windows service is not found or failed
if exist "D:\xampp\mysql\bin\mysqld.exe" (
    echo [INFO] Starting XAMPP MySQL daemon at D:\xampp\mysql\bin\mysqld.exe...
    start /b "" "D:\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp\mysql\bin\my.ini" >nul 2>nul
    goto WAIT_MYSQL
)

if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo [INFO] Starting XAMPP MySQL daemon at C:\xampp\mysql\bin\mysqld.exe...
    start /b "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" >nul 2>nul
    goto WAIT_MYSQL
)

echo [WARNING] Could not automatically start MySQL. Please start MySQL Server or XAMPP manually.

:WAIT_MYSQL
echo [INFO] Waiting for MySQL server to accept connections...
for /l %%i in (1,1,10) do (
    powershell -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 3306); exit 0 } catch { exit 1 }" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] MySQL is online and accepting connections on port 3306.
        goto MYSQL_READY
    )
    ping 127.0.0.1 -n 2 >nul
)

echo [WARNING] Could not verify MySQL connection on port 3306. Continuing startup...

:MYSQL_READY
echo.
echo ======================================================================
echo                STARTING BACKEND AND FRONTEND SERVERS
echo ======================================================================
echo.

REM 5. Start Python FastAPI Backend on port 5000
echo [INFO] Launching Python FastAPI server on Port 5000 in a separate window...
start "Rental Management Backend Port 5000" cmd /k "cd /d "%BACKEND_DIR%" && title Backend API - Rental Management && "%PYTHON_EXE%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 5000"

REM 6. Start Frontend Server (React/Vite on port 3000)
echo [INFO] Launching Frontend Web App on Port 3000 in a separate window...
start "Rental Management Frontend Port 3000" cmd /k "cd /d "%FRONTEND_DIR%" && title Frontend Web App - Rental Management && npm run dev"

echo.
echo [INFO] Waiting for Frontend Server to become ready on http://localhost:3000...

for /l %%i in (1,1,15) do (
    powershell -Command "$t = New-Object System.Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', 3000); exit 0 } catch { exit 1 }" >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Frontend Server is ready on http://localhost:3000.
        goto OPEN_BROWSER
    )
    ping 127.0.0.1 -n 2 >nul
)

:OPEN_BROWSER
echo.
echo [INFO] Opening Rental Management System in default web browser...
start http://localhost:3000/

echo.
echo ======================================================================
echo           RENTAL MANAGEMENT SYSTEM IS RUNNING SUCCESSFULLY
echo ======================================================================
echo.
echo  - Frontend Web UI:  http://localhost:3000/
echo  - Python API:      http://localhost:5000/api/health
echo  - MySQL Database:  localhost:3306 (rental_management_db)
echo.
echo  Leave the backend and frontend terminal windows open.
echo  To stop all services safely, run 'stop-project.bat'.
echo ======================================================================
echo.
pause
