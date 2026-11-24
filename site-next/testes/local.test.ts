// Casos fixos das contas das abas "Lista de contas", "Números", "Squads" e "Extras" (lib/sorteio/local.ts), para pegar qualquer mudança futura.
// As funções de baixo (gerador, embaralha, numeros, comPeso) já são conferidas contra o site de hoje em referencia.test.ts;
// aqui se confere o que é montado em cima delas: ordenação, vencedores e reservas, prêmios, ordem, números, textos e histórico.
// Para gravar de novo (só depois de mudar de propósito): $env:GRAVAR=1; npm test
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lerItens, lerLista } from '@/lib/sorteio/contas';
import type { GrupoConteudo } from '@/lib/sorteio/conteudo';
import { codigoDe, impressaoDe, itensDe, ordenada, somaHistorico, sortearConteudo, sortearDados, sortearLista, sortearMoeda, sortearNumeros, sortearPremios, sortearSquads, textoParaCopiar, validarConteudo, validarDados, validarLista, validarMoeda, validarNumeros, validarPremios, validarSquads } from '@/lib/sorteio/local';
import { paraJson } from './casos';

const arquivo = fileURLToPath(new URL('./local.json', import.meta.url));
const CODIGOS = ['K7PX-3QMA-9RTD', 'ABCD-EFGH-JKMN', 'divine guild', 'ZZZZ-2222-9999'];
const SEM_PESO = 'Mirela.7342\nDraknos.6624\nLua.2207\nKaelith.4821\nBruno Tank.1290\nChristopher Alexander Montgome.5678\n🦊 Fox.4242\nágata lima.1037\nÁgata Lima.1037\nZé Pedro.1000\nbruna.1111\nAna Clara.4321';
const COM_PESO = 'Joana.1234 x3\nMarcos.5678 *2\nAna.4321 = 5\nJoana.1234 x2\nBia.1111\nLéo.9999 x10\nCaio.2222';
const SQUAD = 'Mirela.7342 - Heal\nDraknos.6624 - Quickness\nLua.2207 - DPS\nKaelith.4821 - DPS\nBruno Tank.1290 - DPS\nThorvald.5510 - Heal\nChristopher Alexander Montgome.5678 - Alacrity\nVarek.9013 - DPS\nPietra.4466 – dps\nHoshi.1185 - DPS\nSereia Azul.0381 - Heal\n🦊 Fox.4242 - Quickness\nCaio Necro.3302 - DPS\nAurelia.8871 - DPS\nGrom.4040\nNyx.7719 - DPS';
const PREMIOS ='Legendary Insight x2\n100 gold\nMini Llama\nGift of Battle x3';

async function montar() {
  const c: Record<string, unknown> = {};
  const sem = lerLista(SEM_PESO, { soGw2: true });
  const com = lerLista(COM_PESO, { soGw2: true, peso: true });
  c['ordenada'] = ordenada(sem.validos).map((p) => p.chave);
  c['impressaoDe|sem-peso'] = await impressaoDe(sem.validos);
  c['impressaoDe|com-peso'] = await impressaoDe(com.validos, true);
  c['codigoDe'] = [codigoDe('  k7px 3qma\t9rtd '), codigoDe('abc'), { vazio: codigoDe('   ').conferindo }];

  for (const cod of CODIGOS) {
    for (const [venc, res] of [[1, 0], [3, 2], [5, 0]] as const) {
      for (const peso of [false, true]) {
        const s = await sortearLista(peso ? com.validos : sem.validos, { venc, res, ordem: false, peso }, cod);
        c[`lista|${cod}|${venc}+${res}|${peso ? 'peso' : 'igual'}`] = { saiu: s.saiu.map((p) => p.nome), rotulos: s.rotulos, discord: s.discord, resumo: s.resumo, impressao: s.impressao, codigo: s.codigo, conferindo: s.conferindo };
      }
    }
    for (const peso of [false, true]) {
      const s = await sortearLista(peso ? com.validos : sem.validos, { venc: 1, res: 0, ordem: true, peso }, cod);
      c[`ordem|${cod}|${peso ? 'peso' : 'igual'}`] = { saiu: s.saiu.map((p) => p.nome), rotulos: s.rotulos, discord: s.discord, resumo: s.resumo, impressao: s.impressao };
    }
    const itens = lerItens(PREMIOS);
    for (const repetir of [false, true]) {
      const s = await sortearPremios(sem.validos, itens, repetir, cod);
      c[`premios|${cod}|${repetir ? 'repete' : 'unico'}`] = { quem: s.quem.map((p) => p.nome), discord: s.discord, resumo: s.resumo, impressao: s.impressao };
    }
    for (const [min, max, qtd, repetir, ordenar] of [[1n, 100n, 1, false, false], [1n, 10n, 5, false, true], [1n, 10n, 8, true, false], [-50n, 50n, 6, false, true], [1n, 10n ** 12n, 4, true, false], [5n, 5n, 1, false, false]] as const) {
      const s = await sortearNumeros(min, max, qtd, repetir, ordenar, cod);
      c[`numeros|${cod}|${min}-${max}|${qtd}|${repetir ? 'repete' : 'unico'}|${ordenar ? 'ordenado' : 'solto'}`] = { saiu: s.saiu, faixa: s.faixa, discord: s.discord, resumo: s.resumo };
    }
  }
  const unico = await sortearNumeros(1n, 1000n, 50, false, false, 'K7PX-3QMA-9RTD');
  c['numeros|resumo-longo'] = { resumo: unico.resumo };

  const s1 = await sortearLista(sem.validos, { venc: 2, res: 1, ordem: false, peso: false }, 'K7PX-3QMA-9RTD');
  c['textoParaCopiar'] = textoParaCopiar(s1, 'https://divinegw.github.io');
  const h0 = [{ modo: 'Números', resumo: 'x', codigo: 'A', em: '2026-11-22T20:12:00.000Z' }];
  c['somaHistorico'] = [
    somaHistorico(h0, { modo: 'Lista de contas', resumo: 'y', codigo: 'B', impressao: 'ABCD1234' }, new Date('2026-11-23T21:58:00.000Z')),
    somaHistorico(Array.from({ length: 20 }, (_, i) => ({ modo: 'Números', resumo: `${i}`, codigo: `C${i}`, em: '2026-01-01T00:00:00.000Z' })), { modo: 'Prêmios', resumo: 'z', codigo: 'D' }, new Date('2026-11-23T22:00:00.000Z')).map((e) => e.codigo),
  ];
  c['validarNumeros'] = [['1', '100', '1', false], ['100', '10', '1', false], ['a', '10', '1', false], ['1', '10', '0', false], ['1', '10', '10001', true], ['1', '10', '11', false], ['1', '10', '11', true], ['-10', '-1', '10', false], ['1.000', '2.000', '', false]]
    .map(([a, b, q, r]) => validarNumeros(a as string, b as string, q as string, r as boolean));
  c['validarLista'] = [[0, '1', '0', false], [1, '1', '0', false], [5, '0', '0', false], [5, '1', '-1', false], [5, '4', '2', false], [5, '6', '0', false], [5, '9', '9', true], [40, '50', '0', false]]
    .map(([n, v, r, o]) => validarLista(n as number, { venc: v as string, res: r as string, ordem: o as boolean }));
  c['validarPremios'] = [validarPremios([], 5, false), validarPremios(['a'], 0, false), validarPremios(Array(12).fill('a'), 4, false), validarPremios(Array(12).fill('a'), 4, true), validarPremios(['a'], 1, false)];

  // ---- Etapa 2d: Squads, O que jogar, Dados e Cara ou coroa (casos novos; os de cima não mudam)
  const squads = lerLista(SQUAD, { soGw2: true, funcao: true });
  c['squads|lerLista'] = squads.validos.map((p) => `${p.nome}|${p.funcao ?? ''}`);
  for (const cod of CODIGOS) {
    for (const [n, porGrupos, equilibrar] of [[5, false, true], [5, false, false], [3, true, true], [3, true, false], [20, false, true], [16, true, true], [1, false, true]] as const) {
      const s = await sortearSquads(squads.validos, { n, porGrupos, equilibrar }, cod);
      c[`squads|${cod}|${n}|${porGrupos ? 'grupos' : 'tamanho'}|${equilibrar ? 'espalha' : 'solto'}`] = { grupos: s.grupos.map((g) => g.map((p) => p.nome)), qtdGrupos: s.qtdGrupos, discord: s.discord, resumo: s.resumo, impressao: s.impressao, codigo: s.codigo, conferindo: s.conferindo };
    }
  }
  const semFuncao = lerLista(SEM_PESO, { soGw2: true, funcao: true });
  c['squads|sem-funcao'] = (await sortearSquads(semFuncao.validos, { n: 4, porGrupos: false, equilibrar: true }, 'K7PX-3QMA-9RTD')).grupos.map((g) => g.map((p) => p.nome));

  const GRUPOS_FIXOS: GrupoConteudo[] = [
    { id: 'raid-boss', nome: 'Bosses de raid', itens: ['Vale Guardian', 'Gorseval', 'Sabetha', 'Slothasor', 'Matthias'].map((t) => ({ t, onde: 'Wing X', h: `/guias/raids.html#${t.toLowerCase()}` })) },
    { id: 'fractal', nome: 'Fractals', itens: ['Aetherblade', 'Aquatic Ruins', 'Cliffside', 'Mai Trin'].map((t) => ({ t, onde: 'Fractals', h: `/guias/fractals.html#${t.toLowerCase()}` })) },
    { id: 'dungeon', nome: 'Dungeons', itens: ['Arah', 'Twilight Arbor'].map((t) => ({ t, onde: 'Dungeons', h: `/guias/dungeons.html#${t.toLowerCase()}` })) },
  ];
  for (const cod of CODIGOS) {
    for (const ids of [['raid-boss'], ['fractal', 'dungeon'], ['dungeon', 'raid-boss', 'fractal']]) {
      for (const qtd of [1, 3]) {
        const s = await sortearConteudo(GRUPOS_FIXOS, ids, qtd, cod);
        c[`conteudo|${cod}|${ids.join('+')}|${qtd}`] = { saiu: s.saiu.map((x) => x.t), discord: s.discord, resumo: s.resumo, codigo: s.codigo, conferindo: s.conferindo };
      }
    }
    for (const [qtd, lados, mod] of [[1, 20, 0], [3, 20, 0], [4, 6, 2], [2, 100, -5], [100, 4, 0], [1, 12, 7]] as const) {
      const s = await sortearDados(qtd, lados, mod, cod);
      c[`dados|${cod}|${qtd}d${lados}|${mod}`] = { rol: s.rol, total: s.total, nome: s.nome, discord: s.discord, resumo: s.resumo };
    }
    for (const qtd of [1, 10, 61, 1000]) {
      const s = await sortearMoeda(qtd, cod);
      c[`moeda|${cod}|${qtd}`] = { lados: qtd <= 61 ? s.lados : s.lados.slice(0, 10), caras: s.caras, discord: s.discord, resumo: s.resumo };
    }
  }
  c['itensDe'] = [itensDe(GRUPOS_FIXOS, ['dungeon', 'raid-boss']).map((x) => x.t), itensDe(GRUPOS_FIXOS, []).length];
  c['validarSquads'] = [[0, '5', false], [1, '5', false], [16, '5', false], [16, '0', false], [16, 'a', true], [16, '16', true], [16, '17', true], [40, '', false], [2, '2', true], [2, '3', true]]
    .map(([n, q, g]) => validarSquads(n as number, q as string, g as boolean));
  c['validarConteudo'] = [[0, 0, '1'], [5, 0, '1'], [5, 1, '0'], [5, 1, 'x'], [5, 1, '6'], [1, 1, '2'], [5, 2, ''], [5, 2, '5']]
    .map(([p, g, q]) => validarConteudo(p as number, g as number, q as string));
  c['validarDados'] = [['1', '20', '0'], ['0', '20', '0'], ['101', '20', '0'], ['3', '6', '1.5'], ['3', '6', '-4'], ['', '', ''], ['x', '6', '0']]
    .map(([q, l, m]) => validarDados(q, l, m));
  c['validarMoeda'] = ['1', '1000', '1001', '0', '', '2.5'].map(validarMoeda);
  return paraJson(c) as Record<string, unknown>;
}

const atuais = await montar();

describe.skipIf(process.env.GRAVAR !== '1')('gravar casos das abas locais', () => {
  it('grava local.json', () => {
    writeFileSync(arquivo, `${JSON.stringify(atuais, null, 1)}\n`);
    expect(Object.keys(atuais).length).toBeGreaterThan(50);
  });
});

describe.skipIf(process.env.GRAVAR === '1')('abas locais: mesmo resultado de sempre', () => {
  it('tem o arquivo gravado (rode uma vez com GRAVAR=1)', () => { expect(existsSync(arquivo)).toBe(true); });
  if (existsSync(arquivo)) {
    const gravado = JSON.parse(readFileSync(arquivo, 'utf8')) as Record<string, unknown>;
    it('tem os mesmos casos', () => { expect(Object.keys(atuais).sort()).toEqual(Object.keys(gravado).sort()); });
    for (const nome of Object.keys(gravado)) it(nome, () => { expect(atuais[nome]).toEqual(gravado[nome]); });
  }
});
