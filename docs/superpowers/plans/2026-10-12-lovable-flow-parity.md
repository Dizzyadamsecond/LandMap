# Paridade 100% de Fluxo Lovable — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar paridade 100% no fluxo de navegação e autenticação em relação ao Lovable (`https://landmap-insight.lovable.app`), mantendo a animação inicial do splash (2.3s), preservando todas as páginas próprias do LandMap, validando em tempo real, realizando commit e deploy em produção na Vercel via CLI.

**Architecture:** Alinhar o funil `/` ➔ `/onboarding` ➔ `/plans` ➔ `/auth` ➔ `/dashboard`. Ajustar o `RequireAuth` para barrar acessos desprotegidos sem login/guest, redirecionar `/map` para `/dashboard`, sincronizar estado de `guest_mode`, rodar testes comparativos, commitar e deployar.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, `@landmap/ui`, Python (auditoria), Git / GitHub CLI, Vercel CLI.

## Global Constraints
- Nenhuma página existente do LandMap pode ser deletada ou removida.
- A tela inicial (`/` e `/[locale]`) deve manter a animação de splash azul de 2.3s antes de redirecionar.
- A ordem da navegação principal deve ser estritamente idêntica aos 8 itens do Lovable.
- Todos os quality gates (`typecheck`, `lint`, `build`) devem passar com 0 erros.

---

### Task 1: Ajuste do Redirecionamento da Página Inicial com Splash Animado

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `readMockUser` from `@/lib/mockAuth`, `localStorage.getItem('guest_mode')`
- Produces: Redirecionamento para `/[locale]/dashboard` se logado ou visitante (`guest_mode === '1'`), ou `/[locale]/onboarding` se primeira visita.

- [ ] **Step 1: Verificar e ajustar `apps/web/src/app/[locale]/page.tsx`**
Garantir que a verificação de `isGuest` considere `localStorage.getItem('guest_mode') === '1'`. Se logado ou visitante, destino = `/${locale}/dashboard`. Caso contrário, `/${locale}/onboarding`.

- [ ] **Step 2: Verificar e ajustar `apps/web/src/app/page.tsx` (root)**
Garantir a mesma lógica para o root redirect.

- [ ] **Step 3: Testar localmente o comportamento com localStorage limpo e com guest_mode setado**

- [ ] **Step 4: Commit**
`git add apps/web/src/app/page.tsx apps/web/src/app/[locale]/page.tsx`
`git commit -m "feat(flow): ensure root splash redirects to onboarding when unauthenticated and dashboard when guest"`

---

### Task 2: Validação e Paridade 1:1 do Onboarding

**Files:**
- Modify: `apps/web/src/app/[locale]/onboarding/page.tsx`

**Interfaces:**
- Produces: 4 slides, botões Pular (➔ `/plans`), Continuar/Ver planos (➔ `/plans`), Já tenho conta (➔ `/auth`).

- [ ] **Step 1: Inspecionar e alinhar textos, ícones e rotas dos botões**
Confirmar que o botão "Pular" leva a `/${locale}/plans`.
Confirmar que o último slide leva a `/${locale}/plans` via "Ver planos".
Confirmar que "Já tenho conta" leva a `/${locale}/auth`.

- [ ] **Step 2: Validar visualmente e funcionalmente**

- [ ] **Step 3: Commit**
`git commit -am "feat(onboarding): ensure 100% flow parity with Lovable onboarding"`

---

### Task 3: Paridade 1:1 da Página de Planos (`/plans`)

**Files:**
- Modify: `apps/web/src/app/[locale]/plans/PlansShowcase.tsx`

**Interfaces:**
- Consumes: `PLANS` from `lib/plans`
- Produces: `localStorage.setItem('landmap:selected_plan', planId)` e navegação para `/[locale]/auth?mode=request`.

- [ ] **Step 1: Ajustar ação do CTA fixo em `PlansShowcase.tsx`**
Ao clicar no botão "Assinar [Plano] — R$ [Preço]/mês", salvar `landmap:selected_plan` no localStorage e navegar diretamente para `/${locale}/auth?mode=request`.
Garantir que o subtítulo seja "Cancele quando quiser. Sem fidelidade." e a nota de rodapé "Pagamento não ativado — fluxo de demonstração.".

- [ ] **Step 2: Verificar e testar o clique do botão no mobile e desktop**

- [ ] **Step 3: Commit**
`git commit -am "feat(plans): update CTA action to redirect to auth?mode=request with selected plan"`

---

### Task 4: Paridade da Tela de Autenticação (`/auth`)

**Files:**
- Modify: `apps/web/src/app/[locale]/auth/page.tsx`

**Interfaces:**
- Consumes: query param `?mode=request`
- Produces: aba Criar conta ativa quando `mode === 'request'`; botão "Entrar sem cadastro" gravando `guest_mode = '1'` e indo para `/dashboard`; link "← Voltar para o site" indo para `/`.

- [ ] **Step 1: Ajustar seleção inicial de abas com `useSearchParams`**
Se `mode === 'request'`, inicializar aba como `'signup'`, senão `'login'`.

- [ ] **Step 2: Ajustar botão "Entrar sem cadastro"**
Definir `localStorage.setItem('guest_mode', '1')` e navegar para `/${locale}/dashboard`.

- [ ] **Step 3: Ajustar link "← Voltar para o site" para direcionar para `/${locale}`**

- [ ] **Step 4: Testar os formulários e navegação**

- [ ] **Step 5: Commit**
`git commit -am "feat(auth): align auth page tabs, guest mode entry and back link with Lovable flow"`

---

### Task 5: Proteção de Rotas Privadas e Ação de Logout (`RequireAuth` e Header)

**Files:**
- Modify: `apps/web/src/components/RequireAuth.tsx`
- Modify: `apps/web/src/lib/mockAuth.ts`
- Modify: `apps/web/src/components/AppShell.tsx` (ou componente do Header/Dropdown)

**Interfaces:**
- Produces: Redirecionamento para `/[locale]/auth` em rotas protegidas se não houver usuário nem `guest_mode === '1'`. No logout, limpa `guest_mode` e direciona para `/[locale]/auth`.

- [ ] **Step 1: Atualizar `RequireAuth.tsx`**
Remover chamada incondicional a `ensureFreeAccess()` que auto-autenticava visitantes.
Verificar se há usuário logado (`readMockUser()`) OU `localStorage.getItem('guest_mode') === '1'`. Se não houver, fazer `router.replace(`/${locale}/auth`)`.

- [ ] **Step 2: Atualizar botão de Sair (Logout)**
Garantir que ao clicar em "Sair" no menu de perfil, o `localStorage.removeItem('guest_mode')` seja executado antes de redirecionar para `/${locale}/auth`.

- [ ] **Step 3: Testar fluxo completo de proteção e deslogue**

- [ ] **Step 4: Commit**
`git commit -am "feat(auth-gate): enforce protected routes redirect to auth without auto-guest and clean logout"`

---

### Task 6: Redirecionamento da Rota `/map` para `/dashboard`

**Files:**
- Modify: `apps/web/src/app/[locale]/map/page.tsx`

**Interfaces:**
- Produces: Redirecionamento transparente de `/map` para `/dashboard`, mantendo paridade 1:1 com o roteamento do Lovable.

- [ ] **Step 1: Implementar redirect para `/[locale]/dashboard` em `[locale]/map/page.tsx`**

- [ ] **Step 2: Testar que acessar `/[locale]/map` leva diretamente a `/[locale]/dashboard`**

- [ ] **Step 3: Commit**
`git commit -am "feat(map): redirect /map to /dashboard matching Lovable behavior"`

---

### Task 7: Auditoria de Paridade e Verificação em Tempo Real

**Files:**
- Modify / Run: `scripts/run_parity_onecall.py` ou script de checagem ao vivo

- [ ] **Step 1: Executar script de validação de fluxo comparando com `landmap-insight.lovable.app`**
- [ ] **Step 2: Verificar resposta 200 e redirecionamentos das 9 rotas principais**

---

### Task 8: Quality Gates (Typecheck, Lint e Build)

- [ ] **Step 1: Rodar `pnpm --filter @landmap/web typecheck`**
- [ ] **Step 2: Rodar `pnpm --filter @landmap/web lint`**
- [ ] **Step 3: Rodar `pnpm --filter @landmap/web build`**

---

### Task 9: Git Commit e Push Remoto

- [ ] **Step 1: Verificar `git status` e `git log`**
- [ ] **Step 2: Fazer push para o repositório remoto via git/gh**

---

### Task 10: Deploy em Produção na Vercel via CLI

- [ ] **Step 1: Verificar autenticação na Vercel CLI (`vercel whoami`)**
- [ ] **Step 2: Executar deploy de produção: `vercel deploy --prod --yes`**
- [ ] **Step 3: Validar a URL live em produção**
