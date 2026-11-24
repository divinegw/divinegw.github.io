// O conteúdo do "O que jogar" tem que sair igual ao do site de hoje, na mesma ordem (o sorteio depende dela).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { conteudoSorteio, slug } from '@/lib/sorteio/conteudo';
import { slug as slugOriginal } from '../../site-astro/src/rehype-divine.mjs';

describe('slug', () => {
  it('é igual ao de site-astro/src/rehype-divine.mjs', () => {
    for (const t of ['Wing 1: Spirit Vale', "Caudecus's Manor", 'Introdução às Fractals', 'Ágata  Lima!', '  --x--  ', 'Mursaat Overseer', 'Sunqua Peak (CM)', ''])
      expect(slug(t)).toBe(slugOriginal(t));
  });
});

describe('conteudoSorteio', () => {
  const grupos = conteudoSorteio();
  it('tem os grupos esperados, só os que têm itens', () => {
    expect(grupos.map((g) => g.id)).toEqual(['raid-boss', 'raid-wing', 'fractal', 'dungeon']);
    expect(grupos.every((g) => g.itens.length > 0)).toBe(true);
  });
  it('todo item aponta para um guia e uma âncora', () => {
    for (const g of grupos) for (const i of g.itens) expect(i.h).toMatch(/^\/guias\/(raids|fractals|dungeons)\.html#[a-z0-9-]+$/);
  });
  // O site de hoje (já gerado em site-astro/dist) guarda a mesma lista no HTML: a ordem e os textos têm de bater.
  const html = fileURLToPath(new URL('../../site-astro/dist/sorteio.html', import.meta.url));
  it.skipIf(!existsSync(html))('é igual ao que o site de hoje põe em sorteio.html (mesma ordem)', () => {
    const m = /<script[^>]*data-conteudo[^>]*>([\s\S]*?)<\/script>/.exec(readFileSync(html, 'utf8'));
    expect(JSON.parse(m![1])).toEqual(grupos);
  });
});
