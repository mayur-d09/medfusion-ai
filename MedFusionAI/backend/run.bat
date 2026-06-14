@echo off
cd /d "%~dp0"
echo Starting MedFusion AI Backend...
python -m uvicorn main:app --reload --port 8001
pause
