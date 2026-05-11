@echo off
REM ============================================================================
REM 运行 R 数据分析脚本
REM ============================================================================

setlocal

REM 设置 R 的路径
set RSCRIPT=E:\R-4.5.2\bin\x64\Rscript.exe

REM 检查 R 是否存在
if not exist "%RSCRIPT%" (
    echo 错误: 未找到 Rscript.exe
    echo 请确认 R 安装在 E:\R-4.5.2
    pause
    exit /b 1
)

echo ============================================
echo 航班延误分析系统 - R 数据分析
echo ============================================
echo.

REM 检查参数
if "%1"=="" (
    echo 运行所有分析脚本...
    echo.
    "%RSCRIPT%" scripts/run_all_analyses.R
) else if "%1"=="all" (
    echo 运行所有分析脚本...
    echo.
    "%RSCRIPT%" scripts/run_all_analyses.R
) else if "%1"=="prepare" (
    echo 运行数据准备脚本...
    echo.
    "%RSCRIPT%" scripts/01_data_preparation.R
) else if "%1"=="module8" (
    echo 运行模块8数据探索脚本...
    echo.
    "%RSCRIPT%" scripts/09_module8_explorer_full.R
) else (
    echo 运行指定脚本: %1
    echo.
    "%RSCRIPT%" scripts/%1
)

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo ✓ 分析完成！
    echo ============================================
) else (
    echo.
    echo ============================================
    echo × 分析失败，请检查错误信息
    echo ============================================
)

echo.
pause
