// Gera apps/web/public/photos/index.json listando as imagens drop-in.
// Uso: node scripts/gen-photo-manifest.mjs   (roda no root do repo)
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'apps', 'web', 'public', 'photos');
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const files = existsSync(root)
  ? readdirSync(root)
      .filter((f) => EXT.has(extname(f).toLowerCase()))
      .sort()
      .map((f) => `/photos/${f}`)
  : [];

writeFileSync(join(root, 'index.json'), JSON.stringify({ photos: files }, null, 2) + '\n');
console.log(`photos manifest: ${files.length} image(s) -> ${join(root, 'index.json')}`);
