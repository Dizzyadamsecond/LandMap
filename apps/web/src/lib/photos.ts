/**
 * Fotos reais do LandMap — drop-in em /public/photos.
 *
 * Para usar SUAS fotos (de imóveis, bairros, capas), copie os arquivos para:
 *   apps/web/public/photos/
 * Formatos aceitos: .jpg .jpeg .png .webp .avif
 *
 * Um manifesto (photos/index.json) é gerado por scripts/gen-photo-manifest.mjs
 * e listado em runtime. Sem API key, sem rede, sem custo.
 *
 * Se a pasta estiver vazia (sem index.json ou vazio), `photoFor` devolve ''
 * e o card cai no gradiente indigo da marca (data-URI SVG) — o app nunca
 * quebra nem fica sem imagem.
 */

export const PHOTOS_MANIFEST_URL = '/photos/index.json';

export type PhotoManifest = { photos: string[] };

let cache: string[] | null = null;

/** Busca o manifesto de fotos (com cache em memória). Retorna [] se vazio/ausente. */
export async function loadPhotos(): Promise<string[]> {
  if (cache) return cache;
  try {
    const res = await fetch(PHOTOS_MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) return (cache = []);
    const data = (await res.json()) as PhotoManifest;
    return (cache = Array.isArray(data.photos) ? data.photos : []);
  } catch {
    return (cache = []);
  }
}

/** URL da foto para o card de índice `i` (circular). Retorna '' se não houver fotos. */
export const photoUrlForIndex = (photos: string[], i: number): string =>
  photos.length === 0 ? '' : photos[((i % photos.length) + photos.length) % photos.length];
