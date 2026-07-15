@echo off
title LinkedAgent Full Stack Starter
echo ===================================================
echo Starting LinkedAgent Full Stack (Backend + Frontend)...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
echo ===================================================
echo Launch completed. Access http://localhost:5173
echo ===================================================
pause
