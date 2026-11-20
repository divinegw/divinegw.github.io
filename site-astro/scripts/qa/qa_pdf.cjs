// Conta, por página de cada PDF, quantos blocos de texto (TJ/Tj) e imagens (Do) são desenhados.
// Página com 0 texto e 0 imagem = página em branco.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { PDFDocument, PDFName, PDFArray, PDFRawStream } = require('pdf-lib');
const DIR = process.argv[2];
(async () => {
  for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.pdf'))) {
    const doc = await PDFDocument.load(fs.readFileSync(path.join(DIR, f)), { ignoreEncryption: true });
    const out = [];
    doc.getPages().forEach((p, i) => {
      let c = p.node.get(PDFName.of('Contents'));
      c = c && doc.context.lookup(c);
      const streams = c instanceof PDFArray ? c.asArray().map(r => doc.context.lookup(r)) : [c];
      let txt = 0, img = 0;
      for (const s of streams) {
        if (!(s instanceof PDFRawStream)) continue;
        let data = Buffer.from(s.contents);
        try { data = zlib.inflateSync(data); } catch (e) {}
        const str = data.toString('latin1');
        txt += (str.match(/\bT[Jj]\b/g) || []).length;
        img += (str.match(/\bDo\b/g) || []).length;
      }
      out.push({ n: i + 1, txt, img });
    });
    const blank = out.filter(x => x.txt === 0 && x.img === 0).map(x => x.n);
    const thin = out.filter(x => x.txt > 0 && x.txt < 6 && x.img === 0).map(x => x.n);
    console.log(`${f.padEnd(20)} ${String(out.length).padStart(2)} págs | em branco: ${blank.join(',') || '-'} | quase vazias: ${thin.join(',') || '-'}`);
  }
})();
