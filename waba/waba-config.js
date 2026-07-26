// waba-config.js — agente waba-automate para o projeto: LandMap
export const WABA_PROJECT = 'LandMap';
export const agentConfig = {
  welcome: (c) => `Olá ${c.name || 'tudo bem'}! 👋 Sou o assistente da LandMap.`,
  onKeyword: { preco:()=>'💸 R$0 self-host. HUMANO p/ consultor.', planos:()=>'📦 Free/Pro.', humano:async(c,ctx)=>{await ctx.escalate(c);return '🤝 Consultor a caminho.';} },
  fallback:(c)=>'PRECO, PLANOS ou HUMANO.',
};