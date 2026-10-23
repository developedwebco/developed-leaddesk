@echo off
title Push DevEloped LeadDesk to Private GitHub Repo (delveloped-leaddesk)
cd /d "C:\Users\Dev\.gemini\antigravity\scratch\developed-leaddesk"
echo =====================================================================
echo   Push DevEloped LeadDesk to Private GitHub Repo: delveloped-leaddesk
echo =====================================================================
echo.
set /p GH_TOKEN="Paste your GitHub Personal Access Token (ghp_...) and press Enter: "
node push-to-github.js %GH_TOKEN%
pause
