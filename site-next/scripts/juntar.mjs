// Junta o site novo (Next, out/) ao site atual (Astro, ../site-astro/dist/) enquanto os dois convivem.
// Só as rotas da lista ROTAS passam para o Next; o resto continua vindo do Astro.
// Cada etapa que leva uma página nova ao ar acrescenta a rota aqui.
//   node scripts/juntar.mjs                                  usa ROTAS e grava em ../site-astro/dist
//   node scripts/juntar.mjs --rotas design-system --destino <pasta>
//       testa a junção numa cópia do dist/, sem tocar no site de verdade
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rotas já migradas, sem extensão: 'sorteio' vira sorteio.html; 'sorteio/ganhadores' vira sorteio/ganhadores.html.
// Etapa 0: nenhuma. O index.html e o 404.html do Next só entram na Etapa 4.
const ROTAS = [];

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(RAIZ, 'out');
const arg = (nome) => { const i = process.argv.indexOf(nome); return i > 0 ? process.argv[i + 1] : null; };
const rotas = arg('--rotas') ? arg('--rotas').split(',') : ROTAS;
const DESTINO = path.resolve(arg('--destino') || path.join(RAIZ, '..', 'site-astro', 'dist'));

if (!rotas.length) { console.log('juntar: nenhuma rota do Next migrada ainda; o site publicado é só o Astro.'); process.exit(0); }
for (const p of [OUT, DESTINO]) if (!fs.existsSync(p)) { console.error(`juntar: falta ${p} (rode as duas builds antes).`); process.exit(1); }

const copia = (rel) => {
  const de = path.join(OUT, rel);
  if (!fs.existsSync(de)) return false;
  fs.cpSync(de, path.join(DESTINO, rel), { recursive: true, force: true });
  return true;
};

const faltando = [];
for (const r of rotas) {
  if (!copia(`${r}.html`)) { faltando.push(r); continue; }
  copia(`${r}.txt`);
  // dados da navegação do Next (__next.*) da própria rota, sem levar as sub-rotas junto
  const pasta = path.join(OUT, r);
  if (fs.existsSync(pasta)) for (const f of fs.readdirSync(pasta)) if (f.startsWith('__next')) copia(`${r}/${f}`);
}
if (faltando.length) { console.error(`juntar: rota(s) sem página no out/: ${faltando.join(', ')}`); process.exit(1); }

copia('_next');                 // JS, CSS e fontes do Next
copia('assets');                // tudo de public/assets: imagens da marca e licenças das fontes (OFL)
// arquivos soltos na raiz do out/ (icon.png e afins), menos páginas e dados de navegação, que só entram pela lista ROTAS
for (const f of fs.readdirSync(OUT, { withFileTypes: true })) {
  if (f.isFile() && !/\.(html|txt)$/.test(f.name)) copia(f.name);
}
fs.writeFileSync(path.join(DESTINO, '.nojekyll'), '');
console.log(`juntar: ${rotas.length} rota(s) do Next no site publicado: ${rotas.join(', ')}.`);
