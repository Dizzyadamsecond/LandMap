/**
 * Fotos reais do LandMap — extraídas da Lovable (landmap-insight.lovable.app)
 * e drop-in em /public/photos.
 *
 * Cada card de bairro no /insights usa a foto da CIDADE correspondente.
 * As imagens são estáveis, $0, sem API key, sem rede externa.
 *
 * Para adicionar mais fotos ou trocar: basta colocar arquivos em
 *   apps/web/public/photos/
 * e rodar:  node scripts/gen-photo-manifest.mjs
 * O manifesto index.json lista todas as imagens; o helper casa cidade -> arquivo.
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

// Normaliza para comparação: minúsculo, sem acento, só alfanumérico.
// 'São Paulo' -> 'saopaulo'; 'sao-paulo.jpg' -> 'saopaulo'.
const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

const slugToCity = (url: string): string =>
  norm(url.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') ?? '');

/** Foto da cidade do bairro; cai no fallback (índice circular) se não houver mapa. */
export const photoForCity = (
  city: string,
  photos: string[],
  index: number,
): string => photoForCityStrict(city, photos) || photoUrlForIndex(photos, index);

/** Resolve a foto exata da cidade a partir do manifesto. Retorna '' se não bater. */
export const photoForCityStrict = (city: string, photos: string[]): string => {
  if (photos.length === 0) return '';
  const target = norm(city);
  return photos.find((url) => slugToCity(url) === target) ?? '';
};
