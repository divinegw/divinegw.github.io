// Parte leve do sorteio ao vivo (sem o SDK do Firebase): os cards do topo, a aba Ganhadores, o Conferir pelo código
// e a escolha do prêmio no formulário. Lê o Firestore pela API REST, que obedece às mesmas regras do banco.
import { limpaCodigo } from '../lib/sorteio/aleatorio';
import { confere } from '../lib/sorteio/ao-vivo';
import { sugestoesComIcone, buscarItem, premioSimples, iconeOutro, textoPremio, type PremioInfo, type TipoPremio } from '../lib/sorteio/premio';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const dataCurta = (ms: number) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const pessoas = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;

// ---------------------------------------------------------------- Firestore pela API REST
type Rest = {
  stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; timestampValue?: string; nullValue?: null;
  mapValue?: { fields?: Record<string, Rest> }; arrayValue?: { values?: Rest[] };
};
function deRest(v: Rest | undefined): unknown {
  if (!v || 'nullValue' in v) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.timestampValue !== undefined) return Date.parse(v.timestampValue);
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(deRest);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, deRest(x)]));
  return null;
}
interface Config { apiKey: string; projectId: string }
const base = (c: Config) => `https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents`;
async function consulta(c: Config, structuredQuery: object, pai = '') {
  const r = await fetch(`${base(c)}${pai}:runQuery?key=${c.apiKey}`, { method: 'POST', body: JSON.stringify({ structuredQuery }), signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(String(r.status));
  const linhas = (await r.json()) as { document?: { name: string; fields?: Record<string, Rest> } }[];
  return linhas.filter((l) => l.document).map(({ document: d }) => ({ id: d!.name.split('/').pop()!, ...(deRest({ mapValue: { fields: d!.fields } }) as Record<string, unknown>) }));
}
async function contaInscritos(c: Config, id: string) {
  const r = await fetch(`${base(c)}/sorteios/${id}:runAggregationQuery?key=${c.apiKey}`, {
    method: 'POST', signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'inscritos' }] }, aggregations: [{ alias: 'n', count: {} }] } }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { result?: { aggregateFields?: { n?: Rest } } }[];
  return Number(deRest(j[0]?.result?.aggregateFields?.n) ?? 0);
}

// ---------------------------------------------------------------- ícone do prêmio
/** Ícone do prêmio com a cor da raridade. Sem ícone do jogo (expansão, texto), usa um ícone do site. */
export function iconePremio(p: Partial<PremioInfo> | null | undefined, tam: 'g' | 'm' | 'p' = 'm') {
  const px = tam === 'g' ? 80 : tam === 'm' ? 56 : 40;
  const cls = `premio-ico is-${esc(p?.raridade || 'texto')} is-${tam}`;
  if (p?.icone) return `<span class="${cls}"><img src="${esc(p.icone)}" alt="" width="${px}" height="${px}" loading="${tam === 'g' ? 'eager' : 'lazy'}" decoding="async" /></span>`;
  const t = document.querySelector<HTMLTemplateElement>(`template[data-ico="${p?.tipo === 'expansao' ? 'expansao' : 'gift'}"]`);
  return `<span class="${cls}">${t?.innerHTML ?? ''}</span>`;
}

// ---------------------------------------------------------------- relógio
/** "04:59", "2:15:08", "3 dias e 4 h". */
export function falta(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
  if (h >= 48) { const d = Math.floor(h / 24); return `${d} dias${h % 24 ? ` e ${h % 24} h` : ''}`; }
  const mm = String(m).padStart(2, '0'), ss = String(seg).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
/** O mesmo tempo em HTML: números grandes e unidades pequenas ("2d 23h 14min", "5h 12min 03s", "04:59").
 *  O desenho fica escondido do leitor de tela, que lê a frase por extenso ("2 dias, 23 horas e 14 minutos"). */
export function faltaHtml(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
  const n = (x: number | string) => `<span class="tempo-n">${x}</span>`;
  const u = (x: string) => `<span class="tempo-u">${x}</span>`;
  const p2 = (x: number) => String(x).padStart(2, '0');
  const dois = '<span class="tempo-s">:</span>';
  const ver = d ? `${n(d)}${u('d')}${n(h)}${u('h')}${n(m)}${u('min')}`
    : h ? `${n(h)}${u('h')}${n(p2(m))}${u('min')}${n(p2(seg))}${u('s')}`
      : `${n(p2(m))}${dois}${n(p2(seg))}`;
  const q = (x: number, um: string, varios: string) => (x ? `${x} ${x === 1 ? um : varios}` : '');
  const partes = d ? [q(d, 'dia', 'dias'), q(h, 'hora', 'horas'), q(m, 'minuto', 'minutos')]
    : h ? [q(h, 'hora', 'horas'), q(m, 'minuto', 'minutos')]
      : m ? [q(m, 'minuto', 'minutos')] : ['menos de 1 minuto'];
  const lista = partes.filter(Boolean);
  const ler = lista.length > 1 ? `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}` : lista[0];
  return `<span aria-hidden="true" class="tempo-ver">${ver}</span><span class="sr-only">${ler}</span>`;
}
/** Atualiza todo [data-fecha] da página uma vez por segundo. */
function relogios() {
  const tique = () => document.querySelectorAll<HTMLElement>('[data-fecha]').forEach((el) => {
    const ms = Number(el.dataset.fecha) - Date.now();
    if (ms > 0) { el.innerHTML = faltaHtml(ms); return; }
    el.textContent = 'Encerrado';
    el.removeAttribute('data-fecha');
    el.closest('.vivo-card')?.classList.add('is-fechado');
    const acao = el.closest('.vivo-card')?.querySelector('.vivo-link .btn');
    if (acao) acao.textContent = 'Acompanhar';
  });
  tique();
  setInterval(tique, 1000);
}

// ---------------------------------------------------------------- "Sorteios ao vivo" (topo): card B (Vitrine)
interface SorteioRest {
  id: string; titulo: string; premio: string; premioInfo: PremioInfo | null; descricao: string; vencedores: number;
  aberto: boolean; fechaEm: number | null; criadoEm: number; resultado: { ganhadores: string[] } | null;
}
function cardVivo(s: SorteioRest, inscritos: number | null) {
  const aberto = !s.resultado && s.aberto && (s.fechaEm === null || s.fechaEm > Date.now());
  const nome = s.premioInfo ? textoPremio(s.premioInfo) : s.premio || s.titulo;
  const tipo = s.premioInfo?.descricao ?? '';
  const meta = [s.titulo !== nome ? s.titulo : '', inscritos === null ? '' : pessoas(inscritos, 'inscrito', 'inscritos'), pessoas(s.vencedores, 'vencedor', 'vencedores')].filter(Boolean).join(' · ');
  const id = esc(s.id);
  const estadoTxt = s.resultado
    ? `<span class="vivo-ganhou"><span>${s.resultado.ganhadores.length > 1 ? 'Ganharam' : 'Ganhou'}</span> ${esc(s.resultado.ganhadores.join(', '))}</span>`
    : aberto && s.fechaEm
      ? `<span class="vivo-relogio"><span class="vivo-relogio-rotulo">Fecha em</span><span class="tempo vivo-relogio-tempo" data-fecha="${s.fechaEm}">${faltaHtml(s.fechaEm - Date.now())}</span></span>`
      : `<span class="vivo-relogio">${aberto ? 'Sem prazo para fechar' : 'Inscrições encerradas'}</span>`;
  const acao = s.resultado ? 'Ver resultado' : aberto ? 'Participar' : 'Acompanhar';
  const estado = s.resultado ? 'is-sorteado' : aberto ? '' : 'is-fechado';
  return `<li class="vivo-card ${estado}" style="--rar:var(--rar-${esc(s.premioInfo?.raridade || 'texto')})">
    <a class="vivo-link" href="/sorteio.html?s=${id}" aria-labelledby="v-${id}-a v-${id}-p" aria-describedby="v-${id}-e v-${id}-m">
      <div class="vivo-cab">
        ${iconePremio(s.premioInfo, 'm')}
        <div class="vivo-nomes">
          <h3 class="vivo-premio" id="v-${id}-p">${esc(nome)}</h3>
          ${tipo ? `<span class="vivo-tipo">${esc(tipo)}</span>` : ''}
        </div>
      </div>
      <div class="vivo-corpo">
        ${s.descricao ? `<span class="vivo-sobre">${esc(s.descricao)}</span>` : ''}
        <span class="vivo-meta" id="v-${id}-m">${esc(meta)}</span>
      </div>
      <span class="vivo-pe"><span id="v-${id}-e">${estadoTxt}</span><span class="btn btn-secundario btn-sm" id="v-${id}-a">${acao}</span></span>
    </a>
  </li>`;
}

export function aoVivo(raiz: HTMLElement, c: Config) {
  const sec = raiz.querySelector<HTMLElement>('[data-ao-vivo]');
  const ul = sec?.querySelector<HTMLUListElement>('[data-ao-vivo-lista]');
  const vazio = sec?.querySelector<HTMLElement>('[data-ao-vivo-vazio]');
  if (!sec || !ul || !vazio) return;
  const mais = sec.querySelector<HTMLButtonElement>('[data-ao-vivo-mais]')!;
  const vazioHtml = vazio.innerHTML; // o estado vazio desenhado no HTML (um erro troca por texto; o próximo carregamento devolve)
  const VISIVEIS = 3;
  let total = 0;
  let todos = false;
  const mostraTodos = (sim: boolean) => {
    todos = sim;
    [...ul.children].forEach((li, i) => { (li as HTMLElement).hidden = !sim && i >= VISIVEIS; });
    mais.hidden = total <= VISIVEIS;
    mais.textContent = sim ? 'Mostrar menos' : `Ver todos os ${total}`;
    mais.setAttribute('aria-expanded', String(sim));
  };
  mais.addEventListener('click', () => mostraTodos(!todos));
  let carregando = false;
  let ultimoHtml = '';
  const contagens = new Map<string, number | null>(); // sorteio fechado não ganha inscrito: conta uma vez só
  const carrega = async () => {
    if (carregando) return;
    carregando = true;
    try {
      const ss = (await consulta(c, {
        from: [{ collectionId: 'sorteios' }],
        where: { fieldFilter: { field: { fieldPath: 'expiraEm' }, op: 'GREATER_THAN', value: { timestampValue: new Date().toISOString() } } },
        orderBy: [{ field: { fieldPath: 'expiraEm' }, direction: 'ASCENDING' }],
        limit: 20,
      })) as unknown as SorteioRest[];
      const agora = Date.now();
      const aberto = (s: SorteioRest) => !s.resultado && s.aberto && (s.fechaEm === null || s.fechaEm > agora);
      const lista = ss.filter((s) => !s.resultado) // o que já foi sorteado fica em Ganhadores
        .sort((a, b) => Number(aberto(b)) - Number(aberto(a)) || (a.fechaEm ?? Infinity) - (b.fechaEm ?? Infinity) || b.criadoEm - a.criadoEm)
        .slice(0, 12);
      const contas = await Promise.all(lista.map(async (s) => {
        if (!aberto(s) && contagens.has(s.id)) return contagens.get(s.id)!;
        const n = await contaInscritos(c, s.id).catch(() => null);
        contagens.set(s.id, n);
        return n;
      }));
      vazio.hidden = lista.length > 0;
      vazio.innerHTML = vazioHtml;
      if (ul.contains(document.activeElement)) return; // não tira o foco de quem está navegando nos cards
      const novo = lista.map((s, i) => cardVivo(s, contas[i])).join('');
      if (novo !== ultimoHtml) { ultimoHtml = novo; ul.innerHTML = novo; } // sem mudança, o leitor de tela não perde o lugar
      total = lista.length;
      mostraTodos(todos);
    } catch {
      if (ul.childElementCount) return; // já tem cards na tela: fica com eles e tenta de novo depois
      vazio.hidden = false;
      vazio.textContent = 'Não deu para carregar os sorteios agora. A gente tenta de novo em alguns minutos.';
    } finally { ul.removeAttribute('aria-busy'); carregando = false; }
  };
  carrega();
  relogios();
  // a cada 3 min com a aba à vista, e logo que a pessoa volta para a aba (o Firebase grátis tem limite de leituras por dia)
  setInterval(() => { if (!document.hidden) carrega(); }, 180_000);
  let saiuEm = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saiuEm = Date.now();
    else if (Date.now() - saiuEm > 60_000) carrega();
  });
}

// ---------------------------------------------------------------- aba Ganhadores: linha F + Conferir
interface Registro {
  id: string; titulo: string; premio: string; premioInfo: PremioInfo | null; ganhadores: string[]; codigo: string; impressao: string;
  total: number; excluidos: string[]; participantes: string[]; refeito: number; data: number;
  mantidos?: string[]; ausentes?: string[];
}
function linhaRegistro(r: Registro) {
  const nome = r.premioInfo ? textoPremio(r.premioInfo) : r.premio || r.titulo;
  const quem = r.ganhadores.length > 1 ? `${r.ganhadores[0]} e mais ${r.ganhadores.length - 1}` : r.ganhadores[0] ?? '';
  return `<li class="registro" data-id="${esc(r.id)}">
    <div class="registro-linha">
      ${iconePremio(r.premioInfo, 'p')}
      <span class="registro-premio"><b>${esc(nome)}</b><span>${esc(dataCurta(r.data))} · ${esc(pessoas(r.total, 'participante', 'participantes'))}</span></span>
      <span class="registro-quem"><span>${r.ganhadores.length > 1 ? 'Ganhadores' : 'Ganhador'}</span><b title="${esc(r.ganhadores.join(', '))}">${esc(quem)}</b></span>
      <button type="button" class="btn btn-secundario btn-sm" aria-expanded="false" aria-label="Ver detalhes do sorteio de ${esc(nome)}, ${esc(dataCurta(r.data))}" data-conferir-reg>Ver detalhes</button>
    </div>
    <div class="registro-detalhe" hidden></div>
  </li>`;
}
async function detalheRegistro(r: Registro) {
  let ok: boolean | null;
  try { ok = await confere(r); } catch { ok = null; }
  const nome = r.premioInfo ? textoPremio(r.premioInfo) : r.premio || r.titulo;
  if (ok === null) return '<p class="sorteio-msg is-erro">Não deu para conferir agora. Tente de novo em alguns segundos.</p>';
  return `<div class="conferido ${ok ? 'is-ok' : 'is-erro'}">
      <p class="conferido-selo">${ok ? 'Confere. Com a mesma lista e o mesmo código, o sorteio dá este mesmo resultado.' : 'Não confere. Com a lista guardada, o sorteio não dá este resultado.'}</p>
      <dl class="conferido-dados">
        <div><dt>Sorteio</dt><dd>${esc(r.titulo)}</dd></div>
        <div><dt>Prêmio</dt><dd>${esc(nome)}</dd></div>
        <div><dt>${r.ganhadores.length > 1 ? 'Ganhadores' : 'Ganhador'}</dt><dd>${esc(r.ganhadores.join(', '))}</dd></div>
        <div><dt>Data</dt><dd>${esc(dataCurta(r.data))}</dd></div>
        <div><dt>Código</dt><dd class="mono">${esc(r.codigo)}</dd></div>
        <div><dt>Lista</dt><dd class="mono">${esc(r.impressao)}</dd></div>
      </dl>
      ${(r.ausentes ?? []).length ? `<p class="conferido-nota">Não aceitaram a tempo: ${esc(r.ausentes!.join(', '))}.</p>` : ''}
      ${r.refeito ? `<p class="conferido-nota">Este sorteio foi refeito ${r.refeito === 1 ? '1 vez' : `${r.refeito} vezes`} antes deste resultado. Os resultados anteriores ficaram públicos na página do sorteio enquanto ela esteve no ar.</p>` : ''}
      <details class="conferido-lista"><summary>Ver os ${esc(pessoas(r.participantes.length, 'participante', 'participantes'))}</summary><ol>${r.participantes.map((p) => `<li${r.excluidos.includes(p.toLocaleLowerCase('pt-BR')) && !(r.mantidos ?? []).includes(p) ? ' class="is-fora"' : ''}>${esc(p)}</li>`).join('')}</ol></details>
    </div>`;
}

export function ganhadores(raiz: HTMLElement, c: Config) {
  const caixa = raiz.querySelector<HTMLElement>('[data-ganhadores]');
  if (!caixa) return;
  const ul = caixa.querySelector<HTMLUListElement>('[data-registros]')!;
  const vazio = caixa.querySelector<HTMLElement>('[data-ganhadores-vazio]')!;
  const cache = new Map<string, Registro>();
  let carregou = false;

  const carrega = async () => {
    if (carregou) return;
    carregou = true;
    try {
      const rs = (await consulta(c, { from: [{ collectionId: 'registros' }], orderBy: [{ field: { fieldPath: 'data' }, direction: 'DESCENDING' }], limit: 30 })) as unknown as Registro[];
      rs.forEach((r) => cache.set(r.id, r));
      vazio.hidden = rs.length > 0;
      ul.innerHTML = rs.map(linhaRegistro).join('');
    } catch {
      carregou = false;
      vazio.hidden = false;
      vazio.textContent = 'Não deu para carregar os ganhadores agora. Recarregue a página para tentar de novo.';
    } finally { ul.removeAttribute('aria-busy'); }
  };
  carrega();

  ul.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-conferir-reg]');
    if (!b) return;
    const li = b.closest<HTMLElement>('.registro')!;
    const det = li.querySelector<HTMLElement>('.registro-detalhe')!;
    const abrir = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(abrir));
    b.textContent = abrir ? 'Fechar' : 'Ver detalhes';
    b.setAttribute('aria-label', `${abrir ? 'Fechar os detalhes' : 'Ver detalhes'} do sorteio de ${li.querySelector('.registro-premio b')?.textContent ?? ''}`);
    det.hidden = !abrir;
    if (abrir && !det.childElementCount && !li.dataset.carregando) {
      li.dataset.carregando = '1';
      det.setAttribute('aria-live', 'polite');
      det.textContent = 'Conferindo…';
      det.innerHTML = await detalheRegistro(cache.get(li.dataset.id!)!);
      delete li.dataset.carregando;
    }
  });

  // Conferir pelo código
  const form = caixa.querySelector<HTMLFormElement>('[data-conferir]')!;
  const msg = caixa.querySelector<HTMLElement>('[data-conferir-msg]')!;
  const res = caixa.querySelector<HTMLElement>('[data-conferir-res]')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entrada = form.elements.namedItem('codigo') as HTMLInputElement;
    const codigo = limpaCodigo(entrada.value);
    res.replaceChildren();
    if (codigo.replace(/-/g, '').length !== 12) {
      entrada.setAttribute('aria-invalid', 'true');
      msg.textContent = 'O código tem 12 letras e números, como RFMJ-M2RD-QWNK. Ele aparece no resultado e na mensagem copiada para o Discord.';
      msg.className = 'sorteio-msg is-erro';
      entrada.focus();
      return;
    }
    entrada.removeAttribute('aria-invalid');
    msg.textContent = 'Procurando…'; msg.className = 'sorteio-msg';
    try {
      const [r] = (await consulta(c, { from: [{ collectionId: 'registros' }], where: { fieldFilter: { field: { fieldPath: 'codigo' }, op: 'EQUAL', value: { stringValue: codigo } } }, limit: 1 })) as unknown as Registro[];
      if (!r) {
        msg.textContent = 'Nenhum sorteio ao vivo com esse código. Para conferir um sorteio feito nas outras abas, abra a aba dele e use Conferir um sorteio antigo.';
        msg.className = 'sorteio-msg is-erro';
        return;
      }
      msg.textContent = '';
      res.innerHTML = await detalheRegistro(r);
    } catch {
      msg.textContent = 'Não deu para procurar agora. Confira sua internet e tente de novo.';
      msg.className = 'sorteio-msg is-erro';
    }
  });
}

// ---------------------------------------------------------------- formulário: escolher o prêmio
let itemAchado: PremioInfo | null = null;
let iconeAchado: PremioInfo | null = null; // item escolhido só pelo ícone, num prêmio "Outro"

export function iniciarPremio(form: HTMLFormElement) {
  const fs = form.querySelector<HTMLElement>('[data-premio]');
  if (!fs) return;
  const previa = fs.querySelector<HTMLElement>('[data-premio-previa]')!;
  const item = form.elements.namedItem('item') as HTMLInputElement;
  const mostra = (p: PremioInfo | null, aviso = '') => {
    previa.innerHTML = p
      ? `${iconePremio(p, 'm')}<span class="premio-previa-texto"><b>${esc(textoPremio(p))}</b>${p.descricao ? `<span>${esc(p.descricao)}</span>` : ''}</span>`
      : aviso ? `<span class="premio-previa-aviso">${esc(aviso)}</span>` : '';
  };
  const atualiza = () => { lerPremio(form, false).then((p) => mostra(p)).catch((e) => mostra(null, e.message)); };

  fs.querySelectorAll<HTMLInputElement>('input[name="premioTipo"]').forEach((r) => r.addEventListener('change', () => {
    fs.querySelectorAll<HTMLElement>('[data-p]').forEach((x) => { x.hidden = x.dataset.p !== r.value; });
    atualiza();
  }));
  fs.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-p] input:not([name="item"]):not([name="iconeItem"]), [data-p] select').forEach((x) => x.addEventListener('input', atualiza));

  // item do prêmio e item só para o ícone do "Outro": a mesma busca
  ligaBusca(fs.querySelector<HTMLElement>('[data-combo="item"]')!, item, 'item-op', form.querySelector<HTMLElement>('[data-itens-anuncio]'),
    (o) => { itemAchado = o; atualiza(); }, () => { itemAchado = null; mostra(null); });
  const campoIcone = form.elements.namedItem('iconeItem') as HTMLInputElement | null;
  const comboIcone = fs.querySelector<HTMLElement>('[data-combo="icone"]');
  if (campoIcone && comboIcone) ligaBusca(comboIcone, campoIcone, 'icone-op', form.querySelector<HTMLElement>('[data-icones-anuncio]'),
    (o) => { iconeAchado = o; atualiza(); }, () => { iconeAchado = null; atualiza(); });
  const caixaIcone = fs.querySelector<HTMLElement>('[data-icone-item]');
  fs.querySelectorAll<HTMLInputElement>('input[name="iconeOutro"]').forEach((r) => r.addEventListener('change', () => {
    if (caixaIcone) caixaIcone.hidden = r.value !== 'item';
    if (r.value === 'item') campoIcone?.focus();
  }));

  (form.elements.namedItem('qtdItem') as HTMLInputElement).addEventListener('input', atualiza);
}

/** Busca de item no visual da busca do site (sugestões da wiki enquanto digita).
 *  Padrão WAI-ARIA: o foco fica no campo; ↓ ↑ andam (aria-activedescendant), Enter escolhe, Esc fecha. */
function ligaBusca(combo: HTMLElement, campo: HTMLInputElement, prefixo: string, anuncio: HTMLElement | null, aoEscolher: (o: PremioInfo) => void, aoDigitar: () => void) {
  const lista = combo.querySelector<HTMLUListElement>('[role="listbox"]')!;
  const status = combo.querySelector<HTMLElement>('.busca-status')!;
  const diz = (t: string) => { status.textContent = t; if (anuncio) anuncio.textContent = t; };
  let opcoes: PremioInfo[] = [];
  let ativa = -1;
  let pedido: AbortController | null = null;
  let espera = 0;
  const marca = (nome: string, q: string) => {
    const i = nome.toLowerCase().indexOf(q.toLowerCase());
    return i < 0 || !q ? esc(nome) : `${esc(nome.slice(0, i))}<mark>${esc(nome.slice(i, i + q.length))}</mark>${esc(nome.slice(i + q.length))}`;
  };
  const abre = (sim: boolean) => {
    combo.classList.toggle('is-aberta', sim);
    campo.setAttribute('aria-expanded', String(sim && opcoes.length > 0));
    if (!sim) { ativa = -1; campo.removeAttribute('aria-activedescendant'); }
  };
  const pinta = () => {
    const q = campo.value.trim();
    lista.innerHTML = opcoes.map((o, i) => `<li class="busca-item" role="option" id="${prefixo}-${i}" aria-selected="${i === ativa}">${iconePremio(o, 'p')}<span class="busca-item-texto"><span class="busca-titulo">${marca(o.nome, q)}</span><span class="busca-onde">${esc(o.descricao)}</span></span></li>`).join('');
    lista.hidden = opcoes.length === 0;
    if (ativa >= 0) { campo.setAttribute('aria-activedescendant', `${prefixo}-${ativa}`); lista.children[ativa]?.scrollIntoView({ block: 'nearest' }); }
    else campo.removeAttribute('aria-activedescendant');
    campo.setAttribute('aria-expanded', String(combo.classList.contains('is-aberta') && opcoes.length > 0));
  };
  const escolhe = (o: PremioInfo) => { campo.value = o.nome; opcoes = []; pinta(); abre(false); aoEscolher(o); };

  campo.addEventListener('input', () => {
    pedido?.abort();
    aoDigitar();
    clearTimeout(espera);
    const termo = campo.value.trim();
    if (termo.length < 3) { opcoes = []; diz(termo ? 'Digite pelo menos 3 letras.' : ''); pinta(); abre(Boolean(termo)); return; }
    diz('Procurando na wiki do jogo…');
    abre(true);
    espera = window.setTimeout(async () => {
      pedido?.abort();
      pedido = new AbortController();
      try {
        opcoes = await sugestoesComIcone(termo, pedido.signal);
        ativa = -1;
        diz(opcoes.length ? `${opcoes.length} ${opcoes.length === 1 ? 'item encontrado' : 'itens encontrados'}` : `Nenhum item com "${termo}". Confira o nome em inglês, como aparece no jogo.`);
        pinta();
      } catch (e) { if ((e as Error).name !== 'AbortError') { diz('A wiki do jogo não respondeu agora. Tente de novo em alguns minutos ou escolha Outro e escreva o nome do prêmio.'); opcoes = []; pinta(); } }
    }, 250);
  });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && opcoes.length) { e.preventDefault(); abre(true); ativa = Math.min(ativa + 1, opcoes.length - 1); pinta(); }
    else if (e.key === 'ArrowUp' && opcoes.length) { e.preventDefault(); ativa = Math.max(ativa - 1, 0); pinta(); }
    else if (e.key === 'Enter' && combo.classList.contains('is-aberta') && ativa >= 0) { e.preventDefault(); escolhe(opcoes[ativa]); }
    else if (e.key === 'Escape' && combo.classList.contains('is-aberta')) { e.preventDefault(); abre(false); }
  });
  // mousedown não tira o foco do campo; o clique (que no toque só vem sem rolagem) escolhe
  lista.addEventListener('mousedown', (e) => e.preventDefault());
  lista.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (li) escolhe(opcoes[Number(li.id.replace(`${prefixo}-`, ''))]);
  });
  campo.addEventListener('focus', () => { if (opcoes.length) abre(true); });
  // sair do campo só fecha a lista; se o texto é exatamente uma sugestão, escolhe ela (o envio procura o resto)
  campo.addEventListener('blur', () => {
    const igual = opcoes.find((o) => o.nome.toLowerCase() === campo.value.trim().toLowerCase());
    if (igual) escolhe(igual); else abre(false);
  });
  document.addEventListener('pointerdown', (e) => { if (!combo.contains(e.target as Node)) abre(false); });
}

/** Lê o prêmio escolhido. `buscar`: no envio, procura o item se ele ainda não foi achado. Sem prêmio: null. */
export async function lerPremio(form: HTMLFormElement, buscar = true): Promise<PremioInfo | null> {
  const v = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement | null)?.value ?? '').trim();
  const t = (form.querySelector<HTMLInputElement>('input[name="premioTipo"]:checked')?.value ?? 'item') as TipoPremio;
  const qtd = (n: string, max: number) => {
    const q = Number(v(n));
    if (!v(n)) return 0;
    if (!Number.isInteger(q) || q < 1 || q > max) throw new Error(`A quantidade precisa ser um número inteiro de 1 a ${max.toLocaleString('pt-BR')}.`);
    return q;
  };
  if (t === 'item') {
    const nome = v('item');
    if (!nome) return null;
    if (!itemAchado || itemAchado.nome.toLowerCase() !== nome.toLowerCase()) {
      if (!buscar) return null;
      itemAchado = await buscarItem(nome);
    }
    return { ...itemAchado, quantidade: qtd('qtdItem', 250) || 1 };
  }
  if (t === 'gemas') { const q = qtd('qtdGemas', 100000); return q ? premioSimples('gemas', '', q) : null; }
  if (t === 'ouro') { const q = qtd('qtdOuro', 1000000); return q ? premioSimples('ouro', '', q) : null; }
  if (t === 'expansao') return premioSimples('expansao', v('expansao'), 1);
  const nome = v('premioTexto');
  if (!nome) return null;
  const base = premioSimples('texto', nome, 1);
  const escolha = form.querySelector<HTMLInputElement>('input[name="iconeOutro"]:checked')?.value ?? 'presente';
  if (escolha === 'item') {
    const n = v('iconeItem');
    if (!n) return base;
    if (!iconeAchado || iconeAchado.nome.toLowerCase() !== n.toLowerCase()) {
      if (!buscar) return base;
      iconeAchado = await buscarItem(n);
    }
    return { ...base, icone: iconeAchado.icone, raridade: iconeAchado.raridade };
  }
  const ic = iconeOutro(escolha);
  return ic ? { ...base, ...ic } : base;
}
