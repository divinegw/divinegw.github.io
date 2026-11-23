// Casos fixos das contas das abas "Lista de contas" e "Números" (lib/sorteio/local.ts), para pegar qualquer mudança futura.
// As funções de baixo (gerador, embaralha, numeros, comPeso) já são conferidas contra o site de hoje em referencia.test.ts;
// aqui se confere o que é montado em cima delas: ordenação, vencedores e reservas, prêmios, ordem, números, textos e histórico.
// Para gravar de novo (só depois de mudar de propósito): $env:GRAVAR=1; npm test
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lerItens, lerLista } from '@/lib/sorteio/contas';
import { codigoDe, impressaoDe, ordenada, somaHistorico, sortearLista, sortearNumeros, sortearPremios, textoParaCopiar, validarLista, validarNumeros, validarPremios } from '@/lib/sorteio/local';
import { paraJson } from './casos';

const arquivo = fileURLToPath(new URL('./local.json', import.meta.url));
const CODIGOS = ['K7PX-3QMA-9RTD', 'ABCD-EFGH-JKMN', 'divine guild', 'ZZZZ-2222-9999'];
const SEM_PESO = 'Mirela.7342\nDraknos.6624\nLua.2207\nKaelith.4821\nBruno Tank.1290\nChristopher Alexander Montgome.5678\n🦊 Fox.4242\nágata lima.1037\nÁgata Lima.1037\nZé Pedro.1000\nbruna.1111\nAna Clara.4321';
const COM_PESO = 'Joana.1234 x3\nMarcos.5678 *2\nAna.4321 = 5\nJoana.1234 x2\nBia.1111\nLéo.9999 x10\nCaio.2222';
const PREMIOS = 'Legendary Insight x2\n100 gold\nMini Llama\nGift of Battle x3';

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
