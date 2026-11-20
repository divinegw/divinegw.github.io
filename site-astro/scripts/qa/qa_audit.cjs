// QA medido do Manual DIVINE (Playwright + Edge já instalado).
// Para cada página: claro/escuro x desktop/celular -> contraste WCAG de cada texto,
// rolagem horizontal, alvos de toque, títulos, landmarks, tamanhos dos banners, erros.
// Uso: node qa_audit.js <pasta do site> [pasta de saída]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const SITE = process.argv[2];
const OUT = process.argv[3] || path.join(require('os').tmpdir(), 'divine-qa');
fs.mkdirSync(OUT, { recursive: true });
const pages = ['index.html', 'novidades.html', 'galeria.html', 'sorteio.html', 'sorteio/ganhadores.html', 'creditos.html', 'guias/raids.html', 'guias/fractals.html', 'guias/dungeons.html', 'guias/endgame.html', 'guias/recursos-uteis.html', 'guias/cursores.html', 'design-system.html'];
const configs = [
  { name: 'desktop-claro', vp: { width: 1280, height: 900 }, scheme: 'light' },
  { name: 'desktop-escuro', vp: { width: 1280, height: 900 }, scheme: 'dark' },
  { name: 'celular-claro', vp: { width: 390, height: 844 }, scheme: 'light', mobile: true },
  { name: 'celular-escuro', vp: { width: 390, height: 844 }, scheme: 'dark', mobile: true },
];

(async () => {
  const browser = await chromium.launch({ channel: process.env.PDF_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
  const summary = [];
  for (const p of pages) {
    for (const c of configs) {
      const ctx = await browser.newContext({ viewport: c.vp, colorScheme: c.scheme, isMobile: !!c.mobile, hasTouch: !!c.mobile });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(String(e)));
      page.on('requestfailed', r => errors.push('falhou: ' + r.url()));
      await page.goto(SITE + '/' + p, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(400);
      const d = await page.evaluate((mobile) => {
        // rgb()/rgba() e color(srgb r g b / a), que é como o navegador devolve as cores feitas com color-mix (tokens.css)
        const parse = c => {
          const s = c && c.match(/color\(srgb ([^)]+)\)/);
          if (s) { const [rgb, a] = s[1].split('/'); const v = rgb.trim().split(/\s+/).map(x => parseFloat(x) * 255); return { r: v[0], g: v[1], b: v[2], a: a ? parseFloat(a) : 1 }; }
          const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 }; };
        const lum = ({ r, g, b }) => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };
        const bgOf = el => {
          for (let e = el; e; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.backgroundImage.includes('gradient')) {
              // cores quase transparentes do degradê (sombras de rolagem, véus) não contam como fundo, como no fundo liso
              const cols = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)|color\(srgb [^)]+\)/g)].map(x => parse(x[0])).filter(c => c && c.a > 0.5);
              if (cols.length) return cols.reduce((a, b) => lum(a) > lum(b) ? a : b);
            }
            const c = parse(cs.backgroundColor); if (c && c.a > 0.5) return c;
          }
          return parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255 };
        };
        const fails = {};
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const seen = new Set();
        while (w.nextNode()) {
          const el = w.currentNode.parentElement; if (!w.currentNode.textContent.trim() || !el || seen.has(el)) continue; seen.add(el);
          if (el.closest('svg') || el.closest('.sr-only')) continue; // .sr-only: texto só para leitor de tela, não aparece
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getBoundingClientRect().width) continue;
          const fg = parse(cs.color); if (!fg) continue;
          const op = parseFloat(cs.opacity); const bg = bgOf(el);
          const eff = op < 1 ? { r: fg.r * op + bg.r * (1 - op), g: fg.g * op + bg.g * (1 - op), b: fg.b * op + bg.b * (1 - op) } : fg;
          const cr = ratio(eff, bg); const px = parseFloat(cs.fontSize); const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700);
          if (cr < (large ? 3 : 4.5)) { const k = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]; fails[k] = fails[k] || { r: +cr.toFixed(2), t: w.currentNode.textContent.trim().slice(0, 30) }; }
        }
        const banners = {};
        for (const sel of ['.hero-bg', '.hero-img.banner', '.wing-img', '.dungeon-img', '.encontro-arte', '.banner-img','.guide:not(.featured-guide) .art']) {
          const sizes = [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return (r.width / r.height).toFixed(2); });
          if (sizes.length) banners[sel] = [...new Set(sizes)];
        }
        const small = mobile ? [...document.querySelectorAll('a,button')].filter(a => { const r = a.getBoundingClientRect(); if (!r.width) return false;
          const inline = getComputedStyle(a).display === 'inline' && a.closest('p,li'); return !inline && (r.height < 24 || r.width < 24); }).length : 0;
        const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1]); let skips = 0; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skips++;
        return { fails, banners, small, skips, overflow: document.documentElement.scrollWidth - innerWidth,
          landmarks: ['header', 'main', 'nav', 'footer'].filter(t => document.querySelector(t)),
          broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src.split('/').pop()),
          theme: getComputedStyle(document.body).backgroundColor };
      }, !!c.mobile);
      await page.screenshot({ path: path.join(OUT, `${p.replace(/[\/.]/g, '_')}__${c.name}.png`) });
      summary.push({ page: p, cfg: c.name, ...d, errors });
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify(summary, null, 2));
  for (const s of summary) {
    const f = Object.entries(s.fails).map(([k, v]) => `${k} ${v.r}:1 "${v.t}"`);
    const ban = Object.entries(s.banners).map(([k, v]) => `${k}=${v.join('/')}`).join(' ');
    console.log(`${s.page.padEnd(26)} ${s.cfg.padEnd(15)} contraste:${f.length ? ' ' + f.join(' | ') : ' ok'} | overflow ${s.overflow} | alvos<24 ${s.small} | saltos ${s.skips} | quebradas ${s.broken.length} | erros ${s.errors.length} | landmarks ${s.landmarks.join(',')} | banners ${ban || '-'}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
