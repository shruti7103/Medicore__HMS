@echo off
REM Load DB_PASSWORD from db.env if present
setlocal
set ROOT=%~dp0
if exist "%ROOT%db.env" (
  for /f "usebackq tokens=1,* delims==" %%a in ("%ROOT%db.env") do (
    if /i "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
  )
)
if "%DB_PASSWORD%"=="" set DB_PASSWORD=root
endlocal & set DB_PASSWORD=%DB_PASSWORD%
