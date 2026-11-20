// Índice da busca da página inicial (e da 404), montado na build a partir do texto dos guias.
// Entra o que dá para achar pelo nome e tem âncora: capítulos (##), títulos de card (### / ####),
// Wings, Dungeons, Encontros, bosses e sites (Recurso). O boss e o site levam para a âncora do bloco onde estão.
// Saída: /busca.json (src/pages/busca.json.ts), baixado só quando alguém usa a busca.
import { getCollection } from 'astro:content';
import { slug } from '../rehype-divine.mjs';
import { GUIAS } from '../site';

export interface Resultado { t: string; g: string; c: string; h: string }

// tira a marcação do Markdown de um título: **negrito**, `código`, [texto](url)
const limpa = (s: string) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
const attr = (linha: string, nome: string) => new RegExp(`\\b${nome}="([^"]*)"`).exec(linha)?.[1];

export async function indiceBusca(): Promise<Resultado[]> {
  const guias = await getCollection('guias');
  const ordem = GUIAS.map((g) => g.guia);
  guias.sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));
  const out: Resultado[] = [];
  for (const e of guias) {
    const nome = GUIAS.find((g) => g.guia === e.id)?.nome ?? e.data.title;
    const base = `/guias/${e.id}.html`;
    const rotulos = e.data.sumario as Record<string, string>;
    let cap = 0, capitulo = '', ancora = '', bloco = '', idCard: string | undefined;
    const add = (t: string, h: string, c = capitulo) => { if (t) out.push({ t, g: nome, c, h: `${base}#${h}` }); };
    out.push({ t: e.data.title, g: nome, c: '', h: base }); // o próprio guia (sem #): vem primeiro nos resultados
    let cerca = false;
    for (const linha of (e.body ?? '').split(/\r?\n/)) {
      if (/^```/.test(linha)) { cerca = !cerca; continue; }
      if (cerca) continue;
      let m: RegExpExecArray | null;
      if ((m = /^## (.+)/.exec(linha))) {
        cap++;
        ancora = `secao-${cap}`;
        capitulo = rotulos[ancora] || limpa(m[1]);
        bloco = '';
        add(capitulo, ancora, '');
      } else if ((m = /^#{3,4} (.+)/.exec(linha))) {
        const t = limpa(m[1]);
        ancora = idCard || slug(t);
        idCard = undefined;
        bloco = t;
        add(t, ancora);
      } else if (/^<(Card|CardImagem)\b/.test(linha)) {
        idCard = attr(linha, 'id');
      } else if ((m = /^<(Wing|Dungeon|Encontro)\b/.exec(linha))) {
        const t = attr(linha, 'nome') ?? '';
        ancora = attr(linha, 'id') || slug(t);
        bloco = t;
        add(t, ancora);
      } else if ((m = /^<h2 id="([^"]+)">(.+)<\/h2>/.exec(linha))) {
        // capítulo com id próprio (Recursos Úteis: Recomendados); não entra na conta de secao-N
        ancora = m[1];
        capitulo = limpa(m[2]);
        bloco = '';
        add(capitulo, ancora, '');
      } else if (/^<Recurso\b/.test(linha)) {
        const t = attr(linha, 'nome') ?? '';
        add(t, attr(linha, 'id') || slug(t), capitulo);
      } else if (/^<(Boss)\b/.test(linha)) {
        const t = attr(linha, 'nome') ?? '';
        if (ancora) add(t, ancora, bloco || capitulo);
      }
    }
  }
  // o mesmo nome no mesmo lugar só uma vez
  const vistos = new Set<string>();
  return out.filter((r) => { const k = r.t + r.h; if (vistos.has(k)) return false; vistos.add(k); return true; });
}
