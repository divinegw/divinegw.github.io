// Conteúdo do jogo para a aba "O que jogar" do sorteio: bosses e wings de raid, Raid Encounters, fractais e dungeons,
// lidos na BUILD dos próprios guias (.mdx). Só roda no servidor (na geração da página): nada disso vai para o navegador.
// Porte de site-astro/src/lib/sorteio/conteudo.ts, com o mesmo leitor linha a linha. A ORDEM dos itens decide o resultado
// do sorteio ("com o mesmo código, o mesmo resultado"): não reordene nada aqui.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ItemConteudo { t: string; onde: string; h: string }
export interface GrupoConteudo { id: string; nome: string; itens: ItemConteudo[] }

// Onde ficam os guias hoje. Na Etapa 5 os guias mudam de lugar e este caminho muda junto.
const PASTA_GUIAS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'site-astro', 'src', 'content', 'guias')

// Cópia exata de `slug` em site-astro/src/rehype-divine.mjs (linha 14); o teste testes/conteudo.test.ts confere que as duas dão o mesmo.
export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const attr = (linha: string, nome: string) => new RegExp(`\\b${nome}="([^"]*)"`).exec(linha)?.[1]

/** Corpo do guia, sem o frontmatter (o `body` do Astro também vem sem ele), em linhas. */
function linhasDoGuia(id: string, pasta: string): string[] {
  const texto = readFileSync(path.join(pasta, `${id}.mdx`), 'utf8')
  return texto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').split(/\r?\n/)
}

export function conteudoSorteio(pasta: string = PASTA_GUIAS): GrupoConteudo[] {
  const g = (id: string) => linhasDoGuia(id, pasta)
  const grupos: GrupoConteudo[] = [
    { id: 'raid-boss', nome: 'Bosses de raid', itens: [] },
    { id: 'raid-wing', nome: 'Raid Wings', itens: [] },
    { id: 'raid-encontro', nome: 'Raid Encounters', itens: [] },
    { id: 'fractal', nome: 'Fractals', itens: [] },
    { id: 'dungeon', nome: 'Dungeons', itens: [] },
  ]
  const [boss, wing, encontro, fractal, dungeon] = grupos.map((x) => x.itens)

  let bloco = '', ancora = ''
  for (const linha of g('raids')) {
    let m: RegExpExecArray | null
    if ((m = /^<(Wing|Encontro)\b/.exec(linha))) {
      const nome = attr(linha, 'nome') ?? ''
      ancora = attr(linha, 'id') || slug(nome)
      bloco = attr(linha, 'sumario') || nome
      ;(m[1] === 'Wing' ? wing : encontro).push({ t: bloco, onde: 'Raids', h: `/guias/raids.html#${ancora}` })
    } else if (/^<Boss\b/.test(linha) && ancora) {
      boss.push({ t: attr(linha, 'nome') ?? '', onde: bloco, h: `/guias/raids.html#${ancora}` })
    }
  }
  for (const linha of g('fractals')) {
    if (/^<Wing\b/.test(linha)) {
      const nome = attr(linha, 'nome') ?? ''
      fractal.push({ t: nome, onde: 'Fractals', h: `/guias/fractals.html#${attr(linha, 'id') || slug(nome)}` })
    }
  }
  for (const linha of g('dungeons')) {
    if (/^<Dungeon\b/.test(linha)) {
      const nome = attr(linha, 'sumario') || attr(linha, 'nome') || ''
      dungeon.push({ t: nome, onde: 'Dungeons', h: `/guias/dungeons.html#${attr(linha, 'id') || slug(attr(linha, 'nome') ?? '')}` })
    }
  }
  // Estes quatro grupos não podem vir vazios: se vierem, o formato dos guias mudou e a build avisa em vez de publicar a aba pela metade.
  for (const [id, x] of [['raids', boss], ['raids', wing], ['fractals', fractal], ['dungeons', dungeon]] as const) {
    if (!x.length) {
      const nome = grupos.find((gr) => gr.itens === x)?.nome
      throw new Error(`Sorteio, "O que jogar": nenhum item de "${nome}" foi achado em ${id}.mdx. Confira se o formato dos guias mudou.`)
    }
  }
  return grupos.filter((x) => x.itens.length)
}
