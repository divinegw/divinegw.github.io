// Contrato de URLs e âncoras: há links do Discord para elas, então nenhuma pode sumir na troca para o site novo.
//   node scripts/qa/contrato.mjs          confere dist/ contra contrato.json (falha se faltar URL ou âncora)
//   node scripts/qa/contrato.mjs gravar   grava contrato.json a partir do dist/ atual (só quando uma mudança for de propósito)
// URLs: todo arquivo publicado fora de assets/.
// Âncoras: o destino de um link com # (guias/raids.html#secao-2). Vale todo id dentro do <main> das páginas de
// conteúdo, menos os da interface, que ninguém manda no Discord (lista IGNORAR: rodapé, modelos, avisos).
// O sorteio entra só pela URL: as telas são refeitas e não têm link com #.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', '..', 'dist');
const ARQ = path.join(HERE, 'contrato.json');
const FORA = new Set(['design-system.html']); // vitrine: o Actions apaga antes de publicar
const SEM_ANCORA = /^(404\.html|sorteio\.html|sorteio\/)/;
const IGNORAR = /^(conteudo|proximo-rotulo|footer-.*|tpl-.*|anuncio-.*)$/;

const lista = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const rel = base ? `${base}/${e.name}` : e.name;
  if (e.isDirectory()) return rel === 'assets' || rel === '_next' ? [] : lista(path.join(dir, e.name), rel);
  return [rel];
});

const ler = () => {
  const urls = lista(DIST).filter((u) => !FORA.has(u) && !u.endsWith('.txt') && !u.startsWith('_')).sort();
  const ancoras = {};
  for (const u of urls.filter((u) => u.endsWith('.html') && !SEM_ANCORA.test(u))) {
    const html = fs.readFileSync(path.join(DIST, u), 'utf8');
    const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
    const ids = [...main.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((id) => !IGNORAR.test(id));
    if (ids.length) ancoras[u] = [...new Set(ids)];
  }
  return { urls, ancoras };
};

if (!fs.existsSync(DIST)) { console.error('Sem dist/: rode npm run build antes.'); process.exit(1); }
const atual = ler();

if (process.argv[2] === 'gravar') {
  fs.writeFileSync(ARQ, JSON.stringify(atual, null, 1) + '\n');
  const n = Object.values(atual.ancoras).reduce((s, a) => s + a.length, 0);
  console.log(`contrato.json gravado: ${atual.urls.length} URLs e ${n} âncoras.`);
  process.exit(0);
}

const contrato = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
const faltam = [];
const tem = new Set(atual.urls);
for (const u of contrato.urls) if (!tem.has(u)) faltam.push(`URL /${u}`);
for (const [u, ids] of Object.entries(contrato.ancoras)) {
  const agora = new Set(atual.ancoras[u] || []);
  for (const id of ids) if (!agora.has(id)) faltam.push(`âncora /${u}#${id}`);
}
if (faltam.length) {
  console.error(`Contrato quebrado: ${faltam.length} link(s) do Discord deixariam de funcionar.`);
  for (const f of faltam) console.error('  falta ' + f);
  process.exit(1);
}
console.log(`Contrato ok: ${contrato.urls.length} URLs e todas as âncoras continuam no lugar.`);
