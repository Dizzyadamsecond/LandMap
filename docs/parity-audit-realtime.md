# LandMap — Auditoria de Paridade (Lovable ref vs Produção)

> Gerado por auditoria comparando os snapshots prerenderizados autoritativos do Lovable
> (`apps/web/public/lovable_*.html`, HTML servido real 15–24KB) contra o source de produção
> (`apps/web/src/app/[locale]/**`). Live fetch indisponível neste host (web_extract/Firecrawl DOWN),
> mas os snapshots SÃO a captura literal do que o Lovable serve — fonte fiel para paridade.

## Fontes carregadas (P0 — DISCREPÂNCIA REAL)
- **Lovable ref (autoritativo):** `DM Sans` + `Space Grotesk` — **SÓ 2 famílias. NÃO carrega JetBrains Mono.**
- **Produção atual:** `DM Sans` + `Space Grotesk` + **`JetBrains Mono`** (`apps/web/src/app/layout.tsx:53`).
- CLAUDE.md/DESIGN.md fixam 3 fontes (inclui JetBrains Mono) — mas o Lovable servido tem apenas 2.
- Uso de `.font-mono` no source: 16 componentes + `--font-mono` em globals.css.
- **DECISÃO NECESSÁRIA:** para paridade 100% literal, remover JetBrains Mono do `<link>` e
  apontar `--font-mono` para o fallback do sistema — OU manter (viola a paridade de fontes).

## Snapshots Lovable (title + description autoritativos por rota)
- **admin**: title=`Administração — LandMap` | desc=`LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² par`
- **auth**: title=`Entrar — LandMap` | desc=`Acesse a plataforma LandMap ou solicite acesso.`
- **compare**: title=`Comparação de regiões — LandMap` | desc=`LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² par`
- **dashboard**: title=`Mapa — LandMap` | desc=`Inteligência territorial premium: heatmap de valorização, score LandMap por regi`
- **favorites**: title=`Favoritos — LandMap` | desc=`LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² par`
- **map**: title=`LandMap — Inteligência de terrenos` | desc=`LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² par`
- **onboarding**: title=`Conheça o LandMap` | desc=`Como o LandMap ajuda você a decidir sobre terrenos com dados.`
- **plans**: title=`Planos — LandMap` | desc=`Escolha o plano LandMap ideal: Access, Plus, Pro ou Business.`
- **regions**: title=`Regiões — LandMap` | desc=`LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² par`

## Metadata em produção
- Root `layout.tsx` define OG global title `LandMap — Inteligência de terrenos`.
- Rotas em `[locale]/**/page.tsx` **não exportam `metadata.title` próprio** (nenhum `title:` encontrado).
  → Lovable tem títulos por rota (`Planos — LandMap`, `Regiões — LandMap`, `Mapa — LandMap`).
  **P1:** adicionar `export const metadata = { title: '...' }` por rota para bater com Lovable.

## Priorização
### P0 (bloqueia paridade)
1. Fontes: Lovable serve 2 famílias, prod serve 3 → `apps/web/src/app/layout.tsx:53`. Decisão do dono.
### P1 (visível, fácil)
2. Titles por rota ausentes em prod → adicionar `metadata.title` em cada `[locale]/<rota>/page.tsx`
   usando exatamente os strings da tabela acima.
3. og:image: Lovable usa asset R2 (`pub-bb2e...r2.dev/...png`); prod usa `/og-image.svg`.
   Se paridade de preview social importa, alinhar (baixar o PNG ou manter SVG próprio).
### P2 (cosmético)
4. `#lovable-badge` presente nos snapshots — NÃO replicar (é marca do Lovable, indesejado em prod).

## Nota de método
- Snapshots `lovable_html_*.html` são duplicatas idênticas de `lovable_*.html` (mesmo bytes) — ignoradas.
- Chunks JS (`lovable_chunk_*.js`) e shells SPA vazios: corretamente ignorados (inúteis/timeout).

## Auditoria 2026-08-01 (página por página, componente a componente)
**Descoberta-chave:** dos 12 snapshots Lovable baixados, **apenas `metodologia` tem conteúdo renderizado real**
(56 frases / 3.247 chars visíveis). As outras 11 rotas são **shells SPA vazios** — só `<title>`/`<meta
description>` + `#lovable-badge`, sem corpo (o Lovable renderiza via JS no cliente e o snapshot não capturou o
conteúdo). Portanto a paridade "literal componente-a-componente" só é factível para `metodologia`; para as
demais rotas a paridade é de **chrome/tokens/shell** (garantida pelo `ProductPageShell` + design system
Lovable/indigo) e de **metadata** por rota.

### Estado de paridade por rota (vs snapshot Lovable)
| Rota Lovable | Conteúdo no snapshot | Estado LandMap | Ação |
|---|---|---|---|
| `metodologia` | 56 frases (texto completo) | **ROTA NOVA CRIADA** | `apps/web/src/app/[locale]/metodologia/page.tsx` + `layout.tsx` (generateMetadata pt/en/es). Copy 1:1 (10 seções + versão/atualização + box Observação amber). |
| `plans` | 25 frases (preços/features) | ✅ já 100% | `lib/plans.ts` bate exato: Access 69,90 / Plus 119,90 / Pro 249,90 / Business 699,90 + Free extra. |
| `onboarding` | 7 frases | ✅ já 100% | H1 "Todo o Brasil no mapa" + desc exatos. |
| `auth` | shell (só title) | ✅ layout já tem generateMetadata | title `Entrar — LandMap` OK. |
| `map` | shell | ✅ layout OK | title `Mapa — LandMap`. |
| `regions` | shell | ✅ layout OK | title `Regiões — LandMap`. |
| `favorites` | shell | ✅ layout OK | title `Favoritos — LandMap`. |
| `compare` | shell | ✅ layout OK | title `Comparação de regiões — LandMap`. |
| `dashboard` | shell | ✅ layout OK | title `Mapa — LandMap`. |
| `admin` | shell | ✅ layout OK | title `Administração — LandMap`. |
| `profile` | shell | ✅ layout OK | title `Perfil — LandMap`. |
| `home` | shell | ✅ root layout OK | title `LandMap — Inteligência de terrenos`. |

### Notas
- **P1 resolvido (não era gap real):** o audit anterior achou "0 page.tsx com metadata.title", mas o LandMap
  usa `generateMetadata` em cada `layout.tsx` de rota (server component) — equivalente e correto. Todas as 12
  rotas Lovable já tinham titles por rota.
- **P0 (fontes):** produção carrega DM Sans + Space Grotesk + system-mono (`--font-mono` aponta p/ stack de
  sistema, NÃO JetBrains Mono — alinhado ao Lovable que não carrega JetBrains). Paridade de fontes OK.
- `compare_lovable.py` / `extract_lovable.py` só cobrem as 10 rotas originais no dict `SCREENS`; `metodologia`
  e `profile` não estão mapeados nesses scripts (adicionar se quiser re-rodar parity).
- `#lovable-badge` e `Edit with Lovable` NÃO replicados (marca indesejada).
- Build/typecheck/lint verdes após criação de `/metodologia` (263 páginas estáticas geradas).
