// Testes automáticos do site gerado (dist/): sobe um servidor local e roda
//   qa_audit.cjs  contraste, rolagem horizontal, alvos de toque, títulos, imagens, erros, banners (6 páginas × 4 combinações)
//   qa_toc.cjs    clique em cada item do "Neste guia", fim da página e volta ao topo
//   qa_pdf.cjs    páginas em branco nos PDFs (precisa de npm run pdf antes)
// Uso: npm run build && npm run pdf && npm run qa
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', '..', 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const srv = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}`;

let falhou = false;
const roda = (script, arg) => new Promise((ok) => {
  console.log(`\n== ${script}`);
  spawn(process.execPath, [path.join(HERE, script), arg], { stdio: 'inherit' }).on('exit', (code) => { if (code) falhou = true; ok(); });
});
await roda('qa_audit.cjs', url);
await roda('qa_toc.cjs', url);
// os PDFs de aviso (npm run pdf-aviso) têm uma página só e poucos KB: não há o que testar neles
const pastaPdf = path.join(DIST, 'pdfs');
const completos = fs.existsSync(pastaPdf) && fs.readdirSync(pastaPdf).some((f) => fs.statSync(path.join(pastaPdf, f)).size > 50_000);
if (completos) await roda('qa_pdf.cjs', pastaPdf);
else console.log('\n(sem PDFs completos em dist/pdfs: os guias só têm PDF com npm run pdf, sob demanda)');

// Impressão A4 das páginas sem PDF publicado (início, 404, vitrine): imprime numa pasta temporária
// (fora do dist/, para não publicar) e passa o mesmo qa_pdf.cjs (páginas em branco ou quase vazias).
{
  const { chromium } = await import('playwright-core');
  const os = await import('node:os');
  const pasta = path.join(os.tmpdir(), 'divine-qa', 'impressao');
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.PDF_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome') });
  const page = await browser.newPage();
  await page.emulateMedia({ colorScheme: 'light' });
  for (const [nome, rota] of [['inicio', '/'], ['404', '/404.html'], ['novidades', '/novidades.html'], ['galeria', '/galeria.html'],['creditos', '/creditos.html'], ['design-system', '/design-system.html']]) {
    await page.goto(url + rota, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const imgs = [...document.images].filter((i) => i.checkVisibility());
      imgs.forEach((i) => (i.loading = 'eager'));
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      await document.fonts.ready;
    });
    await page.pdf({ path: path.join(pasta, `${nome}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
  }
  await browser.close();
  console.log(`\n(impressão das páginas sem PDF em ${pasta})`);
  await roda('qa_pdf.cjs', pasta);
}
srv.close();
process.exit(falhou ? 1 : 0);
