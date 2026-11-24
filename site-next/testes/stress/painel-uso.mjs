// Uso do painel com a camada falsa: abrir e fechar 10 vezes, entrar, reduzir movimento, sortear, tirar, confirmar.
// Uso, com o `npm run dev` no ar:  node testes/stress/painel-uso.mjs [url-base]
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(aqui, '../../../site-astro/package.json'))('playwright-core');
const BASE = process.argv[2] || 'http://localhost:3010/sorteio';
const b = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true });
const ok = (nome, cond, extra = '') => console.log(`${cond ? 'OK   ' : 'FALHA'} ${nome} ${extra}`);
const nova = async (opts = {}) => { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...opts }); const pg = await ctx.newPage(); pg.erros = []; pg.on('pageerror', (e) => pg.erros.push(e.message)); pg.on('console', (m) => m.type() === 'error' && pg.erros.push(m.text().slice(0, 140))); return pg; };

// 1. abrir e fechar 10 vezes
{
  const pg = await nova();
  await pg.goto(`${BASE}?s=teste&falso=inscricoes-cheia&parado=1`);
  await pg.waitForSelector('#part-tit');
  await pg.waitForTimeout(600);
  const conta = () => pg.evaluate(() => window.__divineFalso.ouvintes());
  ok('aberto: 1 ouvinte de cada', JSON.stringify(await conta()) === '{"sorteio":1,"inscritos":1,"aceites":1,"conexao":1}', JSON.stringify(await conta()));
  for (let i = 0; i < 10; i++) {
    await pg.getByRole('link', { name: 'Todos os sorteios' }).click();
    await pg.waitForTimeout(150);
    await pg.goBack();
    await pg.waitForSelector('#part-tit');
    await pg.waitForTimeout(450);
  }
  const itens = await pg.locator('#part-tit').locator('xpath=..').locator('xpath=..').locator('ul > li').count();
  ok('depois de 10 voltas: ouvintes iguais', JSON.stringify(await conta()) === '{"sorteio":1,"inscritos":1,"aceites":1,"conexao":1}', JSON.stringify(await conta()));
  ok('lista sem duplicar (40)', itens === 40, String(itens));
  await pg.getByRole('link', { name: 'Todos os sorteios' }).click();
  await pg.waitForTimeout(300);
  ok('fechado: 0 ouvintes', JSON.stringify(await conta()) === '{"sorteio":0,"inscritos":0,"aceites":0,"conexao":0}', JSON.stringify(await conta()));
  ok('sem erro no console', pg.erros.length === 0, pg.erros.join(' | '));
}
// 2. entrar com ID errado, repetido e certo
{
  const pg = await nova();
  await pg.goto(`${BASE}?s=teste&falso=inscricoes-cheia&parado=1`);
  const campo = pg.getByLabel('Seu ID do Guild Wars 2');
  await campo.fill('Zyanore3030'); await pg.getByRole('button', { name: 'Participar' }).click();
  ok('ID errado: alerta e foco no campo', (await pg.locator('p[role=alert]').innerText()).includes('Esse ID não existe') && await campo.evaluate((e) => e === document.activeElement));
  await campo.fill('Mirela.7342'); await pg.getByRole('button', { name: 'Participar' }).click();
  ok('ID repetido', (await pg.locator('p[role=alert]').innerText()).includes('já está no sorteio'));
  await campo.fill('Novata.1111'); await pg.getByRole('button', { name: 'Participar' }).click();
  await pg.waitForSelector('[data-foco-painel]');
  ok('entrou: foco na confirmação', await pg.evaluate(() => document.activeElement?.hasAttribute('data-foco-painel')));
  ok('lista tem 41 e "Você" no topo', (await pg.locator('[aria-labelledby=part-tit] ul > li').count()) === 41 && (await pg.locator('[aria-labelledby=part-tit] ul > li').first().innerText()).includes('Você'));
  ok('sem erro no console', pg.erros.length === 0, pg.erros.join(' | '));
}
// 3. reduzir movimento: sem roleta, vencedor direto
{
  const pg = await nova({ reducedMotion: 'reduce' });
  await pg.goto(`${BASE}?s=teste&falso=sorteando`);
  await pg.waitForSelector('text=ganhou Abyssal', { timeout: 8000 });
  await pg.waitForTimeout(300);
  ok('reduzir movimento: sem canvas da roleta', (await pg.locator('canvas').count()) === 0);
  ok('foco no título da fase', await pg.evaluate(() => document.activeElement?.tagName === 'H2'));
}
// 4. sem reduzir: roleta gira e termina no resultado
{
  const pg = await nova();
  await pg.goto(`${BASE}?s=teste&falso=sorteando`);
  await pg.waitForSelector('canvas', { timeout: 6000 });
  ok('roleta apareceu', true);
  await pg.waitForSelector('text=ganhou Abyssal', { timeout: 12000 });
  ok('roleta terminou no resultado', (await pg.locator('canvas').count()) === 0);
  ok('sem erro no console', pg.erros.length === 0, pg.erros.join(' | '));
}
// 5. quem organiza: sortear com confirmação e depois tirar a roleta
{
  const pg = await nova();
  await pg.goto(`${BASE}?s=teste&falso=inscricoes-cheia&papel=organizador&parado=1`);
  await pg.getByRole('button', { name: 'Sortear agora' }).click();
  ok('diálogo com texto do efeito', (await pg.getByRole('alertdialog').innerText()).includes('entre 40 participantes'));
  await pg.getByRole('button', { name: 'Voltar' }).click();
  await pg.getByRole('button', { name: 'Gerenciar' }).click();
  await pg.getByRole('button', { name: /Tirar Aurelia/ }).click();
  await pg.getByRole('button', { name: /^Tirar Aurelia/ }).last().click();
  await pg.waitForTimeout(600);
  ok('tirou: 39 na lista', (await pg.locator('[aria-labelledby=part-tit] ul > li').count()) === 39);
  ok('transparência mostra 1 tirada', (await pg.getByText('1 inscrição foi tirada').count()) === 1);
  await pg.getByRole('button', { name: 'Concluir' }).click();
  await pg.getByRole('button', { name: 'Sortear agora' }).click();
  await pg.getByRole('button', { name: 'Sortear', exact: true }).click();
  await pg.waitForSelector('canvas', { timeout: 6000 });
  await pg.getByRole('button', { name: 'Mostrar o resultado' }).click();
  await pg.getByRole('button', { name: 'Conferir o sorteio' }).click();
  await pg.waitForSelector('text=Conferido.', { timeout: 5000 });
  ok('conferiu o sorteio', true);
  ok('sem erro no console', pg.erros.length === 0, pg.erros.join(' | '));
}
// 6. confirmação: quem ganhou confirma; organizador sorteia outra pessoa quando o minuto acaba
{
  const pg = await nova();
  await pg.goto(`${BASE}?s=teste&falso=confirmacao-voce&parado=1`);
  await pg.getByRole('button', { name: 'Confirmar que estou aqui' }).click();
  await pg.waitForSelector('text=Pronto. O prêmio é seu.');
  ok('confirmou', true);
  const og = await nova();
  await og.goto(`${BASE}?s=teste&falso=confirmacao-mista-3&papel=organizador&parado=1`);
  ok('botão de trocar travado antes do fim', (await og.getByRole('button', { name: 'Sortear outra pessoa' }).getAttribute('aria-disabled')) === 'true');
  await og.evaluate(() => window.__divineFalso.avancar(30000));
  await og.getByRole('button', { name: /Sortear 2 outras pessoas/ }).click({ timeout: 5000 });
  await og.getByRole('button', { name: /Sortear 2 outras pessoas/ }).last().click();
  await og.waitForTimeout(800);
  ok('trocou: histórico mostra 1 refeito', (await og.getByText('foi refeito 1 vez').count()) === 1);
  ok('sem erro no console', pg.erros.length + og.erros.length === 0, [...pg.erros, ...og.erros].join(' | '));
}
await b.close();



