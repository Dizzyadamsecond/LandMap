# Land Opportunity Engine (nacional, ao vivo)

Engine PURA e determinística de oportunidade de terreno para **100% dos municípios do Brasil** (IBGE).
Cobertura real de 5.571 municípios / 27 UFs / 5 regiões.

## Princípios

- **Sem simulação de imóveis.** Não há "preço de imóvel" inventado — usamos faixas de
  *referência de mercado de solo* por região (piso/mediana/teto, documentadas abaixo) apenas
  para normalizar o score. O score é recomputado a cada tick com indicadores macro **REAIS**.
- **Tempo real de verdade.** Selic (Bacen, série 11) e IPCA (SIDRA, tabela 1736) são buscados
  vivos; em falha de rede cai para `last-known` (`DEFAULT_MACRO`), nunca para dados falsos.
- **Determinístico.** O score base NÃO usa `Date.now()` nem `Math.random()`. Mesmo
  `(id + selic + ipca)` ⇒ mesmo `score`. O único não-determinismo são os sub-scores derivados
  do instante de geração (`generatedAt`), que não afeta o ranking.

## Fluxo

```
[locale]/terrenos  ──<SSE>──>  /api/live/land-stream  ──>  buildLandSnapshot()
                                                   │
                                                   ├─ loadMunicipios()      (data/municipios-br.json)
                                                   ├─ loadCentroids()       (data/uf-centroids.json)
                                                   ├─ getMacroSignals()     (Bacen + SIDRA, fallback last-known)
                                                   └─ rankLandOpportunities() (packages/invest)
```

A URL `/api/live/land-stream` emite evento `snapshot` a cada 15s (SSE — suportado nativamente na Vercel).

## Modelo de score (0–100)

`score = valor*0.28 + crescimento*0.24 + financiamento*0.22 + liquidez*0.14 + risco*0.12`

| Subscore | Sinal | Faixa |
|---|---|---|
| valor | terreno mais barato (próx. piso) pontua melhor | 0–100 |
| crescimento | demanda estrutural da região (IBGE) | 0–100 |
| financiamento | Selic 2%→16% mapeia 100→20 | 0–100 |
| liquidez | tamanho de mercado (SE/S) + ruído estável | 0–100 |
| risco | IPCA alto protege ativo real; Selic alta penaliza | 0–100 |

Grade: `A+ ≥80 · A ≥70 · B ≥60 · C ≥50 · D ≥40 · E <40`.

## Faixas de referência de terreno (R$/m²) por região

| Região | Piso | Mediana | Teto |
|---|---|---|---|
| N (Norte) | 40 | 120 | 380 |
| NE (Nordeste) | 60 | 180 | 520 |
| CO (Centro-Oeste) | 90 | 260 | 700 |
| SE (Sudeste) | 180 | 620 | 2200 |
| S (Sul) | 150 | 520 | 1900 |

> São *ranges de referência* calibrados por observatório de preços de solo — **não** são
> preços garantidos. Documentados aqui para auditabilidade do score.

## Arquivos

- `packages/invest/src/landOpportunity.ts` — engine pura (score, rank, jitter).
- `apps/web/src/lib/landData.ts` — loader server-side (IBGE + Bacen/SIDRA).
- `apps/web/src/lib/useLandOpportunities.ts` — hook client SSE.
- `apps/web/src/app/api/live/land-stream/route.ts` — endpoint SSE.
- `apps/web/src/app/[locale]/terrenos/page.tsx` — painel `NationalLandLive`.
- `data/municipios-br.json`, `data/uf-centroids.json` — dataset nacional.
- `packages/invest/src/landOpportunity.spec.ts` — testes determinísticos.
