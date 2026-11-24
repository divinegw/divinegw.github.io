// Contas e textos do painel do sorteio (lib/sorteio/painel.ts) e a camada falsa (lib/dados/falso.ts): sem navegador.
import { describe, expect, it } from 'vitest';
import { criarFalso, ouvintesLigados } from '@/lib/dados/falso';
import { estadoDoAceite, estaAberto, formatarRelogio, iniciais, tempoPorExtenso, textoConviteDiscord, textoResultado } from '@/lib/sorteio/painel';

const ts = (ms: number) => ({ toMillis: () => ms });

describe('relógio', () => {
  it('formata como mm:ss e nunca fica negativo', () => {
    expect(formatarRelogio(803_000)).toBe('13:23');
    expect(formatarRelogio(47_000)).toBe('0:47');
    expect(formatarRelogio(-5)).toBe('0:00');
    expect(formatarRelogio(3_909_000)).toBe('1:05:09');
    expect(formatarRelogio(2 * 86_400_000 + 3 * 3_600_000)).toBe('2 d 03 h');
  });
  it('arredonda para cima, como o relógio da tela', () => {
    expect(formatarRelogio(9_001)).toBe('0:10');
  });
  it('diz por extenso', () => {
    expect(tempoPorExtenso(803_000)).toBe('13 minutos e 23 segundos');
    expect(tempoPorExtenso(61_000)).toBe('1 minuto e 1 segundo');
    expect(tempoPorExtenso(8_000)).toBe('8 segundos');
  });
});

describe('inscrições abertas', () => {
  it('só com a chave ligada, sem resultado e dentro do prazo', () => {
    expect(estaAberto({ aberto: true, resultado: null, fechaEm: ts(2000) }, 1000)).toBe(true);
    expect(estaAberto({ aberto: true, resultado: null, fechaEm: ts(1000) }, 1000)).toBe(false);
    expect(estaAberto({ aberto: true, resultado: null, fechaEm: null }, 1000)).toBe(true);
    expect(estaAberto({ aberto: false, resultado: null, fechaEm: null }, 1000)).toBe(false);
    expect(estaAberto({ aberto: true, resultado: {}, fechaEm: null }, 1000)).toBe(false);
  });
});

describe('aceite do prêmio', () => {
  const r = { ganhadores: ['Mirela.7342', 'Lua.2207'], prazo: ts(60_000) };
  it('conta enquanto há tempo e alguém falta', () => {
    const e = estadoDoAceite(r, new Set(['mirela.7342']), 20_000);
    expect(e.fase).toBe('conta');
    expect(e.resta).toBe(40_000);
    expect(e.urgente).toBe(false);
    expect(e.ganhadores.map((g) => g.ok)).toEqual([true, false]);
  });
  it('urgente nos últimos 10 s', () => {
    expect(estadoDoAceite(r, new Set(), 50_000).urgente).toBe(true);
  });
  it('fim quando o minuto acaba sem todo mundo, ok quando todos aceitaram', () => {
    expect(estadoDoAceite(r, new Set(['mirela.7342']), 61_000).fase).toBe('fim');
    expect(estadoDoAceite(r, new Set(['mirela.7342', 'lua.2207']), 61_000).fase).toBe('ok');
  });
});

describe('textos para copiar', () => {
  const s = { titulo: 'Sorteio da live', premio: 'Abyssal Forest Dye', premioInfo: null, vencedores: 1, fechaEm: ts(1_795_283_400_000) };
  it('convites', () => {
    expect(textoConviteDiscord('curto', s, 'https://x/s?s=1')).toBe('**Sorteio: Abyssal Forest Dye**\nParticipe com seu ID: https://x/s?s=1');
    expect(textoConviteDiscord('prazo', s, 'L')).toContain('<t:1795283400:R>');
    expect(textoConviteDiscord('completo', s, 'L')).toContain('-# Digite seu ID com os 4 números, como Joana.1234');
  });
  it('resultado: quem não aceitou sai da lista de quem leva', () => {
    const t = textoResultado(s, { ganhadores: ['A.1111', 'B.2222'], codigo: 'K7PX-3QMA-9RTD' }, ['B.2222'], 'https://x');
    expect(t).toBe('**Sorteio da live** · Abyssal Forest Dye\nA.1111\nNão aceitaram a tempo: B.2222\nCódigo: K7PX-3QMA-9RTD\nConfira em https://x/sorteio/ganhadores.html');
  });
});

describe('iniciais', () => {
  it('duas palavras, emoji sozinho, nada de HTML', () => {
    expect(iniciais('Bruno Tank.1290')).toBe('BT');
    expect(iniciais('🦊 Fox.4242')).toBe('🦊');
    expect(iniciais('<b>Ana</b>.1234')).toBe('A');
    expect(iniciais('王秀英.8888')).toBe('王');
  });
});

describe('camada falsa', () => {
  const sem = new URLSearchParams('parado=1');
  it('abrir e fechar 10 vezes não deixa ouvinte para trás', async () => {
    for (let i = 0; i < 10; i++) {
      const d = await criarFalso('inscricoes-cheia', 'organizador', sem);
      const parar = [d.ouvirSorteio('teste', () => {}), d.ouvirInscritos('teste', () => {}), d.ouvirAceites('teste', () => {}), d.ouvirConexao(() => {})];
      await new Promise((ok) => setTimeout(ok, 300));
      expect(ouvintesLigados()).toEqual({ sorteio: 1, inscritos: 1, aceites: 1, conexao: 1 });
      parar.forEach((f) => f());
      parar.forEach((f) => f()); // cancelar duas vezes não desconta duas
      expect(ouvintesLigados()).toEqual({ sorteio: 0, inscritos: 0, aceites: 0, conexao: 0 });
    }
    const d = await criarFalso('inscricoes-cheia', null, sem);
    let ultimo = 0;
    const parar = d.ouvirInscritos('teste', (l) => { ultimo = l.length; });
    await new Promise((ok) => setTimeout(ok, 300));
    expect(ultimo).toBe(40);
    parar();
  });
  it('a lista cheia traz os quatro nomes difíceis', async () => {
    const d = await criarFalso('inscricoes-cheia', null, sem);
    let nomes: string[] = [];
    const parar = d.ouvirInscritos('teste', (l) => { nomes = l.map((p) => p.conta); });
    await new Promise((ok) => setTimeout(ok, 300));
    parar();
    expect(nomes).toHaveLength(40);
    for (const n of ['Christopher Alexander Montgome.5678', 'Benachrichtigungseinstellungen.1234', '🦊 Fox.4242', '王秀英.8888']) expect(nomes).toContain(n);
  });
  it('inscrever grava, avisa os ouvintes e recusa repetido', async () => {
    const d = await criarFalso('inscricoes-vazia', null, sem);
    let n = -1;
    const parar = d.ouvirInscritos('teste', (l) => { n = l.length; });
    await new Promise((ok) => setTimeout(ok, 300));
    expect(n).toBe(0);
    await d.inscrever('teste', 'Joana.1234');
    expect(n).toBe(1);
    await expect(d.inscrever('teste', 'joana.1234')).rejects.toThrow();
    parar();
  });
  // Ouve a lista de inscritos e o sorteio até o fim do teste (o painel faz o mesmo).
  async function observar(cenario: string) {
    const d = await criarFalso(cenario, 'organizador', sem);
    let inscritos: { chave: string; conta: string }[] = [];
    let bloqueados: string[] = [];
    const a = d.ouvirInscritos('teste', (l) => { inscritos = l; });
    const b = d.ouvirSorteio('teste', (s) => { bloqueados = [...(s?.tirados ?? [])]; });
    await new Promise((ok) => setTimeout(ok, 300));
    return { d, contas: () => inscritos.map((p) => p.conta), bloqueados: () => bloqueados, parar: () => { a(); b(); } };
  }
  it('"Tirar" libera o aparelho: a pessoa entra de novo, e nada vai para os bloqueados', async () => {
    const o = await observar('inscricoes-vazia');
    await o.d.inscrever('teste', 'Joana.1234');
    await expect(o.d.inscrever('teste', 'Joana.9999')).rejects.toThrow(); // um aparelho, uma inscrição
    await o.d.tirarPermitindoVolta('teste', 'joana.1234', 'falso-uid');
    expect(o.contas()).toEqual([]);
    expect(o.bloqueados()).toEqual([]);
    await o.d.inscrever('teste', 'Joana.9999'); // ID certo
    expect(o.contas()).toEqual(['Joana.9999']);
    o.parar();
  });
  it('"Tirar" também deixa entrar de novo com o mesmo ID', async () => {
    const o = await observar('inscricoes-vazia');
    await o.d.inscrever('teste', 'Joana.1234');
    await o.d.tirarPermitindoVolta('teste', 'joana.1234', 'falso-uid');
    await o.d.inscrever('teste', 'Joana.1234');
    expect(o.contas()).toEqual(['Joana.1234']);
    o.parar();
  });
  it('"Tirar e bloquear" impede nova inscrição da mesma conta, de qualquer aparelho', async () => {
    const o = await observar('inscricoes-vazia');
    await o.d.inscrever('teste', 'Joana.1234');
    await o.d.tirarEBloquear('teste', 'joana.1234', 'Joana.1234');
    expect(o.contas()).toEqual([]);
    expect(o.bloqueados()).toEqual(['Joana.1234']);
    await expect(o.d.inscrever('teste', 'joana.1234')).rejects.toThrow(/bloqueada/);
    // outro aparelho, que ainda não tem marca: a conta continua barrada
    const outro = await observar('bloqueado');
    await expect(outro.d.inscrever('teste', 'Zyanore.3030')).rejects.toThrow(/bloqueada/);
    o.parar(); outro.parar();
  });
  it('a lista de bloqueados só cresce', async () => {
    const o = await observar('inscricoes-cheia');
    await o.d.tirarEBloquear('teste', 'mirela.7342', 'Mirela.7342');
    expect(o.bloqueados()).toEqual(['Mirela.7342']);
    await o.d.tirarPermitindoVolta('teste', 'lua.2207', 'falso-lua.2207');
    expect(o.bloqueados()).toEqual(['Mirela.7342']); // "Tirar" não mexe nela
    await o.d.tirarEBloquear('teste', 'varek.9013', 'Varek.9013');
    expect(o.bloqueados()).toEqual(['Mirela.7342', 'Varek.9013']);
    expect(o.contas()).toHaveLength(37);
    o.parar();
  });
  it('o resultado de cenário confere com o código', async () => {
    const d = await criarFalso('resultado-3', null, sem);
    let sorteio: Parameters<Parameters<typeof d.ouvirSorteio>[1]>[0] = null;
    let lista: { chave: string; conta: string }[] = [];
    const a = d.ouvirSorteio('teste', (x) => { sorteio = x; });
    const b = d.ouvirInscritos('teste', (x) => { lista = x; });
    await new Promise((ok) => setTimeout(ok, 300));
    a(); b();
    const r = (sorteio as unknown as { resultado: { ganhadores: string[]; codigo: string; impressao: string; excluidos: string[] } }).resultado;
    expect(r.ganhadores).toHaveLength(3);
    const { sortearAoVivo } = await import('@/lib/sorteio/ao-vivo');
    const x = await sortearAoVivo(lista, r.excluidos, 3, r.codigo);
    expect(x.ganhadores).toEqual(r.ganhadores);
    expect(x.impressao).toBe(r.impressao);
  });
});
