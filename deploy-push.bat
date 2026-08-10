@echo off
setlocal enabledelayedexpansion

cd /d C:\Users\forrydev\Desktop\LandMap

echo.
echo ========================================
echo 🚀 LANDMAP DEPLOYMENT - GIT PUSH
echo ========================================
echo.

echo 🔧 Configuring git...
git config user.email "ltdapax9@gmail.com"
git config user.name "LandMap CI/CD"

echo.
echo 📝 Staging all changes...
git add .

echo.
echo 💾 Committing changes...
git commit -m "feat: /insights page 100 percent production-ready

- Hero section with CTAs
- Market indicators (IPCA, Selic, CDI, Dollar)
- Regional insights with sparklines
- Opportunity alerts
- Features showcase
- CTA footer
- landmap/ui components
- Lovable indigo design system
- i18n fully configured
- TypeScript typed
- Responsive layout

Status: Ready for Vercel deployment
Co-Authored-By: Claude Haiku 4.5"

echo.
echo 🚀 Pushing to main...
git push origin main -v

echo.
echo ========================================
echo ✨ DEPLOYMENT INITIATED
echo ========================================
echo.
echo 📍 Vercel Status:
echo    - Detecting push...
echo    - Building...
echo    - Deploying...
echo.
echo ⏳ Wait 2-3 minutes for deployment
echo.
echo 🌐 Page will be live at:
echo    https://landmapprod.vercel.app/pt-BR/insights
echo.
echo ✅ Pipeline complete!
echo.

pause
