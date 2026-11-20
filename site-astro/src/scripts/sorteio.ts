// Sorteador (/sorteio.html): as abas que rodam só no navegador, o resultado, a roleta e o histórico.
// O sorteio ao vivo tem duas partes: sorteio-vivo.ts (leve: cards, ganhadores, conferir, prêmio; lê o banco pela API REST)
// e sorteio-online.ts (Firebase completo: só é baixado quando alguém abre um sorteio ?s= ou mexe no formulário da aba Ao vivo).
import { gerador, novoCodigo, limpaCodigo, numeros, comPeso, impressao, inteiro, formata } from '../lib/sorteio/aleatorio';
import { lerLista, lerItens, textoDeArquivo, type Participante } from '../lib/sorteio/contas';
import { guildasLideradas, membros, type Membro } from '../lib/sorteio/gw2';
import { Roleta, corCss, type CoresRoleta } from '../lib/sorteio/roleta';
import type { GrupoConteudo } from '../lib/sorteio/conteudo';
import { aoVivo, iniciarPremio } from './sorteio-vivo';

// ---------------------------------------------------------------- utilidades
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const quando = (d = new Date()) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const campo = <T extends HTMLElement = HTMLInputElement>(f: HTMLFormElement, nome: string) => f.elements.namedItem(nome) as T | null;
const valor = (f: HTMLFormElement, nome: string) => (campo<HTMLInputElement>(f, nome)?.value ?? '').trim();
const marcado = (f: HTMLFormElement, nome: string) => Boolean(campo<HTMLInputElement>(f, nome)?.checked);
const ordinal = (i: number) => `${i}º`;

function erro(f: HTMLFormElement, texto: string, nome?: string) {
  const m = f.querySelector<HTMLElement>('[data-msg]');
  if (m) { m.textContent = texto; m.classList.toggle('is-erro', Boolean(texto)); }
  f.querySelectorAll('[aria-invalid="true"]:not([data-contagem-alvo])').forEach((c) => c.removeAttribute('aria-invalid'));
  const c = nome ? campo<HTMLInputElement>(f, nome) : null;
  if (c && texto) { c.setAttribute('aria-invalid', 'true'); c.focus(); }
}

/** Frase curta para o leitor de tela (o cartão inteiro fica fora da região que anuncia). */
export function anuncia(texto: string) {
  const a = document.querySelector<HTMLElement>('[data-anuncio]');
  if (!a) return;
  a.textContent = '';
  requestAnimationFrame(() => (a.textContent = texto));
}

/** Código do formulário (colado na caixa "Conferir") ou um novo. */
function codigoDe(f: HTMLFormElement) {
  const v = valor(f, 'codigo');
  return { codigo: v ? limpaCodigo(v) : novoCodigo(), conferindo: Boolean(v) };
}

// ---------------------------------------------------------------- resultado e histórico
export interface Resultado {
  modo: string;         // nome da aba (vai para o histórico)
  html: string;         // corpo do resultado
  discord: string;      // texto para copiar
  resumo: string;       // uma linha para o histórico
  codigo: string;
  impressao?: string;   // impressão digital da lista
  conferindo?: boolean;
}

const HIST = 'divine-sorteios';
const lerHist = (): (Pick<Resultado, 'modo' | 'resumo' | 'codigo' | 'impressao'> & { em: string })[] => {
  try { return JSON.parse(localStorage.getItem(HIST) || '[]'); } catch { return []; }
};
function salvaHist(r: Resultado) {
  try {
    const h = [{ modo: r.modo, resumo: r.resumo, codigo: r.codigo, impressao: r.impressao, em: new Date().toISOString() }, ...lerHist()].slice(0, 20);
    localStorage.setItem(HIST, JSON.stringify(h));
  } catch { /* sem armazenamento: o histórico só não aparece */ }
  mostraHist();
}
function mostraHist() {
  const lista = document.querySelector<HTMLOListElement>('[data-historico]');
  if (!lista) return;
  const h = lerHist();
  lista.innerHTML = h.map((x) => `<li><span class="historico-quando">${esc(quando(new Date(x.em)))}</span><span class="historico-texto">${esc(x.resumo)}<small>${esc(x.modo)} · código <b>${esc(x.codigo)}</b>${x.impressao ? ` · lista <b>${esc(x.impressao)}</b>` : ''}</small></span></li>`).join('');
  document.querySelector<HTMLElement>('[data-historico-vazio]')!.hidden = h.length > 0;
  document.querySelector<HTMLElement>('[data-historico-limpar]')!.hidden = h.length === 0;
}

/** Monta o cartão de resultado (título, corpo, código, botões) e devolve o elemento. */
export function cartao(r: Resultado, deNovo?: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'resultado';
  el.innerHTML = `
    <h3 class="resultado-titulo" tabindex="-1">${r.conferindo ? 'Resultado conferido' : 'Resultado'}</h3>
    ${r.html}
    <p class="resultado-meta"><span>Código <b>${esc(r.codigo)}</b></span>${r.impressao ? `<span>Lista <b>${esc(r.impressao)}</b></span>` : ''}<span>${esc(quando())}</span></p>
    <div class="resultado-acoes">
      <button type="button" class="btn btn-secundario btn-sm" data-copiar>Copiar para o Discord</button>
      ${deNovo ? '<button type="button" class="btn btn-fantasma btn-sm" data-de-novo>Sortear de novo</button>' : ''}
    </div>`;
  const copiar = el.querySelector<HTMLButtonElement>('[data-copiar]')!;
  copiar.addEventListener('click', async () => {
    const texto = `${r.discord}\nCódigo: ${r.codigo}${r.impressao ? ` · lista ${r.impressao}` : ''}\nConfira em ${location.origin}/sorteio.html`;
    try { await navigator.clipboard.writeText(texto); copiar.textContent = 'Copiado'; }
    catch { copiar.textContent = 'Não deu para copiar'; }
    setTimeout(() => (copiar.textContent = 'Copiar para o Discord'), 2000);
  });
  el.querySelector('[data-de-novo]')?.addEventListener('click', () => deNovo?.());
  return el;
}

function mostra(f: HTMLFormElement, r: Resultado, deNovo: () => void, adiar = false) {
  const alvo = f.closest('[data-bloco], [data-aba]')!.querySelector<HTMLElement>('[data-resultado]')!;
  alvo.replaceChildren(cartao(r, deNovo));
  salvaHist(r);
  if (!adiar) focaResultado(alvo, r);
  alvo.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'nearest' });
  return alvo;
}

function focaResultado(alvo: HTMLElement, r: Resultado) {
  alvo.querySelector<HTMLElement>('.resultado-titulo')?.focus({ preventScroll: true });
  anuncia(`Resultado: ${r.resumo}. Código ${r.codigo}.`);
}

/** Lista numerada de nomes (1º, 2º...), com extra opcional à direita. */
export const listaHtml = (itens: { nome: string; extra?: string; pos?: string }[], oculto = false) =>
  `<ol class="resultado-lista">${itens.map((x, i) => `<li${oculto ? ' class="is-oculto"' : ''}><span class="resultado-pos">${esc(x.pos ?? ordinal(i + 1))}</span><span class="resultado-nome">${x.nome}</span>${x.extra ? `<span class="resultado-extra">${x.extra}</span>` : ''}</li>`).join('')}</ol>`;

const ordenada = (ps: Participante[]) => [...ps].sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));
export const impressaoDe = (ps: Participante[], peso = false) => impressao(ordenada(ps).map((p) => (peso ? `${p.chave}*${p.bilhetes}` : p.chave)).join('\n'));

function errosDaLista(f: HTMLFormElement, erros: { linha: number; texto: string }[]) {
  const ex = erros.slice(0, 3).map((e) => `linha ${e.linha} ("${e.texto}")`).join(', ');
  erro(f, `${erros.length === 1 ? 'Esta linha não parece' : `${erros.length} linhas não parecem`} conta do jogo: ${ex}${erros.length > 3 ? '…' : ''}. Corrija para o formato Nome.1234 ou desmarque "Aceitar só contas do jogo".`, 'lista');
}

// ---------------------------------------------------------------- roleta (src/lib/sorteio/roleta.ts)
const cv = (v: string) => corCss(`var(${v})`);
export const coresSite = (): CoresRoleta => ({
  fundos: ['--navy-700', '--gold-400', '--navy-600', '--gold-200'].map(cv),
  tintas: ['--ink-0', '--ink-950', '--ink-0', '--ink-950'].map(cv),
  linha: cv('--surface'),
  fonte: '"Mona Sans", sans-serif',
});

// ---------------------------------------------------------------- abas
function iniciar(raiz: HTMLElement) {
  // texto de ajuda dentro do <label>: sai do nome do campo e vira a descrição dele
  raiz.querySelectorAll<HTMLElement>('label.campo .campo-ajuda, label.opcao .opcao-ajuda').forEach((ajuda, i) => {
    const c = ajuda.closest('label')!.querySelector('input, textarea, select');
    if (!c) return;
    ajuda.id ||= `ajuda-${i}`;
    ajuda.setAttribute('aria-hidden', 'true');
    c.setAttribute('aria-describedby', ajuda.id);
  });
  mostraHist();
  raiz.querySelector('[data-historico-limpar]')?.addEventListener('click', () => {
    try { localStorage.removeItem(HIST); } catch { /* nada */ }
    mostraHist();
  });

  const forms = new Map<string, HTMLFormElement>();
  raiz.querySelectorAll<HTMLFormElement>('form[data-modo]').forEach((f) => forms.set(f.dataset.modo!, f));
  const acoes: Record<string, (f: HTMLFormElement) => Promise<void>> = { numeros: sorteiaNumeros, lista: sorteiaLista, premios: sorteiaPremios, squads: sorteiaSquads, conteudo: sorteiaConteudo, dados: rolaDados, moeda: jogaMoeda };
  let ocupado = false;
  forms.forEach((f, modo) => {
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (ocupado) return;
      erro(f, '');
      ocupado = true;
      const botao = f.querySelector<HTMLButtonElement>('button[type="submit"]');
      botao?.setAttribute('aria-disabled', 'true');
      try { await acoes[f.dataset.modo ?? modo]?.(f); }
      catch (err) { erro(f, err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.'); }
      finally { ocupado = false; botao?.removeAttribute('aria-disabled'); }
    });
  });

  // "Usar a lista da aba Lista de contas"
  const listaPrincipal = forms.get('lista') && campo<HTMLTextAreaElement>(forms.get('lista')!, 'lista');
  raiz.querySelectorAll<HTMLButtonElement>('[data-copiar-lista]').forEach((b) => b.addEventListener('click', () => {
    const f = b.closest('form')!;
    const alvo = campo<HTMLTextAreaElement>(f, 'lista')!;
    if (!listaPrincipal?.value.trim()) { erro(f, 'A aba Lista de contas está vazia. Cole os nomes lá primeiro, ou direto aqui.'); return; }
    alvo.value = listaPrincipal.value;
    erro(f, '');
    alvo.focus();
  }));

  const fl = forms.get('lista');
  if (fl) {
    iniciarLista(fl);
    // uma lista só: "Sortear vencedores" (modo lista) ou "Distribuir prêmios" (modo premios)
    const rotulo = fl.querySelector<HTMLElement>('[data-sortear-lista] span')!;
    fl.querySelectorAll<HTMLInputElement>('input[name="usoLista"]').forEach((r) => r.addEventListener('change', () => {
      fl.dataset.modo = r.value;
      fl.querySelectorAll<HTMLElement>('[data-uso]').forEach((g) => { g.hidden = g.dataset.uso !== r.value; });
      rotulo.textContent = r.value === 'premios' ? 'Distribuir os prêmios' : 'Sortear da lista';
      erro(fl, '');
      fl.closest('[data-aba]')!.querySelector<HTMLElement>('[data-resultado]')!.replaceChildren();
      fl.closest('[data-aba]')!.querySelector<HTMLElement>('[data-roleta]')!.hidden = true;
    }));
  }

  // sorteio ao vivo: o Firebase (pesado) só é baixado quando alguém abre um sorteio ou a aba "Ao vivo"
  const config = raiz.dataset.firebase;
  const sid = new URLSearchParams(location.search).get('s');
  const painel = raiz.querySelector<HTMLElement>('[data-online]');
  const abaOnline = painel?.closest<HTMLElement>('[data-aba]');
  const tabOnline = abaOnline ? document.getElementById(abaOnline.getAttribute('aria-labelledby') ?? '') : null;
  if (sid) {
    const bloco = raiz.querySelector<HTMLElement>('[data-inscricao]')!;
    bloco.hidden = false;
    // na página de um sorteio, só ele: a faixa do topo, as ferramentas e o histórico saem
    raiz.querySelectorAll<HTMLElement>('[data-ao-vivo], .sorteio-faca-topo, .sorteio-abas, .historico').forEach((x) => { x.hidden = true; });
    // o nome do sorteio sobe para o topo com a arte (é o h1 da página e o que aparece na live); o topo fica mais baixo
    const topo = document.querySelector<HTMLElement>('.sorteio-topo');
    const h2 = bloco.querySelector<HTMLElement>('[data-i-titulo]');
    const h1 = topo?.querySelector('h1');
    if (topo && h1 && h2) {
      topo.classList.add('is-sala');
      topo.querySelector('p')?.remove();
      h1.id = h2.id; h1.setAttribute('data-i-titulo', ''); h1.textContent = h2.textContent;
      h2.remove();
    }
    // erro: o estado vira alert (o leitor de tela lê na hora) e a seção deixa de estar "carregando"
    const falha = (tituloTxt: string, estadoTxt: string) => {
      const est = raiz.querySelector<HTMLElement>('[data-i-estado]')!;
      est.setAttribute('role', 'alert');
      document.querySelector('[data-i-titulo]')!.textContent = tituloTxt;
      est.textContent = estadoTxt;
      bloco.removeAttribute('aria-busy');
    };
    if (!config) {
      falha('Este link de sorteio não funciona aqui', 'O sorteio ao vivo ainda não está ligado no site. Peça um link novo para quem organizou.');
    } else import('./sorteio-online').then((m) => m.sala(JSON.parse(config), sid, bloco)).catch(() => {
      falha('Não deu para carregar este sorteio', 'Recarregue a página. Se continuar assim, peça um link novo para quem organizou o sorteio.');
    });
  } else if (config) aoVivo(raiz, JSON.parse(config));
  if (config && painel && tabOnline) {
    let carregando: Promise<boolean> | null = null;
    let pronto = false;
    const carrega = () => (carregando ??= import('./sorteio-online')
      .then((m) => { m.painel(JSON.parse(config), painel); pronto = true; return true; })
      .catch(() => { carregando = null; erro(painel.querySelector('form')!, 'Não deu para carregar o sorteio ao vivo. Recarregue a página e tente de novo.'); return false; }));
    // o formulário nunca vai pelo navegador: se o Firebase ainda está carregando, espera e envia de novo
    const novo = painel.querySelector<HTMLFormElement>('form[data-novo]');
    novo?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!pronto) carrega().then((ok) => { if (ok) novo.requestSubmit(); });
    });
    tabOnline.addEventListener('click', carrega);
    tabOnline.addEventListener('focus', carrega);
    // Ao vivo é a primeira aba: carrega o Firebase quando a pessoa mexe no formulário
    painel.addEventListener('focusin', carrega);
    if (location.hash === '#ao-vivo' || location.hash === '#organizar') { tabOnline.click(); }
  }
  if (config) {
    const novo = raiz.querySelector<HTMLFormElement>('form[data-novo]');
    if (novo) iniciarPremio(novo);
  }
}

// ---------------------------------------------------------------- Números
async function sorteiaNumeros(f: HTMLFormElement) {
  const min = inteiro(valor(f, 'min')), max = inteiro(valor(f, 'max'));
  const qtd = Number(valor(f, 'qtd') || '1');
  const repetir = marcado(f, 'repetir');
  if (min === null || max === null) return erro(f, 'Use só números inteiros em "De" e "Até" (pode ter sinal de menos, como -10).', min === null ? 'min' : 'max');
  if (max < min) return erro(f, 'O "Até" precisa ser maior ou igual ao "De".', 'max');
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 10000) return erro(f, 'Em "Quantos números", escolha de 1 a 10.000.', 'qtd');
  const tamanho = max - min + 1n;
  if (!repetir && BigInt(qtd) > tamanho) return erro(f, `A faixa só tem ${formata(tamanho)} números. Peça menos números ou marque "Um número pode sair mais de uma vez".`, 'qtd');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, 'numeros');
  let saiu = numeros(g, min, max, qtd, repetir);
  if (marcado(f, 'ordenar')) saiu = [...saiu].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const faixa = `${formata(min)} a ${formata(max)}`;
  const html = qtd === 1
    ? `<p class="resultado-grande">${formata(saiu[0])}</p><p class="resultado-sub">Sorteado de ${faixa}</p>`
    : `<ol class="resultado-numeros">${saiu.map((n) => `<li>${formata(n)}</li>`).join('')}</ol><p class="resultado-sub">${qtd} números de ${faixa}${repetir ? ', podendo repetir' : ''}</p>`;
  const lista = saiu.map(formata).join(', ');
  mostra(f, { modo: 'Números', html, codigo, conferindo, discord: `**Sorteio DIVINE** · números de ${faixa}\n${lista}`, resumo: qtd === 1 ? `Saiu ${formata(saiu[0])} (de ${faixa})` : `${qtd} números de ${faixa}: ${lista.slice(0, 80)}${lista.length > 80 ? '…' : ''}` }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

// ---------------------------------------------------------------- Lista de contas
function iniciarLista(f: HTMLFormElement) {
  const ta = campo<HTMLTextAreaElement>(f, 'lista')!;
  const cont = f.querySelector<HTMLElement>('[data-contagem]')!;
  let timer = 0;
  const conta = () => {
    const l = lerLista(ta.value, { soGw2: marcado(f, 'soGw2'), peso: marcado(f, 'peso') });
    const n = l.validos.length;
    const partes = [n ? `${n} ${n === 1 ? 'participante' : 'participantes'}` : 'Nenhum participante ainda'];
    if (marcado(f, 'peso') && n) partes.push(`${l.validos.reduce((s, p) => s + p.bilhetes, 0)} bilhetes`);
    if (l.repetidos.length) partes.push(`${l.repetidos.length} ${l.repetidos.length === 1 ? 'repetido tirado' : 'repetidos tirados'}`);
    if (l.erros.length) partes.push(`${l.erros.length} ${l.erros.length === 1 ? 'linha não é conta do jogo' : 'linhas não são conta do jogo'} (${l.erros.slice(0, 3).map((e) => `linha ${e.linha}`).join(', ')}${l.erros.length > 3 ? '…' : ''})`);
    cont.textContent = `${partes.join(' · ')}.`;
    ta.setAttribute('aria-invalid', String(l.erros.length > 0));
    ta.toggleAttribute('data-contagem-alvo', l.erros.length > 0);
  };
  ta.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(conta, 400); });
  f.querySelectorAll('input[name="soGw2"], input[name="peso"]').forEach((c) => c.addEventListener('change', conta));
  f.querySelector('[data-limpar]')!.addEventListener('click', () => { ta.value = ''; conta(); ta.focus(); });
  const arq = campo<HTMLInputElement>(f, 'arquivo')!;
  arq.addEventListener('change', async () => {
    const file = arq.files?.[0];
    if (!file) return;
    const texto = textoDeArquivo(file.name, await file.text());
    if (/ x\d+$/m.test(texto)) campo<HTMLInputElement>(f, 'peso')!.checked = true;
    ta.value = ta.value.trim() ? `${ta.value.trim()}\n${texto}` : texto;
    arq.value = '';
    conta();
  });
  conta();

  // API do jogo: membros da guilda
  const msg = f.querySelector<HTMLElement>('[data-api-msg]')!;
  const filtros = f.querySelector<HTMLElement>('[data-api-filtros]')!;
  const sel = campo<HTMLSelectElement>(f, 'guilda')!;
  const ranks = f.querySelector<HTMLElement>('[data-api-ranks]')!;
  let lista: Membro[] = [];
  const avisa = (t: string, tipo: '' | 'erro' | 'ok' = '') => { msg.textContent = t; msg.className = `sorteio-msg${tipo ? ` is-${tipo}` : ''}`; };
  const carregaMembros = async () => {
    avisa('Buscando os membros…');
    lista = await membros(valor(f, 'chave'), sel.value);
    const nomes = [...new Set(lista.map((m) => m.rank))];
    ranks.innerHTML = nomes.map((r) => `<label class="opcao"><input type="checkbox" name="rank" value="${esc(r)}" checked /><span>${esc(r)} <span class="opcao-n">(${lista.filter((m) => m.rank === r).length})</span></span></label>`).join('');
    avisa(`${lista.length} membros encontrados. Escolha os ranks e clique em "Colocar os membros na lista".`, 'ok');
  };
  f.querySelector('[data-api-buscar]')!.addEventListener('click', async () => {
    if (!valor(f, 'chave')) return avisa('Cole a chave de API primeiro.', 'erro');
    try {
      avisa('Conferindo a chave…');
      const gs = await guildasLideradas(valor(f, 'chave'));
      if (!gs.length) { filtros.hidden = true; return avisa('Essa conta não é líder de nenhuma guilda. A API do jogo só mostra os membros para quem é líder.', 'erro'); }
      sel.innerHTML = gs.map((g) => `<option value="${esc(g.id)}">${esc(g.nome)} [${esc(g.tag)}]</option>`).join('');
      filtros.hidden = false;
      await carregaMembros();
    } catch (e) { avisa(e instanceof Error ? e.message : 'Não deu para falar com a API do jogo.', 'erro'); }
  });
  sel.addEventListener('change', () => carregaMembros().catch((e) => avisa(e.message, 'erro')));
  f.querySelector('[data-api-colocar]')!.addEventListener('click', () => {
    const ok = new Set([...ranks.querySelectorAll<HTMLInputElement>('input:checked')].map((c) => c.value));
    const ate = valor(f, 'ate');
    const limite = ate ? new Date(`${ate}T23:59:59`) : null;
    const nomes = lista.filter((m) => ok.has(m.rank) && (!limite || !m.entrou || new Date(m.entrou) <= limite)).map((m) => m.nome);
    if (!nomes.length) return avisa('Nenhum membro passou nos filtros. Marque mais ranks ou mude a data.', 'erro');
    ta.value = nomes.join('\n');
    conta();
    avisa(`${nomes.length} membros colocados na lista.`, 'ok');
  });
}

async function sorteiaLista(f: HTMLFormElement) {
  const peso = marcado(f, 'peso');
  const l = lerLista(valor(f, 'lista'), { soGw2: marcado(f, 'soGw2'), peso });
  if (l.erros.length) return errosDaLista(f, l.erros);
  const ps = ordenada(l.validos);
  if (ps.length < 2) return erro(f, 'Coloque pelo menos 2 participantes na lista.', 'lista');
  const ordem = marcado(f, 'ordem');
  const venc = Number(valor(f, 'vencedores') || '1'), res = Number(valor(f, 'reservas') || '0');
  if (!ordem && (!Number.isInteger(venc) || venc < 1)) return erro(f, 'Em "Vencedores", ponha 1 ou mais.', 'vencedores');
  if (!ordem && (!Number.isInteger(res) || res < 0)) return erro(f, 'Em "Reservas", ponha 0 ou mais.', 'reservas');
  const qtd = ordem ? ps.length : venc + res;
  if (qtd > ps.length) return erro(f, `A lista tem ${ps.length} participantes, e você pediu ${venc} ${venc === 1 ? 'vencedor' : 'vencedores'}${res ? ` e ${res} ${res === 1 ? 'reserva' : 'reservas'}` : ''}. Diminua o número ou ponha mais gente na lista.`, 'vencedores');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, 'lista');
  const saiu = peso ? comPeso(g, ps, qtd) : g.embaralha(ps).slice(0, qtd);
  const imp = await impressaoDe(ps, peso);
  const revelar = (f.querySelector<HTMLInputElement>('input[name="revelar"]:checked')?.value ?? 'hora') as 'hora' | 'um' | 'roleta';
  const rotulo = (i: number) => (ordem ? ordinal(i + 1) : i < venc ? ordinal(i + 1) : `R${i - venc + 1}`);
  const itens = saiu.map((p, i) => ({ nome: esc(p.nome), pos: rotulo(i), extra: peso ? `${p.bilhetes} ${p.bilhetes === 1 ? 'bilhete' : 'bilhetes'}` : undefined }));
  const html = `${listaHtml(itens, revelar !== 'hora')}<p class="resultado-sub">${ps.length} participantes${res && !ordem ? ` · R = reserva` : ''}</p>`;
  const discord = `**Sorteio DIVINE** · ${ps.length} participantes\n${saiu.map((p, i) => `${rotulo(i)} ${p.nome}`).join('\n')}`;
  const resumo = ordem ? `Ordem de ${ps.length} pessoas: ${saiu.slice(0, 3).map((p) => p.nome).join(', ')}…` : `${saiu.slice(0, venc).map((p) => p.nome).join(', ')} (de ${ps.length})`;
  const caixa = f.closest('[data-bloco], [data-aba]')!.querySelector<HTMLElement>('[data-roleta]')!;
  caixa.hidden = revelar !== 'roleta';
  const dadosRes: Resultado = { modo: 'Lista de contas', html, discord, resumo, codigo, impressao: imp, conferindo };
  const alvo = mostra(f, dadosRes, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); }, revelar !== 'hora');
  if (revelar === 'hora') return;
  const lis = [...alvo.querySelectorAll<HTMLLIElement>('.resultado-lista li')];
  const aparece = (li: HTMLLIElement) => { li.classList.remove('is-oculto'); li.classList.add('is-entrando'); };
  if (revelar === 'um') {
    for (const li of lis) { aparece(li); if (!reduzido()) await espera(900); }
    return focaResultado(alvo, dadosRes);
  }
  // roleta: gira uma vez por nome, tirando quem já saiu
  const roleta = new Roleta(caixa.querySelector('canvas')!, coresSite);
  const resto = [...ps];
  caixa.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'center' });
  for (let i = 0; i < saiu.length; i++) {
    roleta.itens = resto.map((p) => ({ nome: p.nome, peso: peso ? p.bilhetes : 1 }));
    roleta.desenha();
    const idx = resto.indexOf(saiu[i]);
    await roleta.gira(idx, (g.u32() % 1000) / 1000, i === 0 ? 4200 : saiu.length > 5 ? 1400 : 2600);
    aparece(lis[i]);
    resto.splice(idx, 1);
    if (!reduzido()) await espera(500);
  }
  focaResultado(alvo, dadosRes);
}

// ---------------------------------------------------------------- Prêmios
async function sorteiaPremios(f: HTMLFormElement) {
  const premios = lerItens(valor(f, 'premios'));
  const l = lerLista(valor(f, 'lista'), { soGw2: marcado(f, 'soGw2') });
  if (l.erros.length) return errosDaLista(f, l.erros);
  const ps = ordenada(l.validos);
  const repetir = marcado(f, 'repetir');
  if (!premios.length) return erro(f, 'Escreva pelo menos um prêmio, um por linha.', 'premios');
  if (!ps.length) return erro(f, 'Coloque pelo menos uma pessoa em "Participantes".', 'lista');
  if (!repetir && premios.length > ps.length) return erro(f, `São ${premios.length} prêmios para ${ps.length} ${ps.length === 1 ? 'pessoa' : 'pessoas'}. Ponha mais gente, tire prêmios ou marque "Uma pessoa pode levar mais de um prêmio".`);
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, 'premios');
  const ordem = g.embaralha(ps);
  const quem = premios.map((_, i) => (repetir ? ps[g.indice(ps.length)] : ordem[i]));
  const imp = await impressao(`${ordenada(ps).map((p) => p.chave).join('\n')}\n--\n${premios.join('\n')}`);
  const html = listaHtml(premios.map((p, i) => ({ nome: esc(quem[i].nome), extra: esc(p), pos: `${i + 1}` })));
  mostra(f, { modo: 'Prêmios', html, codigo, impressao: imp, conferindo, discord: `**Sorteio DIVINE** · prêmios\n${premios.map((p, i) => `${p}: ${quem[i].nome}`).join('\n')}`, resumo: premios.slice(0, 3).map((p, i) => `${p}: ${quem[i].nome}`).join(' · ') + (premios.length > 3 ? '…' : '') }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

// ---------------------------------------------------------------- Squads
async function sorteiaSquads(f: HTMLFormElement) {
  const l = lerLista(valor(f, 'lista'), { soGw2: marcado(f, 'soGw2'), funcao: true });
  if (l.erros.length) return errosDaLista(f, l.erros);
  const ps = ordenada(l.validos);
  const n = Number(valor(f, 'n') || '5');
  if (!Number.isInteger(n) || n < 1) return erro(f, 'Em "Quantidade", ponha 1 ou mais.', 'n');
  if (ps.length < 2) return erro(f, 'Coloque pelo menos 2 participantes.', 'lista');
  const qtdGrupos = valor(f, 'por') === 'grupos' ? n : Math.ceil(ps.length / n);
  if (qtdGrupos > ps.length) return erro(f, `São ${ps.length} pessoas: dá para fazer no máximo ${ps.length} grupos.`, 'n');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, 'squads');
  let fila: Participante[];
  if (marcado(f, 'equilibrar')) {
    // cada função embaralhada à parte; as funções com mais gente são distribuídas primeiro
    const porFuncao = new Map<string, Participante[]>();
    for (const p of ps) { const k = (p.funcao ?? '').toLocaleLowerCase('pt-BR'); porFuncao.set(k, [...(porFuncao.get(k) ?? []), p]); }
    fila = [...porFuncao.entries()].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1)).flatMap(([, v]) => g.embaralha(v));
  } else fila = g.embaralha(ps);
  const grupos: Participante[][] = Array.from({ length: qtdGrupos }, () => []);
  let vez = 0;
  for (const p of fila) {
    // vai para o grupo com menos gente; no empate, revezando
    const menor = Math.min(...grupos.map((x) => x.length));
    while (grupos[vez % qtdGrupos].length !== menor) vez++;
    grupos[vez % qtdGrupos].push(p);
    vez++;
  }
  const html = `<div class="resultado-grupos">${grupos.map((gr, i) => `<section><h3>Grupo ${i + 1} <small>(${gr.length})</small></h3><ol>${gr.map((p) => `<li>${esc(p.nome)}${p.funcao ? ` <small>${esc(p.funcao)}</small>` : ''}</li>`).join('')}</ol></section>`).join('')}</div>`;
  const imp = await impressao(ordenada(ps).map((p) => `${p.chave}-${p.funcao ?? ''}`).join('\n'));
  mostra(f, { modo: 'Squads', html, codigo, impressao: imp, conferindo, discord: `**Sorteio DIVINE** · ${qtdGrupos} grupos\n${grupos.map((gr, i) => `**Grupo ${i + 1}:** ${gr.map((p) => p.nome + (p.funcao ? ` (${p.funcao})` : '')).join(', ')}`).join('\n')}`, resumo: `${ps.length} pessoas em ${qtdGrupos} grupos` }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

// ---------------------------------------------------------------- O que jogar
async function sorteiaConteudo(f: HTMLFormElement) {
  const dados: GrupoConteudo[] = JSON.parse(f.closest('[data-aba]')!.querySelector('[data-conteudo]')!.textContent || '[]');
  const escolhidos = new Set([...f.querySelectorAll<HTMLInputElement>('input[name="grupo"]:checked')].map((c) => c.value));
  const pool = dados.filter((d) => escolhidos.has(d.id)).flatMap((d) => d.itens);
  const qtd = Number(valor(f, 'qtd') || '1');
  if (!pool.length) return erro(f, 'Marque pelo menos uma opção em "Sortear entre".');
  if (!Number.isInteger(qtd) || qtd < 1) return erro(f, 'Em "Quantos", ponha 1 ou mais.', 'qtd');
  if (qtd > pool.length) return erro(f, `Só tem ${pool.length} opções nos tipos marcados. Peça menos ou marque mais tipos.`, 'qtd');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, `conteudo|${[...escolhidos].sort().join(',')}`);
  const saiu = g.embaralha(pool).slice(0, qtd);
  const html = listaHtml(saiu.map((x) => ({ nome: `<a href="${esc(x.h)}">${esc(x.t)}</a>`, extra: esc(x.onde) })));
  mostra(f, { modo: 'O que jogar', html, codigo, conferindo, discord: `**Sorteio DIVINE** · o que vamos fazer\n${saiu.map((x, i) => `${ordinal(i + 1)} ${x.t} (${x.onde})`).join('\n')}`, resumo: saiu.map((x) => x.t).join(', ') }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

// ---------------------------------------------------------------- Dados e moeda
async function rolaDados(f: HTMLFormElement) {
  const qtd = Number(valor(f, 'qtd') || '1'), lados = Number(valor(f, 'lados') || '20'), mod = Number(valor(f, 'mod') || '0');
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 100) return erro(f, 'Em "Dados", escolha de 1 a 100.', 'qtd');
  if (!Number.isInteger(mod)) return erro(f, 'Em "Somar", use um número inteiro (pode ser negativo).', 'mod');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, `dados|${lados}`);
  const rol = Array.from({ length: qtd }, () => Number(g.entre(1n, BigInt(lados))));
  const total = rol.reduce((s, x) => s + x, 0) + mod;
  const nome = `${qtd}d${lados}${mod ? (mod > 0 ? `+${mod}` : mod) : ''}`;
  const html = `<p class="resultado-grande">${total}</p><p class="resultado-sub">${nome}${qtd > 1 || mod ? `: ${rol.join(' + ')}${mod ? ` ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}` : ''}` : ''}</p>`;
  mostra(f, { modo: 'Dados', html, codigo, conferindo, discord: `**Sorteio DIVINE** · ${nome}\nTotal: ${total}${qtd > 1 ? ` (${rol.join(', ')})` : ''}`, resumo: `${nome}: ${total}` }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

async function jogaMoeda(f: HTMLFormElement) {
  const qtd = Number(valor(f, 'qtd') || '1');
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 1000) return erro(f, 'Em "Quantas vezes", escolha de 1 a 1.000.', 'qtd');
  const { codigo, conferindo } = codigoDe(f);
  const g = await gerador(codigo, 'moeda');
  const lados = Array.from({ length: qtd }, () => (g.indice(2) ? 'Coroa' : 'Cara'));
  const caras = lados.filter((x) => x === 'Cara').length;
  const html = qtd === 1
    ? `<p class="resultado-grande">${lados[0]}</p>`
    : `<p class="resultado-grande">${caras} × ${qtd - caras}</p><p class="resultado-sub">${caras} cara, ${qtd - caras} coroa</p>${qtd <= 60 ? `<ol class="resultado-numeros">${lados.map((x) => `<li>${x}</li>`).join('')}</ol>` : ''}`;
  mostra(f, { modo: 'Cara ou coroa', html, codigo, conferindo, discord: `**Sorteio DIVINE** · cara ou coroa\n${qtd === 1 ? lados[0] : `${caras} cara, ${qtd - caras} coroa`}`, resumo: qtd === 1 ? lados[0] : `${qtd} jogadas: ${caras} cara, ${qtd - caras} coroa` }, () => { campo<HTMLInputElement>(f, 'codigo')!.value = ''; f.requestSubmit(); });
}

// início: no fim do arquivo, depois de todas as constantes acima existirem
const raiz = document.querySelector<HTMLElement>('[data-sorteio]');
if (raiz && !raiz.dataset.pronto) { raiz.dataset.pronto = '1'; iniciar(raiz); }
