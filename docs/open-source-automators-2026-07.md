# Automatizadores próprios (open-source, $0, anti-ban) — curadoria GitHub

> Objetivo do dono: construir NOSSO automatizador de chamadas e NOSSO
> automatizador de mensagens, **sem pagar API oficial da Meta** e **sem levar ban**.
> Estratégia: montar em cima de projetos open-source maduros (não reinventar).
> Pesquisa via GitHub Search API em 2026-07-27.

## ⚠️ Princípios anti-ban (NÃO NEGOCIÁVEL)
1. **WhatsApp: NUNCA Cloud API paga da Meta.** Usar cliente não-oficial
   (WhatsApp Web multidevice) com *rate-limit natural* + sessão por dispositivo
   + aquecimento de conta. Risco: pode violar ToS da Meta — por isso:
   - Usar apenas com **consentimento do lead** (opt-in) e baixo volume.
   - Ter *fallback* oficial (WABA mock já existe) desligado até haver LTV.
2. **Chamadas: NUNCA APIs de telefonia pagas.** Usar SIP/WebRTC self-hosted
   (FreeSWITCH + SIP.js) — a chamada sai por tronco SIP seu (VOIP barato) ou
   modem GSM. Sem Twilio/Met, sem custo por minuto absurdo.
3. **SMS: gateway self-hosted** (Android como modem ou playSMS) — sem provedor.
4. Tudo orquestrado pelo motor `@landmap/sales` (já existe: autopilot + cron).

## 1. Automatizador de MENSAGENS (WhatsApp)
Projetos candidatos (estrelas na data da pesquisa):

| Projeto | ★ | Linguagem | Uso | Licença |
|---|---|---|---|---|
| WhiskeySockets/Baileys | ~10.3k | TS | API socket-based WhatsApp Web MD (base de tudo) | MIT |
| wwebjs/whatsapp-web.js | ~22.3k | Node | Cliente WA Web mais popular, fácil | Apache-2.0 |
| salman0ansari/whatsapp-api-nodejs | ~1.3k | Node | REST API multi-dispositivo pronta | MIT |
| asternic/wuzapi | ~0.9k | Go | REST API WA em Golang (whatsmeow) | — |
| playsms/playsms | ~0.9k | PHP | Gateway de SMS (fallback SMS) | GPL-3.0 |

**Escolha recomendada:** `whatsapp-web.js` (22k★, comunidade gigante, Apache-2.0)
como camada de envio + nosso `waba_followup` agente refatorado para usar WA Web
em vez de Cloud API. Rate-limit interno + fila por conta. Mantém o
`WhatsAppClient` oficial como **fallback mock** (já existe em
`packages/integrations/src/whatsapp.ts`), ativado só com credencial.

## 2. Automatizador de CHAMADAS (Discador/Voz)
Projetos candidatos:

| Projeto | ★ | Linguagem | Uso | Licença |
|---|---|---|---|---|
| lihaiya/freeipcc | ~113 | — | Call center / outbound / FreeSWITCH | — |
| easycallcenter365/easycallcenter365 | ~93 | — | AI call-center (LLM + FreeSWITCH) | — |
| inktel/Vicidial | ~99 | PHP/Asterisk | Dialer preditivo maduro | AGPL/comercial |
| rubyists/tiny_call_center | ~46 | Ruby | Framework call center FreeSWITCH | — |
| playsms/playsms | ~876 | PHP | SMS gateway (fallback) | GPL-3.0 |
| alepolidori/sipjs-webrtc-phone | ~7 | JS | Softphone browser (SIP.js) | — |

**Escolha recomendada (leve, $0, sem PBX pesado):** stack próprio mínimo
`FreeSWITCH` (servidor) + `SIP.js` (softphone browser/Node) + nosso discador
em Node que:
- lê a fila de `SalesTask` (kind `follow_up`, channel `call`)
- disca via SIP trunk (VOIP barato tipo MySudo/Localphone ou tronco SIP grátis p/ teste)
- toca TTS (coqui/piper local, sem nuvem) ou conecta humano
- registra `channelStats.call` no `SalesStore`

Vicidial é poderoso mas pesado (Asterisk+PHP+DB) e licença mista — só se
precisar de discador preditivo enterprise. Para começar: SIP.js + FreeSWITCH.

## 3. Como encaixa no LandMap (arquitetura)
```
@landmap/sales (motor, já existe)
  ├─ LeadScorerAgent (score 0-100)         [existe]
  ├─ conversion.ts (PROBABILIDADE 0-1)      [criado nesta sessão]
  ├─ decideFollowUp (aggressive|normal|light|pause) [criado]
  └─ agents: followup / cold_recovery / waba_followup
        │
        ├── MENSAGENS ──> whatsapp-web.js (WA Web MD, anti-ban)
        │                fallback: WhatsAppClient oficial (mock)
        └── CHAMADAS  ──> SIP.js + FreeSWITCH (discador Node)
                         fallback: SMS via playSMS (Android modem)
```
Decisão de canal orientada pela propensão:
- P >= 0.6  → chamada + WhatsApp agressivo (12h)
- P >= 0.35 → WhatsApp normal (48h)
- P >= 0.15 → WhatsApp leve (120h)
- P < 0.15  → pause (não queimar lead)

## 4. Próximos passos (autônomos, sem quebrar UX/planos)
1. Criar `packages/automation` (TS): wrapper `WhatsAppWebSender` (usa whatsapp-web.js
   via child ou import) + `SipDialer` (SIP.js). Respeita rate-limit.
2. Refatorar `waba_followup` agent → `omnichannel_followup` que decide canal
   por `decideFollowUp()`.
3. Endpoint `/api/automation/send` (POST) → dispatcher anti-ban.
4. Cron já existe (`/api/cron/sales-loop`) → só adicionar dispatch de calls.
5. Validar typecheck/build. NÃO disparar mensagens reais sem opt-in.

> Nota: web_search do ambiente sem créditos; pesquisa feita via GitHub API.
> Licenças marcadas com "—" não foram confirmadas no momento (conferir antes
> de vendorar o código no repo).
