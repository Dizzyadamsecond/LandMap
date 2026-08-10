@echo off
cd /d "C:\Users\forrydev\Desktop\LandMap"
vercel --prod --yes > "C:\Users\forrydev\Desktop\LandMap\deploy_prod_log.txt" 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> "C:\Users\forrydev\Desktop\LandMap\deploy_prod_log.txt"
