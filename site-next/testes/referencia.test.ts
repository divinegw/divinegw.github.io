// Confere que o sorteio copiado para o site novo dá EXATAMENTE as mesmas saídas do site atual (testes/referencia.json).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as aleatorio from '@/lib/sorteio/aleatorio';
import * as aoVivo from '@/lib/sorteio/ao-vivo';
import * as contas from '@/lib/sorteio/contas';
import { montarCasos, paraJson } from './casos';

const referencia = JSON.parse(readFileSync(fileURLToPath(new URL('./referencia.json', import.meta.url)), 'utf8')) as Record<string, unknown>;
const atuais = paraJson(await montarCasos({ aleatorio, aoVivo, contas })) as Record<string, unknown>;

describe('mesmo resultado do site atual', () => {
  it('tem os mesmos casos da referência', () => {
    expect(Object.keys(atuais).sort()).toEqual(Object.keys(referencia).sort());
  });
  for (const nome of Object.keys(referencia)) {
    it(nome, () => { expect(atuais[nome]).toEqual(referencia[nome]); });
  }
});

describe('novoCodigo (aleatório)', () => {
  it('tem 3 blocos de 4 do alfabeto sem 0/O/1/I/L', () => {
    for (let i = 0; i < 200; i++) expect(aleatorio.novoCodigo()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  });
  it('não repete em sequência', () => {
    expect(new Set(Array.from({ length: 100 }, aleatorio.novoCodigo)).size).toBe(100);
  });
});
