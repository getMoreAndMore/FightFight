@echo off
chcp 65001 >nul
echo 🗑️ 开始删除测试菜单...
echo.

REM 删除文件
if exist client\ui\components\TestMenu.js (
    del client\ui\components\TestMenu.js
    echo ✅ 已删除: client\ui\components\TestMenu.js
) else (
    echo ⚠️ 文件不存在: client\ui\components\TestMenu.js
)

if exist server\routes\testRoutes.js (
    del server\routes\testRoutes.js
    echo ✅ 已删除: server\routes\testRoutes.js
) else (
    echo ⚠️ 文件不存在: server\routes\testRoutes.js
)

if exist TEST_MENU_README.md (
    del TEST_MENU_README.md
    echo ✅ 已删除: TEST_MENU_README.md
) else (
    echo ⚠️ 文件不存在: TEST_MENU_README.md
)

if exist remove-test-menu.bat (
    echo ✅ 已删除: remove-test-menu.bat
    del remove-test-menu.bat
)

echo.
echo ========================================
echo ⚠️ 请手动修改以下文件：
echo ========================================
echo.
echo 1️⃣  server/index.js
echo    删除：第17-18行
echo      const testRoutes = require('./routes/testRoutes');
echo.
echo    删除：第76-77行
echo      app.use('/api/test', testRoutes);
echo.
echo 2️⃣  client/ui/UIManager.js
echo    删除：约第243-244行（测试菜单按钮）
echo      ^<!-- 🧪 测试菜单按钮（生产环境请删除） --^>
echo      ^<button class="nav-btn" data-view="test" ...^>🧪 测试^</button^>
echo.
echo    删除：约第371-374行（case 'test'）
echo      case 'test':
echo        this.showTestMenu();
echo        break;
echo.
echo    删除：约第381-394行（showTestMenu 方法）
echo      async showTestMenu() { ... }
echo.
echo ========================================
echo 3️⃣  删除完成后：
echo    - 重启后端服务器
echo    - 刷新前端页面
echo    - 确认测试按钮不再显示
echo ========================================
echo.
pause

