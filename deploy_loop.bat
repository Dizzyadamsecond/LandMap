@echo off
cd /d "C:\Users\forrydev\Desktop\LandMap"
call vercel deploy --prod --yes >> "C:\Users\forrydev\Desktop\LandMap\deploy.log" 2>&1
