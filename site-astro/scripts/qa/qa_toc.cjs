// Testa o sumário lateral: clica em cada link de cada guia e confere se o item marcado é o clicado
// e se a seção de destino chegou à tela. Também testa a rolagem manual até o fim da página.
const { chromium } = require('playwright-core');
const path = require('path');
const SITE = process.argv[2];
const guias = ['raids', 'fractals', 'dungeons', 'endgame', 'recursos-uteis', 'cursores'];
(async () => {
  const b = await chromium.launch({ channel: process.env.PDF_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome'), headless: true });
  let falhas = 0;
  for (const g of guias) {
    // Rolagem suave ligada (como o visitante vê): o título tem de parar logo abaixo do cabeçalho fixo,
    // na distância do scroll-margin-top, e não só "em algum ponto da tela".
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    // "Parou" = 250 ms na mesma posição COM a página desenhando quadros. Logo depois do load, o navegador sem tela
    // ainda pinta as artes e não desenha quadro nenhum: a rolagem congela no meio e parecia ter parado (23/11/2026,
    // falha no 1º link de Raids, Fractals e Cursores). Teto de 10 s para não travar o teste.
    const parado = () => pg.evaluate(() => new Promise((ok) => {
      let y = scrollY, n = 0, quadros = 0, vivo = true;
      const conta = () => { quadros++; if (vivo) requestAnimationFrame(conta); };
      requestAnimationFrame(conta);
      const fim = () => { vivo = false; clearInterval(t); ok(); };
      const t = setInterval(() => {
        if (scrollY !== y) { y = scrollY; n = 0; quadros = 0; return; }
        if (++n > 4 && quadros >= 5) fim();
      }, 50);
      setTimeout(fim, 10000);
    }));
    const onde = (h) => pg.evaluate((h) => {
      const t = document.getElementById(decodeURIComponent(h.slice(1)));
      const act = document.querySelector('.sidebar .toc a.is-active');
      return { ativo: act && act.getAttribute('href'), top: Math.round(t.getBoundingClientRect().top), alvo: parseFloat(getComputedStyle(t).scrollMarginTop) || 0,
        fim: innerHeight + scrollY >= document.documentElement.scrollHeight - 2 };
    }, h);
    // no fim da página não dá para rolar mais: aí basta o título estar abaixo do cabeçalho e na tela
    const fora = (r) => r.fim ? !(r.top >= r.alvo - 12 && r.top < 900) : Math.abs(r.top - r.alvo) > 12;
    await pg.goto(SITE + '/guias/' + g + '.html', { waitUntil: 'load' });
    const hrefs = await pg.$$eval('.sidebar .toc a[href^="#"]', as => as.map(a => a.getAttribute('href')));
    const erros = [];
    for (const href of hrefs) {
      await pg.click(`.sidebar .toc a[href="${href}"]`);
      await parado();
      const r = await onde(href);
      if (r.ativo !== href || fora(r)) erros.push(`${href} -> marcado ${r.ativo}${fora(r) ? ` (parou em ${r.top}px, devia ser ~${r.alvo}px)` : ''}`);
    }
    // página recém-aberta, sem nada medido ainda: o salto mais longo (último item) também tem de acertar
    if (hrefs.length) {
      const ult = hrefs[hrefs.length - 1];
      await pg.goto(SITE + '/guias/' + g + '.html', { waitUntil: 'load' });
      await pg.click(`.sidebar .toc a[href="${ult}"]`);
      await parado();
      const r = await onde(ult);
      if (fora(r)) erros.push(`${ult} (página nova) -> parou em ${r.top}px, devia ser ~${r.alvo}px`);
    }
    // rolagem manual até o fim: deve marcar a última seção visível, sem travar no clique anterior.
    // O mouse vai para o conteúdo antes: em cima do sumário (que tem rolagem própria quando é longo),
    // a roda rolaria só o sumário.
    await pg.mouse.move(900, 450);
    await pg.mouse.wheel(0, 200000); await pg.waitForTimeout(300);
    const fim = await pg.evaluate(() => (document.querySelector('.sidebar .toc a.is-active') || {}).textContent);
    // rolagem manual de volta ao topo: deve marcar o primeiro item
    await pg.mouse.wheel(0, -400000); await pg.waitForTimeout(300);
    const topo = await pg.evaluate(() => (document.querySelector('.sidebar .toc a.is-active') || {}).getAttribute?.('href'));
    falhas += erros.length;
    console.log(`${g.padEnd(15)} ${hrefs.length} links | falhas no clique: ${erros.length}${erros.length ? ' -> ' + erros.join('; ') : ''} | fim da página marca: "${(fim || '').trim()}" | topo marca: ${topo}`);
    await ctx.close();
  }
  await b.close();
  process.exit(falhas ? 1 : 0);
})();
