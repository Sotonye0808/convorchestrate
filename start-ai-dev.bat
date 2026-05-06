@echo off
REM ─────────────────────────────────────────────────────────────────
REM  start-ai-dev.bat
REM  Run this at the start of every coding session.
REM  Starts Ollama (offline fallback) and codebase-mcp, then opens VS Code.
REM ─────────────────────────────────────────────────────────────────

echo Starting AI Dev Environment...

REM Start Ollama in background (local model server)
start "" "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe" serve

REM Wait a moment for Ollama to initialise
timeout /t 3 /nobreak >nul

REM Start codebase-mcp server (structured repo context)
start "" cmd /c "codebase-mcp start"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Open VS Code in current directory
code .

echo.
echo ─────────────────────────────────────────────────────────
echo  AI Dev Stack is running:
echo    Ollama     → http://localhost:11434
echo    codebase-mcp  → stdio (auto-connected)
echo    VS Code    → opening...
echo ─────────────────────────────────────────────────────────
echo.
