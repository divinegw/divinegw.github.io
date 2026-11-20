// Prepara as imagens da Galeria (/galeria.html) a partir das artes da guilda.
// Uso (em site-astro/):  node scripts/galeria.mjs
//
// Fonte de cada arte, nesta ordem:
//   1. ../../Artes/upscayl/final/<grupo>-<vaga>.png      (ampliada pelo Upscayl, Remacri 2x; ver Artes/upscayl/ampliar.ps1)
//   2. ../../Artes/upscayl/originais/<grupo>-<vaga>.*     (cópia do original do gerador, enquanto a ampliada não existe)
// Saída: src/assets/galeria/<grupo>-<vaga>.jpg, com 2400 px de largura no máximo e qualidade 90. O Astro gera o WebP
// de cada tamanho na build. Os PNGs de 3200 px não entram no site: vão como anexos no Release do GitHub (GALERIA.release).
// Só refaz a imagem quando a fonte é mais nova que a saída.
import { readdir, stat, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const aqui = fileURLToPath(new URL('..', import.meta.url));
const artes = join(aqui, '..', '..', 'Artes', 'upscayl');
const saida = join(aqui, 'src', 'assets', 'galeria');
const LARGURA = 2400;

await mkdir(saida, { recursive: true });
const fontes = new Map();
for (const pasta of ['originais', 'final']) { // 'final' por último: substitui o original quando existe
  const dir = join(artes, pasta);
  for (const f of await readdir(dir).catch(() => [])) {
    if (/\.(png|webp|jpe?g)$/i.test(f)) fontes.set(parse(f).name, { arquivo: join(dir, f), ampliada: pasta === 'final' });
  }
}

let feitas = 0, iguais = 0;
for (const [nome, { arquivo, ampliada }] of [...fontes].sort()) {
  const destino = join(saida, `${nome}.jpg`);
  const [f, d] = await Promise.all([stat(arquivo), stat(destino).catch(() => null)]);
  if (d && d.mtimeMs >= f.mtimeMs) { iguais++; continue; }
  await sharp(arquivo).resize({ width: LARGURA, withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true }).toFile(destino);
  console.log(`${ampliada ? 'ampliada ' : 'original '} ${nome}`);
  feitas++;
}
console.log(`Galeria: ${feitas} imagem(ns) gerada(s), ${iguais} já em dia, ${fontes.size} no total.`);
