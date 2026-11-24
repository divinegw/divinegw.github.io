// As contas dos sorteios que rodam só no navegador (abas "Lista de contas", "Números", "Squads" e "Extras"), sem nada de tela.
// Extraído de site-astro/src/scripts/sorteio.ts (Etapas 2c e 2d) SEM MUDAR A LÓGICA: com o mesmo código e a mesma entrada,
// o resultado é igual ao do site de hoje, e "Conferir um sorteio antigo" continua valendo.
// De onde veio cada função (linhas de site-astro/src/scripts/sorteio.ts):
//   ordinal            linha 19
//   codigoDe           linhas 38-41 (a parte que lê o texto digitado; o campo do formulário ficou de fora)
//   ordenada           linha 115
//   impressaoDe        linha 116
//   sortearLista       linhas 347-363 (vencedores e reservas, bilhetes, ordem de todo mundo)
//   sortearPremios     linhas 393-407 (distribuir prêmios)
//   sortearNumeros     linhas 259-270 (números, com e sem repetição, ordenados ou não)
//   textoParaCopiar    linha 88
//   somaHistorico      linhas 58-61 (o que o histórico grava)
//   quando             linha 15
//   sortearSquads      linhas 411-441 (Squads: grupos por tamanho ou por número, função espalhada ou não)
//   sortearConteudo    linhas 443-458 (O que jogar; o contexto do gerador é `conteudo|<ids marcados, em ordem alfabética>`)
//   sortearDados       linhas 460-472 (Dados; o contexto do gerador é `dados|<lados>`)
//   sortearMoeda       linhas 474-484 (Cara ou coroa; o contexto do gerador é `moeda`)
// Só aparecem aqui como NOVAS (não existem em função no site de hoje; as mensagens vêm das linhas 256-260 e 345-353, 398-400, 414-419, 449-451, 462-463 e 475):
//   validarNumeros, validarLista, validarPremios, validarSquads, validarConteudo, validarDados, validarMoeda.
import { comPeso, formata, gerador, impressao, inteiro, limpaCodigo, novoCodigo, numeros, type Gerador } from './aleatorio'
import type { Participante } from './contas'
import type { GrupoConteudo, ItemConteudo } from './conteudo'

export const ordinal = (i: number) => `${i}º`
export const quando = (d = new Date()) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Código digitado em "Conferir um sorteio antigo" (limpo) ou um novo. */
export function codigoDe(digitado: string) {
  const v = digitado.trim()
  return { codigo: v ? limpaCodigo(v) : novoCodigo(), conferindo: Boolean(v) }
}

export const ordenada = (ps: Participante[]) => [...ps].sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0))
export const impressaoDe = (ps: Participante[], peso = false) => impressao(ordenada(ps).map((p) => (peso ? `${p.chave}*${p.bilhetes}` : p.chave)).join('\n'))

/** O que cada sorteio devolve para a tela mostrar, copiar e guardar no histórico. */
export interface SaidaBase { codigo: string; conferindo: boolean; impressao?: string; discord: string; resumo: string }

// ---------------------------------------------------------------- Lista de contas: vencedores
export interface OpcoesLista { venc: number; res: number; ordem: boolean; peso: boolean }
export interface SaidaLista extends SaidaBase {
  ps: Participante[]
  saiu: Participante[]
  /** "1º", "2º"... para vencedores; "R1", "R2"... para reservas */
  rotulos: string[]
  /** o gerador, já usado: a roleta tira o ponto de parada dele (só visual) */
  g: Gerador
}

export async function sortearLista(participantes: Participante[], o: OpcoesLista, digitado = ''): Promise<SaidaLista> {
  const ps = ordenada(participantes)
  const { venc, res, ordem, peso } = o
  const qtd = ordem ? ps.length : venc + res
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, 'lista')
  const saiu = peso ? comPeso(g, ps, qtd) : g.embaralha(ps).slice(0, qtd)
  const imp = await impressaoDe(ps, peso)
  const rotulo = (i: number) => (ordem ? ordinal(i + 1) : i < venc ? ordinal(i + 1) : `R${i - venc + 1}`)
  const discord = `**Sorteio DIVINE** · ${ps.length} participantes\n${saiu.map((p, i) => `${rotulo(i)} ${p.nome}`).join('\n')}`
  const resumo = ordem ? `Ordem de ${ps.length} pessoas: ${saiu.slice(0, 3).map((p) => p.nome).join(', ')}…` : `${saiu.slice(0, venc).map((p) => p.nome).join(', ')} (de ${ps.length})`
  return { ps, saiu, rotulos: saiu.map((_, i) => rotulo(i)), g, codigo, conferindo, impressao: imp, discord, resumo }
}

// ---------------------------------------------------------------- Lista de contas: prêmios
export interface SaidaPremios extends SaidaBase { ps: Participante[]; premios: string[]; quem: Participante[] }

export async function sortearPremios(participantes: Participante[], premios: string[], repetir: boolean, digitado = ''): Promise<SaidaPremios> {
  const ps = ordenada(participantes)
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, 'premios')
  const ordem = g.embaralha(ps)
  const quem = premios.map((_, i) => (repetir ? ps[g.indice(ps.length)] : ordem[i]))
  const imp = await impressao(`${ordenada(ps).map((p) => p.chave).join('\n')}\n--\n${premios.join('\n')}`)
  const discord = `**Sorteio DIVINE** · prêmios\n${premios.map((p, i) => `${p}: ${quem[i].nome}`).join('\n')}`
  const resumo = premios.slice(0, 3).map((p, i) => `${p}: ${quem[i].nome}`).join(' · ') + (premios.length > 3 ? '…' : '')
  return { ps, premios, quem, codigo, conferindo, impressao: imp, discord, resumo }
}

// ---------------------------------------------------------------- Números
export interface SaidaNumeros extends SaidaBase { saiu: bigint[]; faixa: string; qtd: number; repetir: boolean }

export async function sortearNumeros(min: bigint, max: bigint, qtd: number, repetir: boolean, ordenar: boolean, digitado = ''): Promise<SaidaNumeros> {
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, 'numeros')
  let saiu = numeros(g, min, max, qtd, repetir)
  if (ordenar) saiu = [...saiu].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const faixa = `${formata(min)} a ${formata(max)}`
  const lista = saiu.map(formata).join(', ')
  const discord = `**Sorteio DIVINE** · números de ${faixa}\n${lista}`
  const resumo = qtd === 1 ? `Saiu ${formata(saiu[0])} (de ${faixa})` : `${qtd} números de ${faixa}: ${lista.slice(0, 80)}${lista.length > 80 ? '…' : ''}`
  return { saiu, faixa, qtd, repetir, codigo, conferindo, discord, resumo }
}

// ---------------------------------------------------------------- Squads (sorteio.ts, linhas 411-441)
export interface OpcoesSquads { n: number; porGrupos: boolean; equilibrar: boolean }
export interface SaidaSquads extends SaidaBase { ps: Participante[]; grupos: Participante[][]; qtdGrupos: number }

export async function sortearSquads(participantes: Participante[], o: OpcoesSquads, digitado = ''): Promise<SaidaSquads> {
  const ps = ordenada(participantes)
  const { n, porGrupos, equilibrar } = o
  const qtdGrupos = porGrupos ? n : Math.ceil(ps.length / n)
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, 'squads')
  let fila: Participante[]
  if (equilibrar) {
    // cada função embaralhada à parte; as funções com mais gente são distribuídas primeiro
    const porFuncao = new Map<string, Participante[]>()
    for (const p of ps) { const k = (p.funcao ?? '').toLocaleLowerCase('pt-BR'); porFuncao.set(k, [...(porFuncao.get(k) ?? []), p]) }
    fila = [...porFuncao.entries()].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1)).flatMap(([, v]) => g.embaralha(v))
  } else fila = g.embaralha(ps)
  const grupos: Participante[][] = Array.from({ length: qtdGrupos }, () => [])
  let vez = 0
  for (const p of fila) {
    // vai para o grupo com menos gente; no empate, revezando
    const menor = Math.min(...grupos.map((x) => x.length))
    while (grupos[vez % qtdGrupos].length !== menor) vez++
    grupos[vez % qtdGrupos].push(p)
    vez++
  }
  const imp = await impressao(ordenada(ps).map((p) => `${p.chave}-${p.funcao ?? ''}`).join('\n'))
  const discord = `**Sorteio DIVINE** · ${qtdGrupos} grupos\n${grupos.map((gr, i) => `**Grupo ${i + 1}:** ${gr.map((p) => p.nome + (p.funcao ? ` (${p.funcao})` : '')).join(', ')}`).join('\n')}`
  return { ps, grupos, qtdGrupos, codigo, conferindo, impressao: imp, discord, resumo: `${ps.length} pessoas em ${qtdGrupos} grupos` }
}

// ---------------------------------------------------------------- Extras: O que jogar (sorteio.ts, linhas 443-458)
/** Os itens dos grupos marcados, na ordem dos grupos (essa ordem decide o resultado). */
export const itensDe = (grupos: GrupoConteudo[], ids: string[]): ItemConteudo[] => {
  const escolhidos = new Set(ids)
  return grupos.filter((d) => escolhidos.has(d.id)).flatMap((d) => d.itens)
}
export interface SaidaConteudo extends SaidaBase { saiu: ItemConteudo[] }

export async function sortearConteudo(grupos: GrupoConteudo[], ids: string[], qtd: number, digitado = ''): Promise<SaidaConteudo> {
  const escolhidos = new Set(ids)
  const pool = itensDe(grupos, ids)
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, `conteudo|${[...escolhidos].sort().join(',')}`)
  const saiu = g.embaralha(pool).slice(0, qtd)
  return { saiu, codigo, conferindo, discord: `**Sorteio DIVINE** · o que vamos fazer\n${saiu.map((x, i) => `${ordinal(i + 1)} ${x.t} (${x.onde})`).join('\n')}`, resumo: saiu.map((x) => x.t).join(', ') }
}

// ---------------------------------------------------------------- Extras: Dados e moeda (sorteio.ts, linhas 460-484)
export interface SaidaDados extends SaidaBase { rol: number[]; total: number; nome: string; qtd: number; lados: number; mod: number }

export async function sortearDados(qtd: number, lados: number, mod: number, digitado = ''): Promise<SaidaDados> {
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, `dados|${lados}`)
  const rol = Array.from({ length: qtd }, () => Number(g.entre(1n, BigInt(lados))))
  const total = rol.reduce((s, x) => s + x, 0) + mod
  const nome = `${qtd}d${lados}${mod ? (mod > 0 ? `+${mod}` : mod) : ''}`
  return { rol, total, nome, qtd, lados, mod, codigo, conferindo, discord: `**Sorteio DIVINE** · ${nome}\nTotal: ${total}${qtd > 1 ? ` (${rol.join(', ')})` : ''}`, resumo: `${nome}: ${total}` }
}

export interface SaidaMoeda extends SaidaBase { lados: ('Cara' | 'Coroa')[]; caras: number; qtd: number }

export async function sortearMoeda(qtd: number, digitado = ''): Promise<SaidaMoeda> {
  const { codigo, conferindo } = codigoDe(digitado)
  const g = await gerador(codigo, 'moeda')
  const lados = Array.from({ length: qtd }, () => (g.indice(2) ? 'Coroa' : 'Cara') as 'Cara' | 'Coroa')
  const caras = lados.filter((x) => x === 'Cara').length
  return { lados, caras, qtd, codigo, conferindo, discord: `**Sorteio DIVINE** · cara ou coroa\n${qtd === 1 ? lados[0] : `${caras} cara, ${qtd - caras} coroa`}`, resumo: qtd === 1 ? lados[0] : `${qtd} jogadas: ${caras} cara, ${qtd - caras} coroa` }
}

// ---------------------------------------------------------------- copiar e histórico
/** O texto de "Copiar resultado". `origem` é o endereço do site (location.origin). */
export const textoParaCopiar = (r: Pick<SaidaBase, 'discord' | 'codigo' | 'impressao'>, origem: string) =>
  `${r.discord}\nCódigo: ${r.codigo}${r.impressao ? ` · lista ${r.impressao}` : ''}\nConfira em ${origem}/sorteio.html`

export interface EntradaHistorico { modo: string; resumo: string; codigo: string; impressao?: string; em: string }

/** O histórico novo: este sorteio na frente, no máximo 20. */
export const somaHistorico = (atual: EntradaHistorico[], r: { modo: string; resumo: string; codigo: string; impressao?: string }, agora = new Date()): EntradaHistorico[] =>
  [{ modo: r.modo, resumo: r.resumo, codigo: r.codigo, impressao: r.impressao, em: agora.toISOString() }, ...atual].slice(0, 20)

// ---------------------------------------------------------------- validações (mensagens do site de hoje e do protótipo)
export interface ErroDeCampo<C extends string> { campo: C; texto: string }

export function validarNumeros(minTxt: string, maxTxt: string, qtdTxt: string, repetir: boolean):
  { erro: ErroDeCampo<'min' | 'max' | 'qtd'> } | { erro?: undefined; min: bigint; max: bigint; qtd: number } {
  const min = inteiro(minTxt), max = inteiro(maxTxt)
  const qtd = Number(qtdTxt.trim() || '1')
  if (min === null || max === null) return { erro: { campo: min === null ? 'min' : 'max', texto: 'Use só números inteiros em "De" e "Até" (pode ter sinal de menos, como -10).' } }
  if (max < min) return { erro: { campo: 'max', texto: 'O "De" precisa ser menor que o "Até".' } }
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 10000) return { erro: { campo: 'qtd', texto: 'Em "Quantos números", escolha de 1 a 10.000.' } }
  const tamanho = max - min + 1n
  if (!repetir && BigInt(qtd) > tamanho) {
    return { erro: { campo: 'qtd', texto: `De ${formata(min)} a ${formata(max)} cabem ${formata(tamanho)} números sem repetir. Peça até ${formata(tamanho)}, ou marque que um número pode repetir.` } }
  }
  return { min, max, qtd }
}

export function validarLista(n: number, o: { venc: string; res: string; ordem: boolean }):
  { erro: ErroDeCampo<'lista' | 'vencedores' | 'reservas'> } | { erro?: undefined; venc: number; res: number } {
  if (n === 0) return { erro: { campo: 'lista', texto: 'Coloque pelo menos uma conta na lista.' } }
  if (n < 2) return { erro: { campo: 'lista', texto: 'Coloque pelo menos 2 participantes na lista.' } }
  const venc = Number(o.venc.trim() || '1'), res = Number(o.res.trim() || '0')
  if (!o.ordem && (!Number.isInteger(venc) || venc < 1)) return { erro: { campo: 'vencedores', texto: 'Em "Vencedores", ponha 1 ou mais.' } }
  if (!o.ordem && (!Number.isInteger(res) || res < 0)) return { erro: { campo: 'reservas', texto: 'Em "Reservas", ponha 0 ou mais.' } }
  const qtd = o.ordem ? n : venc + res
  if (qtd > n) {
    return { erro: { campo: 'vencedores', texto: res ? `Há ${n} contas na lista, e você pediu ${venc} ${venc === 1 ? 'vencedor' : 'vencedores'} e ${res} ${res === 1 ? 'reserva' : 'reservas'}. Diminua o número ou ponha mais gente na lista.` : `Há ${n} contas na lista. Escolha até ${n} ${n === 1 ? 'vencedor' : 'vencedores'}.` } }
  }
  return { venc, res }
}

export function validarPremios(premios: string[], n: number, repetir: boolean): { campo: 'premios' | 'lista'; texto: string } | null {
  if (!premios.length) return { campo: 'premios', texto: 'Coloque pelo menos um prêmio na lista.' }
  if (!n) return { campo: 'lista', texto: 'Coloque pelo menos uma conta na lista.' }
  if (!repetir && premios.length > n) {
    return { campo: 'premios', texto: `São ${premios.length} prêmios para ${n} ${n === 1 ? 'pessoa' : 'pessoas'}. Marque que uma pessoa pode levar mais de um, ou tire prêmios.` }
  }
  return null
}

/** `n` = quantas contas válidas há na lista. A ordem das checagens é a do site de hoje (quantidade, lista, grupos demais). */
export function validarSquads(n: number, nTxt: string, porGrupos: boolean):
  { erro: ErroDeCampo<'lista' | 'n'> } | { erro?: undefined; n: number } {
  const q = Number(nTxt.trim() || '5')
  if (!Number.isInteger(q) || q < 1) return { erro: { campo: 'n', texto: `Em "${porGrupos ? 'Grupos' : 'Pessoas por grupo'}", ponha 1 ou mais.` } }
  if (n === 0) return { erro: { campo: 'lista', texto: 'Coloque pelo menos uma conta na lista.' } }
  if (n < 2) return { erro: { campo: 'lista', texto: 'Coloque pelo menos 2 participantes na lista.' } }
  const qtdGrupos = porGrupos ? q : Math.ceil(n / q)
  if (qtdGrupos > n) return { erro: { campo: 'n', texto: `São ${n} pessoas: dá para fazer no máximo ${n} grupos.` } }
  return { n: q }
}

/** `pool` = quantos itens há nos tipos marcados; `nGrupos` = quantos tipos estão marcados. */
export function validarConteudo(pool: number, nGrupos: number, qtdTxt: string):
  { erro: ErroDeCampo<'grupo' | 'qtd'> } | { erro?: undefined; qtd: number } {
  const qtd = Number(qtdTxt.trim() || '1')
  if (!nGrupos || !pool) return { erro: { campo: 'grupo', texto: 'Escolha pelo menos um tipo de conteúdo.' } }
  if (!Number.isInteger(qtd) || qtd < 1) return { erro: { campo: 'qtd', texto: 'Em "Quantos", ponha 1 ou mais.' } }
  if (qtd > pool) return { erro: { campo: 'qtd', texto: `Só tem ${pool} ${pool === 1 ? 'opção' : 'opções'} nos tipos marcados. Peça menos ou marque mais tipos.` } }
  return { qtd }
}

const LADOS_VALIDOS = [4, 6, 8, 10, 12, 20, 100]
export function validarDados(qtdTxt: string, ladosTxt: string, modTxt: string):
  { erro: ErroDeCampo<'qtd' | 'mod'> } | { erro?: undefined; qtd: number; lados: number; mod: number } {
  const qtd = Number(qtdTxt.trim() || '1'), lados = Number(ladosTxt.trim() || '20'), mod = Number(modTxt.trim() || '0')
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 100) return { erro: { campo: 'qtd', texto: 'Em "Quantos dados", escolha de 1 a 100.' } }
  if (!Number.isInteger(mod)) return { erro: { campo: 'mod', texto: 'Em "Somar ao total", use um número inteiro (pode ser negativo).' } }
  if (Math.abs(mod) > 1_000_000) return { erro: { campo: 'mod', texto: 'Em "Somar ao total", use um inteiro de -1.000.000 a 1.000.000.' } }
  if (!LADOS_VALIDOS.includes(lados)) return { erro: { campo: 'qtd', texto: 'Escolha os lados na lista: d4, d6, d8, d10, d12, d20 ou d100.' } }
  return { qtd, lados, mod }
}

export function validarMoeda(qtdTxt: string): { erro: ErroDeCampo<'qtd'> } | { erro?: undefined; qtd: number } {
  const qtd = Number(qtdTxt.trim() || '1')
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 1000) return { erro: { campo: 'qtd', texto: 'Em "Quantas vezes", escolha de 1 a 1.000.' } }
  return { qtd }
}
