// Casos de referência do sorteio. A mesma lista roda no site atual (para gravar) e no site novo (para conferir).
import type * as Aleatorio from '@/lib/sorteio/aleatorio';
import type * as AoVivo from '@/lib/sorteio/ao-vivo';
import type * as Contas from '@/lib/sorteio/contas';

export interface Lib { aleatorio: typeof Aleatorio; aoVivo: typeof AoVivo; contas: typeof Contas }

/** bigint vira string, para caber no JSON. */
export const paraJson = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

const CODIGOS = ['K7PX-3QMA-9RTD', 'ABCD-EFGH-JKMN', 'divine guild', 'sorteio de teste 1', 'ZZZZ-2222-9999'];
const FAIXAS: [bigint, bigint, number][] = [[1n, 10n, 5], [1n, 1000n, 10], [1n, 10n ** 12n, 6], [-50n, 50n, 8]];

const ESPECIAIS = ['Christopher Alexander Montgome.5678', 'Benachrichtigungseinstellungen.1234', '🦊 Fox.4242', '王秀英.8888'];
const NOMES = ['Joana', 'Ágata Lima', 'Zé Pedro', 'Marcos', 'Ana Clara', 'Léo', 'Bruna', 'Caio', 'Dani', 'Edu', 'Fabi', 'Gui', 'Hugo', 'Iris', 'Jão', 'Kátia', 'Lia', 'Mel', 'Nando', 'Otto', 'Paulo', 'Quézia', 'Rafa', 'Sol', 'Tiago', 'Uriel', 'Vivi', 'Wagner', 'Xande', 'Yara', 'Zeca', 'ÁLVARO', 'Íris Maria', 'Ônix', 'ÚRSULA', 'Bia'];
export const INSCRITOS = [...ESPECIAIS, ...NOMES.slice(0, 36).map((n, i) => `${n}.${String(1000 + i * 37).padStart(4, '0')}`)];

const LISTAS: Record<string, string> = {
  simples: 'Joana.1234\nMarcos.5678\nAna Clara.4321',
  repetidas: 'Joana.1234\njoana.1234\nJOANA.1234\nMarcos.5678',
  invalidas: 'Joana.1234\nsem numero\nMarcos.56\n.1234\nNome Muito Muito Muito Muito Longo.1234\nOk.9999',
  separadores: 'a, b; c\nd,e',
  pesoX3: 'Joana.1234 x3\nMarcos.5678 *2\nAna.4321 = 5\nJoana.1234 x2\nBia.1111',
  pesoZero: 'Joana.1234 x0\nMarcos.5678 x1',
  funcao: 'Joana.1234 - Heal\nMarcos.5678 – DPS\nAna.4321\nBia.1111 - Quick - Boon',
  funcaoPeso: 'Joana.1234 x2 - Heal\nMarcos.5678 - DPS x3',
  windows: 'Joana.1234\r\nMarcos.5678\r\n\r\n  Ana.4321  \t ',
  espacos: 'Ana   Clara.4321\n\tZé Pedro.1000',
  unicode: '🦊 Fox.4242\n王秀英.8888\nÁgata Lima.1037\nágata lima.1037',
  vazia: '',
};

export async function montarCasos({ aleatorio: a, aoVivo: v, contas: c }: Lib) {
  const casos: Record<string, unknown> = {};

  // gerador + numeros
  for (const cod of CODIGOS) {
    const g = await a.gerador(cod, 'numeros');
    casos[`gerador|${cod}|u32`] = { cod, saida: Array.from({ length: 6 }, () => g.u32()) };
    const g2 = await a.gerador(cod, 'teste');
    casos[`gerador|${cod}|abaixo-entre-indice`] = { cod, saida: [g2.abaixo(1000n), g2.abaixo(10n ** 20n), g2.entre(-5n, 5n), g2.indice(7), g2.abaixo(1n), g2.abaixo(0n)] };
    const g3 = await a.gerador(cod, 'lista');
    casos[`gerador|${cod}|embaralha`] = { cod, saida: g3.embaralha(Array.from({ length: 12 }, (_, i) => i)) };
    for (const [min, max, qtd] of FAIXAS) {
      for (const repetir of [false, true]) {
        const g4 = await a.gerador(cod, 'numeros');
        casos[`numeros|${cod}|${min}-${max}|${qtd}|${repetir ? 'repete' : 'unico'}`] = { cod, min, max, qtd, repetir, saida: a.numeros(g4, min, max, qtd, repetir) };
      }
    }
  }
  casos['gerador|contexto-diferente'] = { saida: [(await a.gerador('X', '')).u32(), (await a.gerador('X', 'online')).u32(), (await a.gerador(' x ', '')).u32()] };

  // comPeso
  const bilhetes = [{ n: 'a', bilhetes: 1 }, { n: 'b', bilhetes: 5 }, { n: 'c', bilhetes: 20 }, { n: 'd', bilhetes: 1 }, { n: 'e', bilhetes: 100 }, { n: 'f', bilhetes: 3 }];
  for (const cod of CODIGOS.slice(0, 3)) {
    for (const qtd of [1, 3, 10]) {
      casos[`comPeso|${cod}|${qtd}`] = { cod, qtd, saida: a.comPeso(await a.gerador(cod, 'peso'), bilhetes, qtd) };
    }
  }

  // sortearAoVivo
  const fora = [v.chaveDe(INSCRITOS[1]), v.chaveDe(INSCRITOS[5]), v.chaveDe(INSCRITOS[10]), 'nao.existe.0000'];
  const inscritos = INSCRITOS.map((conta) => ({ chave: v.chaveDe(conta), conta }));
  const invertidos = [...inscritos].reverse(); // a ordem de entrada não pode mudar o resultado
  for (const cod of CODIGOS.slice(0, 3)) {
    for (const venc of [1, 3, 60]) {
      for (const excl of [false, true]) {
        casos[`sortearAoVivo|${cod}|${venc}|${excl ? 'com-excluidos' : 'sem-excluidos'}`] = { cod, venc, saida: await v.sortearAoVivo(inscritos, excl ? fora : [], venc, cod) };
      }
    }
  }
  casos['sortearAoVivo|ordem-invertida'] = { saida: await v.sortearAoVivo(invertidos, fora, 3, 'K7PX-3QMA-9RTD') };
  casos['sortearAoVivo|vazio'] = { saida: await v.sortearAoVivo([], [], 3, 'K7PX-3QMA-9RTD') };

  // confere
  const r = await v.sortearAoVivo(inscritos, fora, 3, 'K7PX-3QMA-9RTD');
  const valido = { participantes: INSCRITOS, excluidos: fora, ganhadores: r.ganhadores, codigo: 'K7PX-3QMA-9RTD', impressao: r.impressao };
  casos['confere|valido'] = { saida: await v.confere(valido) };
  casos['confere|ganhador-trocado'] = { saida: await v.confere({ ...valido, ganhadores: [...r.ganhadores.slice(0, 2), INSCRITOS[7]] }) };
  casos['confere|lista-alterada'] = { saida: await v.confere({ ...valido, participantes: INSCRITOS.slice(0, 39) }) };
  casos['confere|codigo-errado'] = { saida: await v.confere({ ...valido, codigo: 'AAAA-BBBB-CCCC' }) };
  casos['confere|impressao-errada'] = { saida: await v.confere({ ...valido, impressao: '00000000' }) };
  const mantidos = [INSCRITOS[2]];
  const rm = await v.sortearAoVivo(inscritos, [...fora, v.chaveDe(INSCRITOS[2])], 2, 'ABCD-EFGH-JKMN');
  casos['confere|mantidos'] = { saida: await v.confere({ participantes: INSCRITOS, excluidos: [...fora, v.chaveDe(INSCRITOS[2])], ganhadores: [...mantidos, ...rm.ganhadores], codigo: 'ABCD-EFGH-JKMN', impressao: rm.impressao, mantidos }) };

  // impressao
  for (const [i, t] of ['', 'joana.1234\nmarcos.5678', 'Texto com acentuação e 🦊 emoji'].entries()) {
    casos[`impressao|${i}`] = { texto: t, saida: await a.impressao(t) };
  }

  // lerLista
  for (const [nome, texto] of Object.entries(LISTAS)) {
    for (const soGw2 of [false, true]) {
      casos[`lerLista|${nome}|soGw2=${soGw2}`] = { texto, saida: c.lerLista(texto, { soGw2 }) };
      casos[`lerLista|${nome}|soGw2=${soGw2}|peso`] = { texto, saida: c.lerLista(texto, { soGw2, peso: true }) };
      casos[`lerLista|${nome}|soGw2=${soGw2}|funcao`] = { texto, saida: c.lerLista(texto, { soGw2, funcao: true }) };
      casos[`lerLista|${nome}|soGw2=${soGw2}|peso+funcao`] = { texto, saida: c.lerLista(texto, { soGw2, peso: true, funcao: true }) };
    }
  }
  casos['lerLista|sem-opcoes'] = { saida: c.lerLista(LISTAS.simples) };

  // lerItens, textoDeArquivo, CONTA_GW2
  for (const [i, t] of ['Legendary x2\nBolsa\n\nGemas x600', 'A x0\nB *3', 'X = 2'].entries()) casos[`lerItens|${i}`] = { texto: t, saida: c.lerItens(t) };
  casos['textoDeArquivo|csv'] = { saida: c.textoDeArquivo('lista.csv', '"Joana.1234";3\nMarcos.5678,\n,sem\nAna.4321\t2') };
  casos['textoDeArquivo|txt'] = { saida: c.textoDeArquivo('lista.txt', 'a\nb') };
  casos['CONTA_GW2'] = { saida: ['Joana.1234', 'a.1234', 'Joana.12', ' Joana.1234', '🦊 Fox.4242', 'x'.repeat(30) + '.1234', 'x'.repeat(31) + '.1234'].map((s) => c.CONTA_GW2.test(s)) };

  // limpaCodigo, inteiro, chaveDe
  casos['limpaCodigo'] = { saida: ['  k7px 3qma\t9rtd ', 'abc', '', 'Ç ã'].map(a.limpaCodigo) };
  casos['inteiro'] = { saida: ['1.000', '-5', '1e3', ' 12 ', '1_000', '', 'abc', '99999999999999999999', '+4', '1 000'].map(a.inteiro) };
  casos['chaveDe'] = { saida: ['Joana.1234', 'ÁGATA.1', 'İstanbul.1', 'Ωmega.1'].map(v.chaveDe) };
  return casos;
}
