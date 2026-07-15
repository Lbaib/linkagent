@echo off
title LinkedAgent Backend Starter
echo ===================================================
echo Starting LinkedAgent Backend Environment...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-backend.ps1"
echo ===================================================
echo Startup script execution completed.
echo ===================================================
pause
