// PDFs de aviso (Fase 7, 19/11/2026): o site não oferece mais PDF, mas há links para /pdfs/<guia>.pdf no Discord.
// Para cada guia de dist/guias/ SEM PDF em dist/pdfs/, grava um PDF de uma página dizendo que o guia agora
// fica no site, com o link clicável. Quem abrir um link antigo cai no lugar certo, sem 404 e sem conteúdo velho.
// Não mexe nos PDFs completos: se `npm run pdf` rodou antes (publicar.ps1 -ComPdf), eles ficam.
// Uso (depois de npm run build):  npm run pdf-aviso
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib';

const SITE = 'https://divinegw.github.io';
const DIST = path.resolve('dist');
const PDFS = path.join(DIST, 'pdfs');
fs.mkdirSync(PDFS, { recursive: true });

const guias = fs.readdirSync(path.join(DIST, 'guias')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
let feitos = 0;
for (const g of guias) {
  const destino = path.join(PDFS, `${g}.pdf`);
  if (fs.existsSync(destino)) continue; // PDF completo gerado pelo npm run pdf
  const html = fs.readFileSync(path.join(DIST, 'guias', `${g}.html`), 'utf8');
  const nome = (html.match(/<title>([^<]+?)\s+-\s+/)?.[1] ?? g).replace(/&#39;/g, "'");
  const url = `${SITE}/guias/${g}.html`;

  const doc = await PDFDocument.create();
  doc.setTitle(`${nome} (agora no site)`);
  doc.setSubject('Aviso: o guia agora fica só no site');
  doc.setAuthor('Guilda DIVINE');
  const page = doc.addPage([595.28, 841.89]); // A4
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const marinho = rgb(0.125, 0.196, 0.455), texto = rgb(0.055, 0.082, 0.157), mudo = rgb(0.365, 0.392, 0.463);
  let y = 700;
  page.drawText('GUILDA DIVINE', { x: 64, y, size: 11, font: negrito, color: mudo }); y -= 40;
  page.drawText(nome, { x: 64, y, size: 26, font: negrito, color: texto }); y -= 44;
  for (const linha of ['Este guia não tem mais versão em PDF.', 'Ele agora fica só no site, sempre atualizado:']) {
    page.drawText(linha, { x: 64, y, size: 13, font: normal, color: texto }); y -= 22;
  }
  y -= 10;
  const tam = 14, largura = negrito.widthOfTextAtSize(url, tam);
  page.drawText(url, { x: 64, y, size: tam, font: negrito, color: marinho });
  page.drawLine({ start: { x: 64, y: y - 3 }, end: { x: 64 + largura, y: y - 3 }, thickness: 0.8, color: marinho });
  // área clicável sobre o endereço
  const link = doc.context.register(doc.context.obj({
    Type: 'Annot', Subtype: 'Link', Rect: [64, y - 6, 64 + largura, y + tam], Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  }));
  page.node.set(PDFName.of('Annots'), doc.context.obj([link]));
  y -= 48;
  page.drawText('Para imprimir, abra o guia no navegador e use Ctrl+P: a página sai formatada para A4.', { x: 64, y, size: 10.5, font: normal, color: mudo });

  fs.writeFileSync(destino, await doc.save());
  feitos++;
}
console.log(`PDFs de aviso: ${feitos} gravado(s); ${guias.length - feitos} guia(s) já tinham PDF completo.`);
