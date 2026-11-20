// Ajusta o HTML dos guias (Markdown/MDX) para o formato do Codex DIVINE.
//  - "## Título"  -> <h2 class="section" id="secao-N" data-num="0N">  (capítulo numerado)
//  - parágrafo logo depois do "##" -> class="section-sub"
//  - cada capítulo fica num <div class="page page-break"> (quebra de página no PDF);
//    com "quebra: false" no frontmatter, só o primeiro bloco quebra página
//  - "### Título" e "#### Título" -> id sem acentos ("Introdução às Fractals" -> introducao-as-fractals)
//  - links externos abrem em nova aba
//  - imagens ganham class="hero-img"; ![alt](arquivo "banner") vira banner 2:1, "natural" fica no tamanho original
//  - imagem sozinha num parágrafo sai do <p>
//  - monta o sumário "Neste guia" (frontmatter.toc) a partir dos capítulos, cards, wings e dungeons
//  - põe cada "##" num <div class="titulo-secao"> e o "###" de cada Card num <div class="titulo-card">
//    (lugar do botão "copiar link da seção", que o CopiarLink.astro coloca)
const textOf = (n) => (n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''));
export const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isEl = (n, tag) => n && n.type === 'element' && (!tag || n.tagName === tag);
const isJsx = (n, name) => n && n.type === 'mdxJsxFlowElement' && (!name || n.name === name);
const isBlank = (n) => n.type === 'text' && !n.value.trim();
const addClass = (p, ...c) => { p.className = [...new Set([...(p.className || []), ...c])]; };
const jsxAttr = (n, name) => {
  const a = n.attributes?.find((x) => x.type === 'mdxJsxAttribute' && x.name === name);
  return a ? (a.value ?? true) : undefined;
};
const setJsxAttr = (n, name, value) => {
  const a = n.attributes.find((x) => x.type === 'mdxJsxAttribute' && x.name === name);
  if (a) a.value = value;
  else n.attributes.push({ type: 'mdxJsxAttribute', name, value });
};
const findEl = (n, tag) => {
  for (const c of n.children || []) {
    if (isEl(c, tag)) return c;
    const r = findEl(c, tag);
    if (r) return r;
  }
  return null;
};

export default function rehypeDivine() {
  return (tree, file) => {
    const fm = (file.data.astro ||= {}).frontmatter ||= {};
    const rotulos = fm.sumario || {}; // id -> texto no sumário, quando difere do título
    let cap = 0; // número que aparece (01, 02...): conta todos os capítulos
    let secao = 0; // id secao-N: conta só os "##" do Markdown, para os links antigos (Discord) não mudarem
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((c) => {
        // <h2 id="recomendados">…</h2> escrito no MDX: capítulo com id próprio (não entra na conta de secao-N)
        if (node === tree && isJsx(c, 'h2') && jsxAttr(c, 'id')) {
          return { type: 'element', tagName: 'h2', properties: { id: String(jsxAttr(c, 'id')), dataFixo: '1' }, children: c.children };
        }
        // <p><img></p> -> <img>
        if (isEl(c, 'p')) {
          const kids = c.children.filter((k) => !isBlank(k));
          if (kids.length === 1 && isEl(kids[0], 'img')) return kids[0];
        }
        return c;
      });
      for (const c of node.children) {
        if (c.type === 'element') {
          const p = (c.properties ||= {});
          if (c.tagName === 'h2') {
            cap++;
            if (p.dataFixo) delete p.dataFixo;
            else p.id = `secao-${++secao}`;
            p.dataNum = String(cap).padStart(2, '0');
            addClass(p, 'section');
          } else if ((c.tagName === 'h3' || c.tagName === 'h4') && !p.id) {
            p.id = slug(textOf(c));
          } else if (c.tagName === 'a' && /^https?:\/\//.test(String(p.href || ''))) {
            p.target = '_blank';
            p.rel = ['noopener'];
          } else if (c.tagName === 'img') {
            // string, não lista: o MDX junta listas com vírgula ao passar para o <Image> do Astro
            // "banner" | "natural" | "natural 520" (largura máxima em px)
            const m = /^(banner|natural)(?:\s+(\d+))?$/.exec(String(p.title || ''));
            const tipo = m ? ` ${m[1]}` : '';
            if (m?.[2]) p.width = +m[2];
            delete p.title;
            p.className = 'hero-img' + tipo;
            // coluna de conteúdo tem no máximo 760px
            p.sizes = m?.[2] ? `(min-width: ${+m[2] + 40}px) ${m[2]}px, 100vw` : '(min-width: 800px) 760px, 100vw';
          }
        }
        walk(c);
      }
    };
    walk(tree);

    // sumário: capítulos (##) com seus itens (cards, wings, dungeons, #### listados em "sumario")
    const toc = [];
    const push = (id, text) => {
      const item = { id, text, subs: [] };
      if (toc.length) toc.at(-1).subs.push(item);
      else toc.push(item);
    };
    const scan = (node) => {
      for (const c of node.children || []) {
        if (isEl(c, 'h2') && node === tree) {
          toc.push({ id: c.properties.id, text: rotulos[c.properties.id] || textOf(c), subs: [] });
          continue;
        }
        if (isEl(c, 'h4') && rotulos[c.properties.id]) push(c.properties.id, rotulos[c.properties.id]);
        if (isJsx(c, 'Card') || isJsx(c, 'CardImagem')) {
          const h3 = findEl(c, 'h3');
          if (h3) {
            const id = jsxAttr(c, 'id');
            if (id) h3.properties.id = id;
            if (!jsxAttr(c, 'semSumario')) push(h3.properties.id, jsxAttr(c, 'sumario') || textOf(h3));
          }
        } else if (isJsx(c, 'Recurso') || isJsx(c, 'Favoritos')) {
          // site (Recursos Úteis) e grupo de recomendados: entram no sumário pelo nome (ou título do grupo)
          const nome = String(jsxAttr(c, 'nome') ?? jsxAttr(c, 'titulo') ?? '');
          const id = jsxAttr(c, 'id') || slug(nome);
          setJsxAttr(c, 'id', id);
          push(id, nome);
        } else if (isJsx(c, 'Wing') || isJsx(c, 'Dungeon') || isJsx(c, 'Encontro')) {
          const id = jsxAttr(c, 'id') || slug(String(jsxAttr(c, 'nome')));
          setJsxAttr(c, 'id', id);
          push(id, jsxAttr(c, 'sumario') || jsxAttr(c, 'nome'));
        } else if (c.type === 'mdxJsxFlowElement' && jsxAttr(c, 'sumario') && jsxAttr(c, 'id')) {
          push(jsxAttr(c, 'id'), jsxAttr(c, 'sumario'));
        }
        scan(c);
      }
    };
    scan(tree);
    fm.toc = toc;

    // capítulos: <div class="page page-break"> do "##" até o próximo "##"
    const out = [];
    let page = null;
    for (const c of tree.children) {
      if (isEl(c, 'h2')) {
        page = { type: 'element', tagName: 'div', properties: { className: fm.quebra === false ? ['page'] : ['page', 'page-break'] }, children: [] };
        out.push(page);
      } else if (!page && !isBlank(c)) {
        // conteúdo antes do primeiro "##" vira a primeira página
        page = { type: 'element', tagName: 'div', properties: { className: ['page', 'page-break'] }, children: [] };
        out.push(page);
      }
      (page ? page.children : out).push(c);
    }
    for (const pg of out.filter((n) => isEl(n, 'div') && n.properties.className?.includes('page'))) {
      if (!isEl(pg.children[0], 'h2')) continue;
      const sub = pg.children.slice(1).find((n) => !isBlank(n));
      if (isEl(sub, 'p')) addClass((sub.properties ||= {}), 'section-sub');
    }
    tree.children = out;

    // títulos com lugar para o botão "copiar link" (CopiarLink.astro põe o botão):
    // o botão fica ao lado do título, não dentro, para o nome do título continuar limpo no leitor de tela
    const caixa = (classe, h) => ({ type: 'element', tagName: 'div', properties: { className: [classe] }, children: [h] });
    for (const pg of out) {
      if (isEl(pg, 'div') && isEl(pg.children[0], 'h2')) pg.children[0] = caixa('titulo-secao', pg.children[0]);
    }
    const cards = (node) => {
      for (const c of node.children || []) {
        if (isJsx(c, 'Card') || isJsx(c, 'CardImagem')) {
          const i = c.children.findIndex((k) => isEl(k, 'h3'));
          if (i >= 0) c.children[i] = caixa('titulo-card', c.children[i]);
        }
        cards(c);
      }
    };
    cards(tree);
  };
}
