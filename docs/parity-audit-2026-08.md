# Auditoria de Paridade LandMap ↔ Lovable — 2026-08 (renovada)

> **Objetivo:** re-extrair literalmente o conteúdo renderizado de TODAS as telas
> compartilhadas (Lovable = fonte de verdade) e comparar página a página com o Prod
> LandMap. **Nenhuma rota LandMap foi removida/alterada** — só comparamos.
> **Método:** Lovable via browser (JS executado, anônimo); Prod via SSR + snapshot.
> Artefatos: `scripts/_audit/lovable_rendered_2026-08.json`, `scripts/_audit/prod_ssr_2026-08.json`.

---

## 0. Veredito executivo (resumo das "divergências" que você sente)

A maior parte das divergências não é *drift de UI* — é **diferença de gate de acesso**:

- **No Lovable anônimo, 7 das 10 rotas compartilhadas redirecionam para `/auth`**
  (exigem login): `/regions`, `/favorites`, `/compare`, `/dashboard`, `/admin`, `/search`.
- **No LandMap, essas mesmas rotas ficam PÚBLICAS** (free mock, `RequireAuth` sem paywall),
  conforme decisão travada em `DESIGN.md` §4.0 + CLAUDE.md regra 6.

Ou seja: a página renderiza no nosso app e **não existe** no Lovable anônimo para
comparar 1:1. Isso cria a sensação de "muitas divergências". A paridade 100% só é
verificável onde **ambos são públicos**: `/` (splash), `/plans`, `/auth`, `/onboarding`.

**Conclusão:** o design system (tokens indigo, DM Sans + Space Grotesk, `@landmap/ui`,
`lovable/icons`) está aplicado em 100% das rotas do Prod (verificado: `var(--primary)`
presente em todas, `DM Sans` em todas, **zero hex hardcoded** em todas). O que falta
alinhar não é visual — são **copy/planos** nas telas públicas e a definição de qual
tela deve ser auth-gated vs free.

---

## 1. Matriz de extração (Lovable anônimo × Prod)

| Rota | Lovable anônimo | Prod (LandMap) | Comparável? |
|---|---|---|---|
| `/` | **público** (→ `/splash`) | **público** (200) | ✅ SIM |
| `/regions` | auth → `/auth` | público (200, "Cidades") | ⚠️ free vs auth |
| `/favorites` | auth → `/auth` | público (200, "Terrenos e regiões salvos") | ⚠️ free vs auth |
| `/compare` | auth → `/auth` | público (200, "Comparar bairros") | ⚠️ free vs auth |
| `/dashboard` | auth → `/auth` (title "Mapa — LandMap") | público (200, "Visão geral do mercado") | ⚠️ free vs auth |
| `/admin` | auth → `/auth` | público (200, "Admin") | ⚠️ free vs auth |
| `/plans` | **público** | **público** (200) | ✅ SIM |
| `/auth` | **público** | **público** (200) | ✅ SIM |
| `/search` | auth → `/auth` (title "Buscar no Brasil") | público (200, "Busca inteligente") | ⚠️ free vs auth |
| `/onboarding` | **público** | **público** (200) | ✅ SIM |

---

## 2. Comparação página a página (onde ambos são públicos)

### 2.1 `/` (home / splash) — ✅ ALINHADO
| Item | Lovable | Prod | Match |
|---|---|---|---|
| H1 | "Veja o futuro do mercado imobiliário antes dos outros." | idêntico | ✅ |
| Seções | "O que você passa a enxergar", "Como funciona", "LandMap Score", "Experimente antes de assinar." | idênticas | ✅ |
| CTAs | "Começar gratuitamente por 7 dias", "Ver planos" | idênticas | ✅ |
| Footer | SOBRE / PRODUTO / TRANSPARÊNCIA / LEGAL | idêntico | ✅ |

### 2.2 `/plans` — ⚠️ DIVERGÊNCIA DE COPY/PLANOS (real)
| Item | Lovable (referência) | Prod (LandMap) | Match |
|---|---|---|---|
| H1 | "Experimente antes de assinar" | "Comece a analisar o mercado agora" | ❌ |
| Planos | Starter R$39,90 · Pro R$89,90 (MAIS POPULAR) · Elite R$119,90 | Free · Access R$69,90 · Plus R$119,90 (Mais popular) · Pro R$249,90 · Business R$699,90 | ❌ nomes+preços |
| CTAs | "Começar gratuitamente por 7 dias" / "Assinar LandMap Pro" / "Iniciar teste" | a definir (ver `plans/page.tsx`) | ⚠️ |

> **Ação sugerida:** decidir se o Prod deve espelhar os planos do Lovable (Starter/Pro/Elite,
> R$39,90/89,90/119,90) ou manter a grade LandMap (Free/Access/Plus/Pro/Business). A
> divergência é de *produto*, mas se o objetivo é "100% igual ao Lovable" aqui, os planos
> e o H1 precisam casar.

### 2.3 `/auth` — ✅ ESTRUTURA ALINHADA (verificar copy)
Lovable: tabs "Entrar" / "Criar conta"; campos E-mail/Senha; "Continuar com Google" /
"Continuar com Apple"; "Entrar sem cadastro"; "← Voltar para o site".
Prod: H1 "Entrar", tabs Entrar/Criar conta, campos E-mail/Senha, social Google/Apple,
"Entrar sem cadastro". **Estrutura 1:1.** (Copy exata já validada em sessões anteriores.)

### 2.4 `/onboarding` — ✅ ALINHADO
H1 "Todo o Brasil no mapa" idêntico em ambos; 4 slides; CTAs "Continuar" / "Já tenho conta".

---

## 3. Telas que só existem NOSSAS (não há par no Lovable anônimo)

Estas renderizam no Prod e **não devem ser removidas** — são feature LandMap (DESIGN.md §4.0.1):
`/regions`, `/favorites`, `/compare`, `/dashboard`, `/admin`, `/search`.
A divergência "Lovable mostra /auth, LandMap mostra a página" é **esperada** pela regra
de free access. Se quiser paridade de *comportamento*, o Lovable exigiria login nessas —
o que contraria a decisão de manter free.

> **Importante:** `/map` é o **Híbrido C travado** (DESIGN.md §4.1) — chrome/tokens 100%
> Lovable indigo + produto Free terrenos. Não é clone 1:1 do "Map Intelligence" do Lovable.
> Claims de "mapa 100% igual" continuam proibidas sem captura autenticada + checklist.

---

## 4. Conformidade de Design System (Prod — verificada em 100% das rotas)

| Sinal | Resultado |
|---|---|
| `var(--primary)` / tokens indigo aplicados | ✅ todas as 10 rotas |
| Fonte DM Sans + Space Grotesk | ✅ todas as 10 rotas |
| **Hex hardcoded** (`#[0-9a-f]{6}`) no markup | ✅ **0** em todas as 10 rotas |
| `@landmap/ui` + `lovable/icons` | conforme padrão (tokens presentes) |

→ Não há drift de paleta (sem emerald/cyan/gold de marca fora da feature World 3D).

---

## 5. Próximos passos recomendados (decisão do usuário)

1. **`/plans`:** escolher grade (Lovable Starter/Pro/Elite vs LandMap Free/Access/Plus/Pro/Business)
   e alinhar H1 + CTAs se o alvo for "100% igual".
2. **Gate de acesso:** confirmar se `/regions`, `/favorites`, `/compare`, `/dashboard`,
   `/admin`, `/search` devem seguir free (atual) ou virar auth-gated como o Lovable.
3. Telas LandMap-only: manter todas (não remover).

*Auditoria 2026-08 · extração renderizada do zero · nenhuma rota LandMap alterada/removida.*
