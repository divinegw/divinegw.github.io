// Stress do bloco "Abertos agora": responde às chamadas REST do Firestore com os fixtures de abertos.mjs
// (nada é gravado no banco) e tira fotos no computador (1280) e no celular (390).
// Uso, com o dev server no ar:  node testes/stress/rodar.mjs [url] [pasta-das-fotos]
// Usa o playwright-core do site-astro e o Edge (Windows) ou Chrome.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { AGORA, PIOR, UM, VAZIO, MUITOS, INSCRITOS } from './abertos.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(aqui, '../../../site-astro/package.json'));
const { chromium } = require('playwright-core');
const URL = process.argv[2] || 'http://localhost:3010/sorteio';
const FOTOS = process.argv[3] || path.join(aqui, 'fotos');
fs.mkdirSync(FOTOS, { recursive: true });

const CASOS = { pior: PIOR, um: UM, vazio: VAZIO, muitos: MUITOS, lento: UM, falha: null };
const b = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true });
const relato = [];
for (const [nome, docs] of Object.entries(CASOS)) {
  for (const [tela, w, h] of [['computador', 1280, 900], ['celular', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const pg = await ctx.newPage();
    await pg.clock.install({ time: AGORA });
    const erros = [];
    pg.on('pageerror', (e) => erros.push(e.message));
    pg.on('dialog', (d) => { erros.push('DIÁLOGO ABRIU: ' + d.message()); d.dismiss(); });
    let k = 0;
    await pg.route('https://firestore.googleapis.com/**', async (r) => {
      if (nome === 'falha') return r.fulfill({ status: 500, body: '{}' });
      if (nome === 'lento') await new Promise((ok) => setTimeout(ok, 3000));
      if (r.request().url().includes(':runAggregationQuery')) {
        return r.fulfill({ json: [{ result: { aggregateFields: { n: { integerValue: String(INSCRITOS[k++ % INSCRITOS.length]) } } } }] });
      }
      return r.fulfill({ json: docs });
    });
    await pg.goto(URL, { waitUntil: 'load' });
    if (nome === 'lento') await pg.screenshot({ path: path.join(FOTOS, `${nome}-${tela}-carregando.png`), fullPage: true });
    await pg.clock.runFor(4000);
    await pg.waitForTimeout(800);
    const medida = await pg.evaluate(() => {
      const sobra = document.documentElement.scrollWidth - innerWidth;
      const fora = [...document.querySelectorAll('main *')].filter((el) => {
        const r = el.getBoundingClientRect(); const p = el.closest('section, article, li, a');
        if (!p || p === el || !r.width) return false; const q = p.getBoundingClientRect();
        return r.right > q.right + 1 || r.left < q.left - 1;
      }).map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${(el.textContent || '').trim().slice(0, 30)}"`);
      const texto = document.querySelector('main')?.innerText || '';
      return { sobra, fora: [...new Set(fora)].slice(0, 8), nan: /NaN|Invalid Date|undefined|null/.test(texto), script: !!document.querySelector('main script'), imgs: [...document.querySelectorAll('main img')].map((i) => i.src).filter((s) => !s.startsWith(location.origin) && !s.includes('render.guildwars2.com')) };
    });
    await pg.screenshot({ path: path.join(FOTOS, `${nome}-${tela}.png`), fullPage: true });
    relato.push({ caso: nome, tela, ...medida, erros });
    await ctx.close();
  }
}
await b.close();
for (const r of relato) console.log(JSON.stringify(r));
