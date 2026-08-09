# Fotos do LandMap (drop-in)

Coloque AQUI suas fotos reais (imóveis, bairros, capas):
  apps/web/public/photos/

Formatos: .jpg .jpeg .png .webp .avif

Depois rode (root do repo):
  node scripts/gen-photo-manifest.mjs

Ele gera index.json automaticamente. O /insights e o /dashboard
passam a usar SUAS fotos (distribuídas nos cards). Sem API key, sem
rede, sem custo. Se a pasta ficar vazia, os cards caem no gradiente
indigo da marca (data-URI SVG) — nunca quebra.
