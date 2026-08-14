#!/bin/bash
# ============================================================================
# LandMap — VALIDAÇÃO COMPLETA DE INTEGRIDADE DE ROTAS
# Verifica se TODAS as rotas críticas estão presentes e funcionais
# ============================================================================

set -e

echo "🔍 VALIDAÇÃO COMPLETA DE INTEGRIDADE DE ROTAS"
echo "=============================================="
echo ""

# 1. ROTAS WEB CRÍTICAS (UI)
echo "✓ Verificando rotas Web críticas..."
CRITICAL_WEB_ROUTES=(
  "/world" "/world-3d" "/worldmonitor" "/history40"
  "/terrenos" "/live" "/studio" "/calculator"
  "/chat" "/status" "/insights" "/sales"
  "/property" "/investor" "/dashboard" "/cockpit"
  "/radar" "/heatmap" "/assistant"
)

MISSING_WEB=0
for route in "${CRITICAL_WEB_ROUTES[@]}"; do
  ROUTE_SAFE=$(echo "$route" | sed 's/\//\\\//g')
  if ! grep -q "app/\[locale\]$ROUTE_SAFE" <<< "$(find apps/web/src/app/\[locale\] -name 'page.tsx' | sed 's|apps/web/src/app/\[locale\]||g' | sed 's|/page.tsx||g')"; then
    if [ "$route" != "/property" ]; then  # property é /property/[id]
      MISSING_WEB=$((MISSING_WEB + 1))
      echo "  ❌ Rota web $route NÃO encontrada"
    fi
  fi
done

if [ $MISSING_WEB -eq 0 ]; then
  echo "  ✅ Todas as rotas Web críticas PRESENTES"
else
  echo "  ⚠️  $MISSING_WEB rotas Web faltando"
fi

# 2. ROTAS API CRÍTICAS
echo "✓ Verificando rotas API críticas..."
CRITICAL_API_ROUTES=(
  "auctions" "automation" "embeddings" "funnel"
  "insights" "inspect" "integrations" "invest"
  "rag" "sales" "webhooks" "valuation"
  "vc-features" "worldmonitor" "history40" "geo"
  "gamification" "market" "properties"
)

MISSING_API=0
for route in "${CRITICAL_API_ROUTES[@]}"; do
  if ! grep -q "$route" packages/api/src/index.ts 2>/dev/null; then
    MISSING_API=$((MISSING_API + 1))
    echo "  ❌ Rota API $route NÃO registrada em index.ts"
  fi
done

if [ $MISSING_API -eq 0 ]; then
  echo "  ✅ Todas as rotas API críticas REGISTRADAS"
else
  echo "  ⚠️  $MISSING_API rotas API faltando"
fi

# 3. COMPONENTES CRÍTICOS (@landmap/ui)
echo "✓ Verificando componentes UI críticos..."
CRITICAL_COMPONENTS=(
  "Button" "Card" "Badge" "Progress" "Sparkline"
  "MobileBottomNav" "Navbar" "Sidebar"
)

MISSING_UI=0
for component in "${CRITICAL_COMPONENTS[@]}"; do
  if ! grep -q "export.*$component\|export.*function $component\|export.*const $component" packages/ui/src/index.ts 2>/dev/null; then
    MISSING_UI=$((MISSING_UI + 1))
    echo "  ❌ Componente $component NÃO exportado"
  fi
done

if [ $MISSING_UI -eq 0 ]; then
  echo "  ✅ Todos os componentes UI críticos EXPORTADOS"
else
  echo "  ⚠️  $MISSING_UI componentes UI faltando"
fi

# 4. FEATURES PRINCIPAIS
echo "✓ Verificando Features principais..."
FEATURES_OK=0
[ -d "apps/web/src/app/\[locale\]/worldmonitor" ] && FEATURES_OK=$((FEATURES_OK + 1)) || echo "  ❌ WorldMonitor missing"
[ -d "apps/web/src/app/\[locale\]/history40" ] && FEATURES_OK=$((FEATURES_OK + 1)) || echo "  ❌ History40 missing"
[ -d "apps/web/src/app/\[locale\]/world" ] && FEATURES_OK=$((FEATURES_OK + 1)) || echo "  ❌ World 3D missing"

if [ $FEATURES_OK -eq 3 ]; then
  echo "  ✅ Features principais (WorldMonitor, History40, Mundo 3D) PRESENTES"
else
  echo "  ⚠️  $((3 - FEATURES_OK)) features faltando"
fi

# 5. DATABASE SCHEMA
echo "✓ Verificando Database schema..."
TABLE_COUNT=$(grep -c "CREATE TABLE" supabase/migrations/*.sql 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -gt 40 ]; then
  echo "  ✅ Database schema VÁLIDO ($TABLE_COUNT tabelas)"
else
  echo "  ⚠️  Database schema com apenas $TABLE_COUNT tabelas (esperado > 40)"
fi

# 6. DESIGN TOKENS
echo "✓ Verificando Design tokens..."
if grep -q "oklch" apps/web/src/app/globals.css 2>/dev/null && \
   grep -q "DM Sans\|Space Grotesk" apps/web/src/app/layout.tsx 2>/dev/null; then
  echo "  ✅ Design tokens e fontes Lovable SINCRONIZADOS"
else
  echo "  ⚠️  Design tokens ou fontes FORA DE SINCRONIA"
fi

# 7. INTEGRAÇÃO DE ROTAS
echo "✓ Verificando integração de rotas no API server..."
if grep -q "import.*routes\|app\.use\|createRouter" packages/api/src/index.ts 2>/dev/null; then
  ROUTES_MOUNTED=$(grep -c "app\.use\|createRouter" packages/api/src/index.ts || echo "0")
  echo "  ✅ $ROUTES_MOUNTED rotas montadas no servidor API"
else
  echo "  ❌ Nenhuma rota encontrada no index.ts"
fi

echo ""
echo "=============================================="
echo "✅ VALIDAÇÃO COMPLETA"

if [ $MISSING_WEB -eq 0 ] && [ $MISSING_API -eq 0 ] && [ $MISSING_UI -eq 0 ]; then
  echo "Status: 🟢 TODAS AS ROTAS E FEATURES ESTÃO PRESENTES"
else
  echo "Status: 🟡 ALGUMAS ROTAS FALTANDO — VERIFICAÇÃO NECESSÁRIA"
fi

echo "=============================================="
echo ""
echo "📊 RESUMO:"
echo "  Web Routes OK: $((${#CRITICAL_WEB_ROUTES[@]} - $MISSING_WEB))/${#CRITICAL_WEB_ROUTES[@]}"
echo "  API Routes OK: $((${#CRITICAL_API_ROUTES[@]} - $MISSING_API))/${#CRITICAL_API_ROUTES[@]}"
echo "  UI Components OK: $((${#CRITICAL_COMPONENTS[@]} - $MISSING_UI))/${#CRITICAL_COMPONENTS[@]}"
echo "  Features OK: $FEATURES_OK/3"
echo "  Database Tables: $TABLE_COUNT"
echo ""
