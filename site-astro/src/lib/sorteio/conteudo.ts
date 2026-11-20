// Conteúdo do jogo para a aba "O que jogar" do sorteador, lido na build dos próprios guias:
// bosses e wings de raid, Raid Encounters, fractais e dungeons. Cada item leva o link para o bloco no guia
// (mesma âncora que a busca usa).
import { getCollection } from 'astro:content';
import { slug } from '../../rehype-divine.mjs';

export interface ItemConteudo { t: string; onde: string; h: string }
export interface GrupoConteudo { id: string; nome: string; itens: ItemConteudo[] }

const attr = (linha: string, nome: string) => new RegExp(`\\b${nome}="([^"]*)"`).exec(linha)?.[1];

export async function conteudoSorteio(): Promise<GrupoConteudo[]> {
  const guias = await getCollection('guias');
  const g = (id: string) => guias.find((e) => e.id === id)?.body?.split(/\r?\n/) ?? [];
  const grupos: GrupoConteudo[] = [
    { id: 'raid-boss', nome: 'Bosses de raid', itens: [] },
    { id: 'raid-wing', nome: 'Raid Wings', itens: [] },
    { id: 'raid-encontro', nome: 'Raid Encounters', itens: [] },
    { id: 'fractal', nome: 'Fractals', itens: [] },
    { id: 'dungeon', nome: 'Dungeons', itens: [] },
  ];
  const [boss, wing, encontro, fractal, dungeon] = grupos.map((x) => x.itens);

  let bloco = '', ancora = '';
  for (const linha of g('raids')) {
    let m: RegExpExecArray | null;
    if ((m = /^<(Wing|Encontro)\b/.exec(linha))) {
      const nome = attr(linha, 'nome') ?? '';
      ancora = attr(linha, 'id') || slug(nome);
      bloco = attr(linha, 'sumario') || nome;
      (m[1] === 'Wing' ? wing : encontro).push({ t: bloco, onde: 'Raids', h: `/guias/raids.html#${ancora}` });
    } else if (/^<Boss\b/.test(linha) && ancora) {
      boss.push({ t: attr(linha, 'nome') ?? '', onde: bloco, h: `/guias/raids.html#${ancora}` });
    }
  }
  for (const linha of g('fractals')) {
    if (/^<Wing\b/.test(linha)) {
      const nome = attr(linha, 'nome') ?? '';
      fractal.push({ t: nome, onde: 'Fractals', h: `/guias/fractals.html#${attr(linha, 'id') || slug(nome)}` });
    }
  }
  for (const linha of g('dungeons')) {
    if (/^<Dungeon\b/.test(linha)) {
      const nome = attr(linha, 'sumario') || attr(linha, 'nome') || '';
      dungeon.push({ t: nome, onde: 'Dungeons', h: `/guias/dungeons.html#${attr(linha, 'id') || slug(attr(linha, 'nome') ?? '')}` });
    }
  }
  return grupos.filter((x) => x.itens.length);
}
