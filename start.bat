@echo off
echo ========================================
echo   FightFight RPG 游戏服务器启动
echo ========================================
echo.

echo [1/2] 启动后端服务器 (端口 3001)...
start "FightFight Backend" cmd /k "cd /d %~dp0 && npm run dev:server"

timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务器 (端口 3000)...
start "FightFight Frontend" cmd /k "cd /d %~dp0 && npm run dev:client"

echo.
echo ========================================
echo   服务器启动完成！
echo ========================================
echo   后端: http://localhost:3001
echo   前端: http://localhost:3000
echo ========================================
echo.
echo 按任意键关闭此窗口...
pause >nul

