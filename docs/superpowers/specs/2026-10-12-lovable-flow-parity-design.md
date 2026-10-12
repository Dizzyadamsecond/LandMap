# Especificação de Design — Paridade 100% do Fluxo Lovable

**Data:** 12 de outubro de 2026  
**Status:** Aprovado  
**Objetivo:** Garantir paridade de 100% no fluxo de navegação, roteamento e autenticação do LandMap em relação ao `landmap-insight.lovable.app`, preservando a tela de splash inicial animada e sem deletar nenhuma rota própria do LandMap. Em seguida, validar em tempo real, commitar no GitHub e realizar deploy via Vercel CLI.

---

## 1. Visão Geral do Fluxo

O fluxo do usuário replica rigorosamente o comportamento do Lovable de ponta a ponta:

```
[ Acesso inicial / ou /[locale] ]
              │
              ▼
    Splash Animado (2.3s)
              │
       ┌──────┴──────┐
       ▼             ▼
[ Sem sessão ]  [ Autenticado ou guest_mode === '1' ]
       │             │
       ▼             ▼
  /onboarding    /dashboard (Mapa principal com Tickers)
       │
       ├── "Pular" / "Ver planos" ──► /plans
       │                                 │
       │                                 └── CTA fixo "Assinar [Plano]" ──► /auth?mode=request
       │
       └── "Já tenho conta" ───────► /auth
                                         │
                                         ├── "Entrar sem cadastro" ──► guest_mode='1' ──► /dashboard
                                         ├── Login / Cadastro com sucesso ──────────────► /dashboard
                                         └── "← Voltar para o site" ──────────────────► /
```

---

## 2. Detalhamento por Rota

### 2.1. Entrada (`/` e `/[locale]`)
- Exibe animação SVG do logotipo LandMap em fundo azul institucional (`#0d3183`) por 2.3s com fade out suave.
- Verifica autenticação:
  - Se houver `user` (mock/Supabase) ou `localStorage.getItem('guest_mode') === '1'`: navega para `/[locale]/dashboard`.
  - Se for primeira visita / deslogado: navega para `/[locale]/onboarding`.

### 2.2. Onboarding (`/[locale]/onboarding`)
- 4 slides com transição e dots indicadores:
  1. *Todo o Brasil no mapa* (MapPinned) — "Explore terrenos e regiões nas principais cidades com preço por m², filtros e camadas de calor."
  2. *Valorização em tempo real* (TrendingUp) — "Veja tendências de subida, estabilidade ou queda por bairro e o histórico de preço da região."
  3. *Radar de oportunidades* (BellRing) — "Alertas inteligentes de valorização e queda de preço direto no seu bolso — não perca janelas."
  4. *Decisão com confiança* (ShieldCheck) — "Dados cruzados de fontes verificadas, com nível de confiança em cada registro."
- Header: Logotipo LandMap e link *"Pular"* para `/[locale]/plans`.
- Rodapé:
  - Botão principal: *"Continuar"* nos slides 0 a 2; *"Ver planos"* no slide 3 (direciona para `/[locale]/plans`).
  - Botão secundário (ghost): *"Já tenho conta"* (direciona para `/[locale]/auth`).

### 2.3. Planos (`/[locale]/plans`)
- Header: Seta para voltar (`/[locale]/onboarding`) e Logotipo.
- Tag: *"Escolha seu plano"* com ícone Sparkles.
- Título: *"Comece a analisar o mercado agora"*, subtítulo: *"Cancele quando quiser. Sem fidelidade."*
- 4 planos:
  1. **LandMap Access** (R$ 69,90/mês) — tag: "Comece com o essencial".
  2. **LandMap Plus** (R$ 119,90/mês, destaque) — tag: "Mais popular".
  3. **LandMap Pro** (R$ 249,90/mês) — tag: "Para profissionais".
  4. **LandMap Business** (R$ 699,90/mês) — tag: "Para equipes".
- Seleção de plano ativa com lista de features e ícone Check.
- Link: *"Já tem conta? Entrar"* apontando para `/[locale]/auth`.
- Rodapé Fixo (Sticky CTA):
  - Botão: *"Assinar [Nome do Plano] — R$ [Valor]/mês"*.
  - Ação: grava `localStorage.setItem('landmap:selected_plan', planId)` e redireciona para `/[locale]/auth?mode=request`.
  - Nota: *"Pagamento não ativado — fluxo de demonstração."*

### 2.4. Autenticação (`/[locale]/auth`)
- Coluna esquerda (desktop): Painel visual de marca com logotipo e texto institucional.
- Coluna direita:
  - Abas: *"Entrar"* e *"Criar conta"*. Se a URL contiver `?mode=request`, a aba inicial selecionada é *"Criar conta"*; caso contrário, *"Entrar"*.
  - Aba *"Entrar"*: E-mail, Senha com alternador de visibilidade (Eye/EyeOff), botão *"Entrar"*.
  - Aba *"Criar conta"*: Nome completo, Telefone (máscara nacional), Tipo de usuário (Corretor, Construtora, Investidor, Empresário), E-mail, Senha com checklist de força (mínimo 8 caracteres e caractere especial).
  - Divisor *"ou"*.
  - Botão secundário *"Entrar sem cadastro"*:
    - Grava `window.localStorage.setItem('guest_mode', '1')`.
    - Redireciona para `/[locale]/dashboard`.
  - Link de rodapé *"← Voltar para o site"* apontando para `/[locale]`.

### 2.5. Rotas Privadas e Guarda de Autenticação (`RequireAuth` / `AppShell`)
- Rotas protegidas (`/dashboard`, `/compare`, `/favorites`, `/regions`, `/admin`):
  - Validam se há usuário logado OU se `localStorage.getItem('guest_mode') === '1'`.
  - Caso negativo, redirecionam imediatamente para `/[locale]/auth`.
  - Remove a criação automática e silenciosa de sessão de visitante em rotas privadas sem que o usuário tenha clicado em *"Entrar sem cadastro"*.
- Menu do usuário no Header:
  - Opção *"Sair"*: remove `guest_mode` do `localStorage`, encerra sessão e redireciona para `/[locale]/auth`.
  - Opção *"Alterar plano"*: redireciona para `/[locale]/plans`.

### 2.6. Redirecionamento da rota `/map`
- Rota `/[locale]/map` redireciona para `/[locale]/dashboard` (comportamento idêntico ao Lovable, onde a experiência de mapa com Bloomberg tickers vive em `/dashboard`).
- O código da tela original de mapa é mantido seguro como fallback e referência no repositório.

### 2.7. Preservação de Rotas Próprias do LandMap
- Nenhuma página é excluída. As 60+ páginas adicionais (Mundo 3D, WorldMonitor, History40, Studio, Vendas, RAG, etc.) continuam ativas e acessíveis através do menu de recursos complementares da sidebar.

---

## 3. Verificação, Git e Deploy

1. **Paridade em Tempo Real:** Execução de suíte de testes comparativos via script Python / Playwright checando cada rota contra o domínio de produção Lovable.
2. **Quality Gates:** `pnpm typecheck` (zero erros) e `pnpm lint` (zero warnings bloqueantes).
3. **Controle de Versão (Git/GitHub):** Commit das alterações e push remoto para `origin/main`.
4. **Deploy Vercel CLI:** Execução de `vercel deploy --prod --yes` da raiz do projeto e conferência da URL ao vivo.
