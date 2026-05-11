@echo off
REM ============================================================================
REM 添加 R 到系统 PATH 环境变量
REM ============================================================================

echo 正在添加 R 到系统 PATH...

REM 设置 R 的安装路径
set R_HOME=E:\R-4.5.2
set R_BIN=%R_HOME%\bin\x64

REM 检查 R 是否存在
if not exist "%R_BIN%\Rscript.exe" (
    echo 错误: 未找到 R 安装目录 %R_BIN%
    echo 请检查 R 安装路径是否正确
    pause
    exit /b 1
)

echo 找到 R 安装目录: %R_BIN%

REM 添加到用户 PATH（不需要管理员权限）
echo 正在添加到用户 PATH...
setx PATH "%PATH%;%R_BIN%"

if %errorlevel% equ 0 (
    echo.
    echo ✓ 成功添加 R 到 PATH！
    echo.
    echo 请关闭并重新打开命令行窗口以使更改生效
    echo 之后可以直接使用 Rscript 命令
    echo.
    echo 测试命令: Rscript --version
) else (
    echo.
    echo × 添加失败，请尝试以管理员身份运行此脚本
)

echo.
pause
