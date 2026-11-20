// Gera dist/pdfs/<guia>.pdf a partir do site já construído (rode `npm run build` antes).
// Serve a pasta dist/ num servidor local mínimo, abre cada guia no tema claro e imprime em A4.
// Navegador: Edge no Windows, Chrome no Linux e no macOS. Para forçar outro: PDF_CHANNEL=chrome (ou msedge).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const DIST = path.resolve('dist');
const GUIAS = fs.readdirSync(path.join(DIST, 'guias')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: process.env.PDF_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome') });
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 }); // 2x: o srcset escolhe as imagens maiores (nitidez na impressão)
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('divine-tema', 'light'));
  // O Chromium embute WebP no PDF sem compressão (FlateDecode), o que multiplica o tamanho.
  // Para o PDF, entrega as imagens como JPEG (fotos, até 1300px) ou PNG (com transparência).
  await page.route('**/*.webp', async (route) => {
    const buf = Buffer.from(await (await route.fetch()).body());
    const img = sharp(buf);
    const { hasAlpha } = await img.metadata();
    const body = hasAlpha
      ? await img.png().toBuffer()
      : await img.resize({ width: 1300, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    await route.fulfill({ body, contentType: hasAlpha ? 'image/png' : 'image/jpeg' });
  });
  fs.mkdirSync(path.join(DIST, 'pdfs'), { recursive: true });
  for (const g of GUIAS) {
    await page.goto(`${URL_BASE}/guias/${g}.html`, { waitUntil: 'networkidle' });
    // imagens com loading="lazy" não carregam fora da tela: força todas antes de imprimir
    await page.evaluate(async () => {
      const imgs = [...document.images].filter((i) => i.checkVisibility());
      imgs.forEach((i) => (i.loading = 'eager'));
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      await document.fonts.ready;
    });
    const out = path.join(DIST, 'pdfs', `${g}.pdf`);
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(`ok ${path.relative(process.cwd(), out)}`);
  }
} finally {
  await browser.close();
  server.close();
}
