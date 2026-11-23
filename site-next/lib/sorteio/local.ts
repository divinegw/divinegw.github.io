// As contas dos sorteios que rodam só no navegador (abas "Lista de contas" e "Números"), sem nada de tela.
// Extraído de site-astro/src/scripts/sorteio.ts (Etapa 2c) SEM MUDAR A LÓGICA: com o mesmo código e a mesma entrada,
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
// Só aparecem aqui como NOVAS (não existem em função no site de hoje; as mensagens vêm das linhas 256-260 e 345-353, 398-400):
//   validarNumeros, validarLista, validarPremios.
import { comPeso, formata, gerador, impressao, inteiro, limpaCodigo, novoCodigo, numeros, type Gerador } from './aleatorio'
import type { Participante } from './contas'

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
