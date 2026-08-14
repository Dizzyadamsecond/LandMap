# AUDITORIA FINAL: LOVABLE vs LANDMAP

## 🎯 DIVERGÊNCIA DESCOBERTA

### **Página Inicial**

| Sistema | URL | Redirecionamento |
|---------|-----|------------------|
| **Lovable** | `/` → **`/dashboard`** | Se autenticado: `/dashboard` |
| **LandMap** | `/` → ? | Verificar em apps/web/src/app/layout.tsx |

### **Ordem de Navegação no Navbar**

**Lovable (`_authenticated/route.tsx`)**
```
1. Mapa          → /dashboard      ✅
2. Dashboard     → (soon)          🔜
3. Comparador    → /compare        ✅
4. Favoritos     → /favorites      ✅
5. Alertas       → (soon)          🔜
6. Relatórios    → (soon)          🔜
7. IA LandMap    → (soon)          🔜
8. Configurações → (soon)          🔜
```

**LandMap (apps/web/src/components/Navbar.tsx)**
```
1. Mapa          → /dashboard      ✅ (mas labelKey: 'Mapa grátis')
2. Dashboard     → /dashboard (soon: true)     🔜 ✅
3. Comparador    → /compare        ✅
4. Favoritos     → /favorites      ✅
5. Alertas       → /alerts (soon: true)        🔜 ✅
6. Relatórios    → /reports (soon: true)       🔜 ✅
7. IA LandMap    → /chat (soon: true)          🔜 ✅
8. Configurações → /settings (soon: true)      🔜 ✅
+ 30 rotas extras (preservadas)
```

## 📋 STATUS

| Aspecto | Status | Notas |
|---------|--------|-------|
| **Página Inicial** | 🟡 VERIFICAR | LandMap começa em `/` ou `/dashboard`? |
| **Ordem Navbar (8 itens)** | ✅ OK | 100% igual ao Lovable |
| **Itens 'soon'** | ✅ OK | Dashboard, Alertas, Relatórios, IA LandMap marcados como `soon: true` |
| **Rotas Extras** | ✅ OK | 30+ rotas LandMap preservadas após os 8 principais |
| **Labels** | 🟡 DIVERGÊNCIA | LandMap item 1: `labelKey: 'Mapa grátis'` vs Lovable: `label: 'Mapa'` |
| **URLs** | 🟡 RELATIVA | Lovable usa `/dashboard`, LandMap usa `dashboard` (relativo) |

## ✅ AÇÃO NECESSÁRIA

1. **Verificar página inicial do LandMap:**
   - `/` redireciona para `/dashboard`? (como Lovable)
   - Ou redireciona para `/map`? (divergência)

2. **Corrigir labelKey se necessário:**
   - Lovable: `"Mapa"`
   - LandMap: `"Mapa grátis"` ← Pode divergir visualmente

## 📍 PRÓXIMA ETAPA

Verificar `apps/web/src/app/layout.tsx` ou `apps/web/src/app/[locale]/layout.tsx` para confirmar redirecionamento inicial.

---

**Documento gerado:** 2026-08-14  
**Fonte:** `extracted_lovable/src/routes/index.tsx` e `extracted_lovable/src/routes/_authenticated/route.tsx`
