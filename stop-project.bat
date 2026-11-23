@echo off
setlocal enabledelayedexpansion
title Rental Management System - Stop Script

echo ======================================================================
echo           STOPPING RENTAL MANAGEMENT SYSTEM SERVICES
echo ======================================================================
echo.

echo [INFO] Stopping Frontend Server running on Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Terminating process PID: %%a listening on port 3000...
    taskkill /F /PID %%a >nul 2>nul
)

echo [INFO] Stopping Backend Server running on Port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [INFO] Terminating process PID: %%a listening on port 5000...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo ======================================================================
echo    Rental Management System frontend and backend services stopped.
echo ======================================================================
echo.
pause
