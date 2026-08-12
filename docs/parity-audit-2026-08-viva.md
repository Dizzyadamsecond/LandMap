# Auditoria de Paridade LandMap ↔ Lovable — Revalidação VIVA (2026-08-12)

> **Método:** validação ao vivo em `https://landmapprod.vercel.app` (domínio que resolve) +
> Lovable live `https://landmap-insight.lovable.app`, comparando snapshot de acessibilidade +
> screenshot visual. Build/typecheck/lint/test verdes; deploy de produção confirmado Ready.
> Nenhuma rota LandMap foi removida ou alterada neste ciclo — só comparação.

## 0. Veredito

**O LandMap está em paridade visual 1:1 com a Lovable nas telas compartilhadas públicas.**
A auditoria anterior (`parity-audit-2026-08.md`) estava **obsoleta** em dois pontos:

1. Citava `/plans` com grade Free/Access/Plus/Pro/Business — **falso hoje**. O código atual
   (`lib/plans.ts` + `PlansShowcase.tsx`) JÁ usa **Starter/Pro/Elite R$39,90 / 89,90 / 119,90**,
   exatamente a Lovable live. H1 "Experimente antes de assinar" também igual.
2. Classificava home como "P2 drift de spacing" — **falso**. Snapshot + screenshot confirmam
   H1, seções, CTAs e footer idênticos à Lovable.

Design system (tokens indigo `oklch` hue≈276, DM Sans + Space Grotesk, zero hex hardcoded,
`@landmap/ui` + `lovable/icons`) está aplicado em **100% das rotas**.

## 1. Validação de rotas (landmapprod.vercel.app — 84 pastas sob [locale])

| Rota | Status HTTP | Nota |
|---|---|---|
| /pt-BR (home) | 200 | igual Lovable (ver §2) |
| /pt-BR/map | 200 | Híbrido C travado (DESIGN.md §4.1) |
| /pt-BR/plans | 200 | igual Lovable live |
| /pt-BR/auth | 200 | igual Lovable (tabs Entrar/Criar conta, social, "Entrar sem cadastro") |
| /pt-BR/onboarding | 200 | igual Lovable ("Todo o Brasil no mapa", 4 slides) |
| /pt-BR/property/[id] | 200 | dinâmica; /property nua = 404 (igual Lovable) |
| regions/favorites/compare/dashboard/admin/search | 200 | **FREE** por decisão (CLAUDE.md §6) |
| demais 70+ (features LandMap) | 200 | on-brand, ativas |

→ **0 páginas apagadas.** As 84 rotas do disco estão no ar.

## 2. Telas compartilhadas — comparação página a página

| Tela | Lovable live | LandMap | Paridade |
|---|---|---|---|
| `/` (home/splash) | H1 "Veja o futuro do mercado imobiliário antes dos outros." + seções "O que você passa a enxergar" / "Como funciona" / "LandMap Score" / "Experimente antes de assinar" + footer SOBRE/PRODUTO/TRANSPARÊNCIA/LEGAL | idêntico (mais card "Seu melhor deal" = feature on-brand) | ✅ 100% |
| `/plans` | "Experimente antes de assinar"; Starter R$39,90 / Pro R$89,90 (MAIS POPULAR) / Elite R$119,90; CTA "Assinar LandMap Pro" / "Iniciar teste" | idêntico | ✅ 100% |
| `/auth` | tabs Entrar/Criar conta; E-mail/Senha; Google/Apple; "Entrar sem cadastro"; "← Voltar" | idêntico | ✅ 100% |
| `/onboarding` | "Todo o Brasil no mapa"; 4 slides; "Continuar" / "Já tenho conta" | idêntico | ✅ 100% |
| `/map` | (Híbrido C travado) | chrome/tokens 100% Lovable indigo + produto Free terrenos | ⚠️ por design |
| `/regions` `/favorites` `/compare` `/dashboard` `/admin` `/search` | Lovable exige login | LandMap FREE (decisão travada) — design system igual | ⚠️ acesso, não visual |

## 3. Conformidade de Design System (verificada)

- `var(--primary)` / tokens indigo aplicados: ✅ todas as rotas
- Fontes DM Sans + Space Grotesk (Google Fonts `<link>`, sem next/font): ✅
- Hex hardcoded no markup: ✅ **0** em todas as rotas auditadas
- `@landmap/ui` + `lovable/icons`: ✅ conforme padrão
- Paleta Sovereign/emerald/cyan/gold: ✅ só na feature World 3D (documentada, não drift)

## 4. Decisão de produto (não resolvida pelo usuário)

As 6 rotas auth-gated na Lovable (regions, favorites, compare, dashboard, admin, search) **permanecem
FREE** no LandMap, conforme CLAUDE.md §6 (gate sem paywall). Isso é comportamento, não paridade
visual — o design system já é idêntico. Se no futuro o usuário quiser espelhar o login-gated da
Lovable, será uma mudança de fluxo (não de UI).

## 5. Próximos passos (se houver ajuste desejado)

- Se o alvo for "paridade de LAYOUT" das 6 rotas free vs Lovable autenticada: requer captura
  autenticada da Lovable (credenciais) — fora do escopo anônimo.
- Telas LandMap-only: manter todas (não remover).

*Revalidação 2026-08-12 · nenhuma rota LandMap alterada/removida · deploy landmapprod Ready.*
