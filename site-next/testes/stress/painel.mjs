// Fotos e conferências do painel do sorteio, com a camada falsa (nada vai para o banco).
// Uso, com o `npm run dev` no ar:  node testes/stress/painel.mjs [url-base] [cenario ...]
// Sem cenários na linha de comando, roda todos, no computador (1280) e no celular (390).
// Usa o playwright-core do site-astro e o Edge (Windows) ou Chrome. As fotos vão para testes/stress/fotos/painel/ (fora do git).
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(aqui, '../../../site-astro/package.json'));
const { chromium } = require('playwright-core');
const BASE = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:3010/sorteio';
const FOTOS = path.join(aqui, 'fotos', 'painel');
fs.mkdirSync(FOTOS, { recursive: true });

const TODOS = ['inscricoes-cheia', 'inscricoes-vazia', 'inscricoes-um', 'inscricoes-2000', 'ultimos-10s', 'encerrado', 'sorteando', 'sorteando-aceite',
  'resultado-1', 'resultado-3', 'voce-ganhou', 'voce-nao-ganhou', 'confirmacao-esperando', 'confirmacao-confirmou', 'confirmacao-tempo-acabou',
  'confirmacao-mista-3', 'confirmacao-mista-3-fim', 'confirmacao-voce', 'confirmacao-voce-10s', 'organizador', 'tirado-volta', 'bloqueado', 'sem-prazo', 'nao-carregou', 'nao-existe', 'sem-internet'];
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('http'));
const CENARIOS = pedidos.length ? pedidos : TODOS;
// cenários em que o tempo corre de verdade (roleta e contagem final); nos outros o relógio fica parado para a foto ser estável
const VIVOS = new Set(['sorteando', 'sorteando-aceite', 'ultimos-10s']);

const b = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true });
const relato = [];
for (const cenario of CENARIOS) {
  for (const papel of ['visitante', 'organizador']) {
    if (papel === 'organizador' && !['inscricoes-cheia', 'inscricoes-vazia', 'encerrado', 'resultado-3', 'confirmacao-mista-3', 'confirmacao-mista-3-fim', 'confirmacao-tempo-acabou', 'sorteando'].includes(cenario)) continue;
    for (const [tela, w, h] of [['computador', 1280, 900], ['celular', 390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'no-preference' });
      const pg = await ctx.newPage();
      const erros = [];
      pg.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
      pg.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 160)); });
      const url = `${BASE}?s=teste&falso=${cenario}&papel=${papel}${VIVOS.has(cenario) ? '' : '&parado=1'}`;
      await pg.goto(url, { waitUntil: 'load' });
      await pg.waitForTimeout(cenario.startsWith('sorteando') ? 2800 : 2200);
      const medida = await pg.evaluate(() => {
        const sobra = document.documentElement.scrollWidth - innerWidth;
        const fora = [...document.querySelectorAll('main *')].filter((el) => {
          const r = el.getBoundingClientRect(); const p = el.closest('section, article, li, a, dialog');
          if (!p || p === el || !r.width) return false; const q = p.getBoundingClientRect();
          return r.right > q.right + 1 || r.left < q.left - 1;
        }).map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${(el.textContent || '').trim().slice(0, 30)}"`);
        const texto = document.querySelector('main')?.innerText || '';
        const pequenos = [...document.querySelectorAll('main button, main a, main input, main summary')].filter((el) => {
          const r = el.getBoundingClientRect(); return r.width && (r.height < 43.5) && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).visibility !== 'hidden' && r.height > 0;
        }).map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().height)}px`);
        return { sobra, fora: [...new Set(fora)].slice(0, 6), nan: /NaN|Invalid Date|undefined|\bnull\b/.test(texto), pequenos: [...new Set(pequenos)].slice(0, 6), h1: document.querySelector('main h1')?.textContent, ouvintes: window.__divineFalso?.ouvintes?.() };
      });
      await pg.screenshot({ path: path.join(FOTOS, `${cenario}-${papel}-${tela}.png`), fullPage: true });
      relato.push({ cenario, papel, tela, ...medida, erros });
      await ctx.close();
    }
  }
}
await b.close();
for (const r of relato) console.log(JSON.stringify(r));
