import { describe, expect, it } from 'vitest';
import { fechaLogo, iconeSeguro, tempoCurto } from '@/lib/sorteio/exibir';
import { lerInteiro, textoConvite } from '@/lib/sorteio/formulario';
import { deRest, estaAberto } from '@/lib/dados/rest';

describe('iconeSeguro', () => {
  it('aceita só o render do jogo, em https', () => {
    expect(iconeSeguro('https://render.guildwars2.com/file/AB/1.png')).toBe('https://render.guildwars2.com/file/AB/1.png');
    expect(iconeSeguro('http://render.guildwars2.com/x.png')).toBeNull();
    expect(iconeSeguro('https://render.guildwars2.com.evil.com/x.png')).toBeNull();
    expect(iconeSeguro('javascript:alert(1)')).toBeNull();
    expect(iconeSeguro('')).toBeNull();
  });
});
describe('tempoCurto', () => {
  it('formata minutos, horas e dias', () => {
    expect(tempoCurto(5_000)).toBe('1 min');
    expect(tempoCurto(13 * 60_000)).toBe('13 min');
    expect(tempoCurto(2.5 * 3_600_000)).toBe('2 h');
    expect(tempoCurto(24 * 3_600_000)).toBe('1 dia');
    expect(tempoCurto(72 * 3_600_000)).toBe('3 dias');
  });
  it('avisa quando falta pouco', () => { expect(fechaLogo(2 * 60_000)).toBe(true); expect(fechaLogo(9 * 60_000)).toBe(false); });
});
describe('lerInteiro', () => {
  it('confere a faixa', () => {
    expect(lerInteiro('', 50)).toEqual({ ok: false, motivo: 'vazio' });
    expect(lerInteiro('0', 50)).toEqual({ ok: false, motivo: 'invalido' });
    expect(lerInteiro('1,5', 50)).toEqual({ ok: false, motivo: 'invalido' });
    expect(lerInteiro('51', 50)).toEqual({ ok: false, motivo: 'invalido' });
    expect(lerInteiro(' 7 ', 50)).toEqual({ ok: true, valor: 7 });
  });
});
describe('textoConvite', () => {
  it('monta o texto do Discord', () => {
    expect(textoConvite('Live', null, 'https://x/y')).toBe('**Live**\nEntre e ponha sua conta do jogo: https://x/y');
  });
});
describe('REST', () => {
  it('converte valores', () => {
    expect(deRest({ mapValue: { fields: { a: { integerValue: '3' }, b: { nullValue: null }, c: { stringValue: 'x' } } } })).toEqual({ a: 3, b: null, c: 'x' });
  });
  it('estaAberto respeita resultado, aberto e prazo', () => {
    expect(estaAberto({ aberto: true, resultado: null, fechaEm: null })).toBe(true);
    expect(estaAberto({ aberto: true, resultado: null, fechaEm: Date.now() - 1 })).toBe(false);
    expect(estaAberto({ aberto: false, resultado: null, fechaEm: null })).toBe(false);
    expect(estaAberto({ aberto: true, resultado: { ganhadores: [] }, fechaEm: null })).toBe(false);
  });
});
