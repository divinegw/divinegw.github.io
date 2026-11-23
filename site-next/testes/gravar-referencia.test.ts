// Grava testes/referencia.json a partir do SITE ATUAL (site-astro). Só roda com GRAVAR=1.
// No PowerShell: $env:GRAVAR=1; npm test
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as aleatorio from '../../site-astro/src/lib/sorteio/aleatorio';
import * as aoVivo from '../../site-astro/src/lib/sorteio/ao-vivo';
import * as contas from '../../site-astro/src/lib/sorteio/contas';
import { montarCasos, paraJson } from './casos';

describe.skipIf(process.env.GRAVAR !== '1')('gravar referência do site atual', () => {
  it('grava referencia.json', async () => {
    const casos = paraJson(await montarCasos({ aleatorio, aoVivo, contas }));
    writeFileSync(fileURLToPath(new URL('./referencia.json', import.meta.url)), `${JSON.stringify(casos, null, 1)}\n`);
    expect(Object.keys(casos).length).toBeGreaterThan(100);
  });
});
