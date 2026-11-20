// Sorteio ao vivo, com Firebase (Firestore + login anônimo, invisível). Só é baixado quando alguém abre um sorteio
// (/sorteio.html?s=<id>) ou a aba "Ao vivo". A lista "Sorteios ao vivo" do topo NÃO usa este arquivo: ela lê pela API
// REST do Firestore em sorteio.ts, para a página continuar leve.
// Dados (regras em site-astro/firebase/firestore.rules):
//   donos/{uid}                         ultimo: quando este aparelho abriu o último sorteio (1 por minuto)
//   sorteios/{id}                       titulo, premio, descricao, vencedores, dono, criadoEm, fechaEm, aberto, resultado, expiraEm
//   sorteios/{id}/inscritos/{chave}     conta (Nome.1234), em, uid, expiraEm. Chave = conta em minúsculas: uma por conta.
//   sorteios/{id}/aparelhos/{uid}       chave: a marca de "este aparelho já se inscreveu" (uma inscrição por aparelho)
//   sorteios/{id}/privado/chave         token do link de organizador (só organizador lê)
//   sorteios/{id}/organizadores/{uid}   quem abriu o link de organizador em outro navegador/aparelho
// O dono é o aparelho que abriu o sorteio (uid anônimo). Ele e quem abrir o link de organizador
// (/sorteio.html?s=<id>&org=<token>) veem os controles na própria página do sorteio.
// Transparência: "sortear de novo" guarda o resultado anterior em historico, e tirar alguém põe o nome em tirados.
// As duas listas são públicas e só crescem (as regras do banco não deixam apagar).
// Modo rigoroso (google: true): para se inscrever, a pessoa liga a conta Google; vale uma inscrição por conta Google.
// O resultado guarda o código e quem ficou de fora (filtro da guilda): com a lista pública, qualquer um refaz e confere.
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, limit, arrayUnion,
  serverTimestamp, Timestamp, writeBatch, getDocs, type Firestore,
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithCredential,
  type Auth, type User,
} from 'firebase/auth';
import { gerador, novoCodigo } from '../lib/sorteio/aleatorio';
import { sortearAoVivo as sortear, chaveDe, type Inscrito } from '../lib/sorteio/ao-vivo';
import { textoPremio, type PremioInfo } from '../lib/sorteio/premio';
import { iconePremio, lerPremio, faltaHtml } from './sorteio-vivo';
import { CONTA_GW2 } from '../lib/sorteio/contas';
import { guildasLideradas, membros } from '../lib/sorteio/gw2';
import { Roleta } from '../lib/sorteio/roleta';
import { esc, coresSite, anuncia } from './sorteio';

interface Resultado {
  ganhadores: string[]; codigo: string; impressao: string; total: number; excluidos: string[]; em?: Timestamp | null;
  prazo?: Timestamp | null; // até quando quem ganhou pode aceitar (sorteio com aceite)
  mantidos?: string[];      // ganhadores que já tinham aceitado quando os outros foram trocados
}
interface Sorteio {
  titulo: string; premio: string; descricao: string; vencedores: number; dono: string;
  criadoEm?: Timestamp; fechaEm: Timestamp | null; aberto: boolean; resultado: Resultado | null; expiraEm: Timestamp;
  google?: boolean; historico?: Resultado[]; tirados?: string[]; premioInfo?: PremioInfo | null;
  aceite?: boolean; ausentes?: string[];
}

const MIN = 60_000, HORA = 60 * MIN, DIA = 24 * HORA;
const PRAZO_ACEITE = MIN; // quem ganhou tem 1 minuto para aceitar
const chaveOrg = (id: string) => `divine-org-${id}`;
const le = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const grava = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const novoToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
const temGoogle = (u: User | null) => Boolean(u?.providerData.some((p) => p.providerId === 'google.com'));

let db: Firestore | null = null;
let auth: Auth | null = null;
let usuario: Promise<User> | null = null;
function base(config: FirebaseOptions) {
  if (!db) {
    const app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
  }
  return { d: db!, garante, auth: auth! };
}
/** Login anônimo: a pessoa não vê nada; o navegador ganha um id que fica guardado nele.
 *  Se falhar (sem internet, Firebase fora), a próxima chamada tenta de novo, em vez de ficar presa no erro. */
function garante(): Promise<User> {
  if (auth!.currentUser) return Promise.resolve(auth!.currentUser);
  return (usuario ??= new Promise<User>((ok, falha) => {
    const parar = onAuthStateChanged(auth!, (u) => {
      if (u) { parar(); ok(u); return; }
      signInAnonymously(auth!).catch((e) => { parar(); usuario = null; falha(e); });
    });
  }));
}

/** Modo rigoroso: liga a conta Google ao login anônimo. Se essa conta Google já foi usada antes, entra com ela. */
async function ligarGoogle(a: Auth): Promise<User> {
  const provedor = new GoogleAuthProvider();
  provedor.setCustomParameters({ prompt: 'select_account' });
  try {
    const r = await linkWithPopup(a.currentUser!, provedor);
    await r.user.getIdToken(true);
    return r.user;
  } catch (err) {
    const cred = GoogleAuthProvider.credentialFromError(err as never);
    if ((err as { code?: string }).code === 'auth/credential-already-in-use' && cred) {
      const r = await signInWithCredential(a, cred);
      await r.user.getIdToken(true);
      return r.user;
    }
    throw err;
  }
}

export const linkDe = (id: string) => `${location.origin}/sorteio.html?s=${id}`;
const aberto = (s: Sorteio) => s.aberto && !s.resultado && (!s.fechaEm || s.fechaEm.toMillis() > Date.now());
const dataHora = (t: Timestamp | null | undefined) => (t ? t.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const vencedoresTxt = (n: number) => `${n} ${n === 1 ? 'vencedor' : 'vencedores'}`;
/** Marca o botão como ocupado ("Entrando…"); devolve a função que solta. Se já estava ocupado, devolve null. */
function ocupa(b: HTMLButtonElement, texto: string) {
  if (b.getAttribute('aria-disabled') === 'true') return null;
  const antes = b.innerHTML;
  b.setAttribute('aria-disabled', 'true'); b.textContent = texto;
  return () => { b.removeAttribute('aria-disabled'); b.innerHTML = antes; };
}
/** Pergunta antes de uma ação que não dá para desfazer. Caixa do site (não a janela cinza do navegador), com o efeito escrito. */
function confirma(texto: string, sim: string): Promise<boolean> {
  let dlg = document.querySelector<HTMLDialogElement>('dialog.confirma');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'confirma';
    dlg.setAttribute('aria-labelledby', 'confirma-texto');
    dlg.innerHTML = '<form method="dialog"><p id="confirma-texto"></p><div class="confirma-acoes"><button class="btn btn-secundario" value="nao" autofocus>Cancelar</button><button class="btn btn-primario" value="sim" data-sim></button></div></form>';
    document.body.append(dlg);
  }
  dlg.querySelector('#confirma-texto')!.textContent = texto;
  dlg.querySelector('[data-sim]')!.textContent = sim;
  dlg.returnValue = '';
  return new Promise((ok) => {
    dlg!.addEventListener('close', () => ok(dlg!.returnValue === 'sim'), { once: true });
    dlg!.showModal();
  });
}
const botao = (rotulo: string, cls = 'btn-secundario btn-sm') => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn ${cls}`; b.textContent = rotulo; return b; };

/** Resultado na página do sorteio: quem ganhou em destaque, o prêmio, e embaixo (discretos) código, data e ações. */
function cartaoResultado(s: Sorteio, inscritos: Inscrito[]) {
  const r = s.resultado!;
  const pi = s.premioInfo ?? null;
  const premio = pi ? textoPremio(pi) : s.premio;
  const quando = r.em ? r.em.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  const varios = r.ganhadores.length > 1;
  const trofeu = document.querySelector<HTMLTemplateElement>('template[data-ico="trofeu"]')?.innerHTML ?? '';
  const el = document.createElement('section');
  el.className = 'vitoria';
  el.setAttribute('aria-label', 'Resultado do sorteio');
  el.innerHTML = `
    ${r.prazo ? `<div class="aceite" data-aceite style="--anel:var(--rar-${esc(pi?.raridade || 'texto')})"></div><p class="sr-only" role="status" data-a-anuncio></p>` : `<span class="vitoria-trofeu" aria-hidden="true">${trofeu}</span>`}
    ${varios
      ? `<ol class="vitoria-lista">${r.ganhadores.map((n, i) => `<li><span class="vitoria-pos">${i + 1}º</span><span class="vitoria-nome">${esc(n)}</span></li>`).join('')}</ol>`
      : `<p class="vitoria-nome vitoria-nome-unico">${esc(r.ganhadores[0] ?? '')}</p>`}
    ${premio ? `<p class="vitoria-premio"><span>${varios ? 'levaram' : 'levou'}</span>${pi && !r.prazo ? iconePremio(pi, 'p') : ''}<b>${esc(premio)}</b></p>` : ''}
    <p class="vitoria-meta"><span>${r.total} ${r.total === 1 ? 'participante' : 'participantes'}</span>${quando ? `<span>${esc(quando)}</span>` : ''}<span>Código <b>${esc(r.codigo)}</b></span></p>
    <div class="vitoria-acoes">
      <button type="button" class="btn btn-secundario btn-sm" data-copiar>Copiar para o Discord</button>
      <button type="button" class="btn btn-secundario btn-sm" data-conferir>Refazer a conta</button>
    </div>
    <p class="vitoria-conferido" role="status"></p>`;
  const saida = el.querySelector<HTMLElement>('.vitoria-conferido')!;
  const copiar = el.querySelector<HTMLButtonElement>('[data-copiar]')!;
  copiar.addEventListener('click', () => {
    const fora = new Set((el.dataset.fora ?? '').split('\n').filter(Boolean));
    const levam = r.ganhadores.filter((n) => !fora.has(n));
    const texto = `**${s.titulo}**${premio ? ` · ${premio}` : ''}\n${levam.map((n, i) => (levam.length > 1 ? `${i + 1}º ${n}` : n)).join('\n')}${fora.size ? `\nNão aceitaram a tempo: ${[...fora].join(', ')}` : ''}\nCódigo: ${r.codigo}\nConfira em ${location.origin}/sorteio/ganhadores.html`;
    navigator.clipboard.writeText(texto)
      .then(() => { saida.textContent = 'Resultado copiado. Agora é só colar no Discord.'; saida.className = 'vitoria-conferido'; })
      .catch(() => { saida.textContent = 'Não deu para copiar. Selecione o código e copie à mão.'; saida.className = 'vitoria-conferido is-erro'; });
  });
  const conferir = el.querySelector<HTMLButtonElement>('[data-conferir]')!;
  conferir.addEventListener('click', async () => {
    try {
      const m = r.mantidos ?? [];
      const x = await sortear(inscritos, r.excluidos, r.ganhadores.length - m.length, r.codigo);
      const mesmaLista = x.impressao === r.impressao;
      const ok = mesmaLista && x.ganhadores.join('\n') === r.ganhadores.slice(m.length).join('\n');
      saida.textContent = ok ? 'Confere: com a mesma lista e o mesmo código, o resultado é este.'
        : !mesmaLista ? 'A lista de inscritos mudou depois do sorteio. Confira pela página de Ganhadores, que guarda a lista do momento do sorteio.'
        : 'Não confere: com esta lista e este código, o resultado seria outro.';
      saida.className = `vitoria-conferido ${ok ? 'is-ok' : mesmaLista ? 'is-erro' : ''}`;
    } catch { saida.textContent = 'Não deu para refazer a conta agora. Tente de novo.'; saida.className = 'vitoria-conferido is-erro'; }
  });
  return el;
}

// ======================================================================== página do sorteio (?s=<id>), para todo mundo
export function sala(config: FirebaseOptions, id: string, bloco: HTMLElement) {
  const { d, garante: eu, auth: a } = base(config);
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => bloco.querySelector<T>(s)!;
  // o título do sorteio mora no topo da página (h1), fora do bloco
  const titulo = () => document.querySelector<HTMLElement>('[data-i-titulo]')!;
  let tituloSala = document.title;
  const form = $<HTMLFormElement>('[data-i-form]');
  const msg = $('[data-i-msg]');
  const caixaRoleta = $('[data-i-roleta]');
  const roleta = new Roleta(caixaRoleta.querySelector('canvas')!, coresSite);
  let s: Sorteio | null = null;
  let inscritos: Inscrito[] = [];
  let uid = '';
  let org = false; // este navegador organiza o sorteio (abriu, ou abriu o link de organizador)
  let minha: string | null = null; // conta com que este aparelho se inscreveu
  let minhaChave: string | null = null;
  let aceitos = new Set<string>(); // chaves de quem já aceitou o prêmio
  let codigoMostrado = '';
  let girando = false;
  let primeira = true;
  let membrosGuilda: Set<string> | null = null;
  const avisa = (t: string, tipo: '' | 'erro' | 'ok' = '') => { msg.textContent = t; msg.className = `sorteio-msg${tipo ? ` is-${tipo}` : ''}`; };
  const fora = () => (membrosGuilda ? inscritos.filter((p) => !membrosGuilda!.has(p.chave)).map((p) => p.chave) : []);

  // link de organizador (?org=...): guarda a chave neste navegador e tira da barra de endereço
  const url = new URL(location.href);
  const tokenNaUrl = url.searchParams.get('org');
  if (tokenNaUrl) {
    grava(chaveOrg(id), tokenNaUrl);
    url.searchParams.delete('org');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function pintaEstado() {
    if (!s) return;
    const n = esc(vencedoresTxt(s.vencedores));
    $('[data-i-estado]').hidden = Boolean(s.resultado);
    const qtd = `${n} · ${inscritos.length === 1 ? '1 inscrito' : `${inscritos.length} inscritos`}`;
    $('[data-i-estado]').innerHTML = s.resultado
      ? ''
      : aberto(s)
        ? s.fechaEm
          ? `<span class="sala-rel-rotulo">Inscrições fecham em</span><span class="tempo sala-rel">${faltaHtml(s.fechaEm.toMillis() - Date.now())}</span><span class="sala-rel-meta">${qtd}</span>`
          : `<span class="sala-rel-rotulo">Inscrições abertas</span><span class="sala-rel-meta">Fecham quando quem organiza encerrar. ${qtd}</span>`
        : `<span class="sala-rel-rotulo">Inscrições encerradas</span><span class="sala-rel-meta">${qtd}. ${org ? 'Quando quiser, clique em Sortear agora.' : 'O resultado aparece aqui assim que sair. Pode deixar esta página aberta.'}</span>`;
  }

  function pinta() {
    if (!s) return;
    bloco.removeAttribute('aria-busy');
    $('[data-i-estado]').removeAttribute('role'); // sem live region: o relógio reescreve este texto a cada segundo; só o erro vira alert
    titulo().textContent = s.titulo;
    tituloSala = `${s.titulo} - Sorteio - Guild DIVINE`;
    if (!document.title.startsWith('Você ganhou')) document.title = tituloSala;
    const pi = s.premioInfo;
    $('[data-i-premio]').hidden = !s.premio && !pi;
    $('[data-i-premio]').style.setProperty('--rar', `var(--rar-${pi?.raridade || 'texto'})`);
    $('[data-i-premio]').innerHTML = pi
      ? `${iconePremio(pi, 'g')}<span class="sala-premio-texto"><b>${esc(textoPremio(pi))}</b>${pi.descricao ? `<span>${esc(pi.descricao)}</span>` : ''}</span>`
      : s.premio ? `${iconePremio(null, 'g')}<span class="sala-premio-texto"><b>${esc(s.premio)}</b></span>` : '';
    $('[data-i-desc]').hidden = !s.descricao; $('[data-i-desc]').textContent = s.descricao;
    pintaEstado();
    form.hidden = !aberto(s) || Boolean(minha);
    $('[data-i-google]').hidden = !s.google || temGoogle(a.currentUser);
    if (minha && !msg.textContent) avisa(`Você está participando como ${minha}. Boa sorte.`, 'ok');
    pintaTransparencia();
    pintaDono();
    pintaLista();
    if (!girando) mostraResultado();
    pintaAceite(); // quem organiza ou ganhou pode ter mudado (login terminou, inscrição)
  }

  // o que todo mundo pode conferir: quantas vezes sortearam e quem foi tirado
  function pintaTransparencia() {
    const h = s?.historico ?? [];
    const t = s?.tirados ?? [];
    const au = s?.ausentes ?? [];
    const el = $('[data-i-transparencia]');
    el.hidden = h.length === 0 && t.length === 0 && au.length === 0;
    el.innerHTML = [
      h.length ? `<details><summary>${h.length === 1 ? 'Este sorteio foi refeito 1 vez' : `Este sorteio foi refeito ${h.length} vezes`}. Ver os resultados anteriores</summary><ol>${h.map((r) => `<li>${esc(r.ganhadores.join(', '))} <small>(código ${esc(r.codigo)})</small></li>`).join('')}</ol></details>` : '',
      t.length ? `<details><summary>${t.length === 1 ? '1 inscrição foi tirada' : `${t.length} inscrições foram tiradas`} por quem organizou. Ver quais</summary><ol>${t.map((n) => `<li>${esc(n)}</li>`).join('')}</ol></details>` : '',
      au.length ? `<details><summary>${au.length === 1 ? '1 pessoa ganhou e não aceitou a tempo' : `${au.length} pessoas ganharam e não aceitaram a tempo`}. Ver quem</summary><ol>${au.map((n) => `<li>${esc(n)}</li>`).join('')}</ol></details>` : '',
    ].join('');
  }

  // o resultado novo gira a roleta na tela de todo mundo; quem chega depois vê direto o cartão
  async function mostraResultado() {
    const r = s?.resultado;
    const alvo = $('[data-i-resultado]');
    if (!r) { alvo.replaceChildren(); caixaRoleta.hidden = true; codigoMostrado = ''; return; }
    if (r.codigo === codigoMostrado) return;
    const recente = !primeira || (r.em ? Date.now() - r.em.toMillis() < 90_000 : true);
    codigoMostrado = r.codigo;
    if (recente && inscritos.length > 1) {
      girando = true;
      alvo.replaceChildren();
      const ex = new Set(r.excluidos);
      let resto = inscritos.filter((p) => !ex.has(p.chave)).map((p) => p.conta);
      caixaRoleta.hidden = false;
      caixaRoleta.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      const g = await gerador(r.codigo, 'roleta');
      const novos = r.ganhadores.slice((r.mantidos ?? []).length);
      for (let i = 0; i < novos.length && resto.length; i++) {
        roleta.itens = resto.map((nome) => ({ nome, peso: 1 }));
        roleta.desenha();
        const idx = resto.indexOf(novos[i]);
        if (idx < 0) break;
        await roleta.gira(idx, (g.u32() % 1000) / 1000, i === 0 ? 4200 : novos.length > 5 ? 1400 : 2600);
        resto = resto.filter((n) => n !== novos[i]);
      }
      girando = false;
      if (s?.resultado?.codigo !== r.codigo) return mostraResultado(); // sortearam de novo durante o giro
    }
    alvo.replaceChildren(cartaoResultado(s!, inscritos));
    caixaRoleta.hidden = true; // a roleta já cumpriu o papel: fica o resultado
    const ganhei = minha && r.ganhadores.some((n) => chaveDe(n) === chaveDe(minha!));
    anuncia(`Resultado do sorteio ${s!.titulo}: ${r.ganhadores.join(', ')}.${ganhei ? (r.prazo ? ' Você ganhou. Aceite o prêmio em até 1 minuto.' : ' Você ganhou.') : ''}`);
    if (ganhei && !r.prazo) avisa(`Você ganhou com ${minha}. Fale com quem organizou para receber o prêmio.`, 'ok');
    pintaAceite();
  }

  // ---------------------------------------------------------------- aceite do prêmio (1 minuto)
  // A estrutura só é refeita quando o estado muda (alguém aceitou, o tempo acabou). O relógio, o anel e o botão
  // que enche mudam por estilo a cada meio segundo, fora do que o leitor de tela anuncia (aria-hidden).
  const fmt = (ms: number) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const anel = () => '<svg class="anel" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="anel-trilho" cx="60" cy="60" r="56" pathLength="100"/><circle class="anel-tempo" cx="60" cy="60" r="56" pathLength="100" data-a-anel/></svg>';
  const relogio = '<span class="aceite-relogio" data-a-tempo aria-hidden="true"></span>';
  const ICO_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICO_GIRA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
  const chip = (x: { ok: boolean }, fim: boolean) => x.ok
    ? `<span class="aceite-chip is-ok">${ICO_OK}Aceitou</span>`
    : fim ? `<span class="aceite-chip is-fim">${ICO_X}Não aceitou</span>`
      : `<span class="aceite-chip">${anel()}${relogio}<span class="sr-only">Esperando</span></span>`;

  function medalhao(st: { n: string; ok: boolean }[], fase: 'conta' | 'fim' | 'ok', meu: boolean, jaAceitei: boolean) {
    const pi = s?.premioInfo;
    const unico = st.length === 1;
    const pend = st.filter((x) => !x.ok);
    const quem = unico ? `<b>${esc(st[0].n)}</b>` : 'quem ganhou';
    const joia = `<span class="aceite-joia">${anel()}${iconePremio(pi, 'g')}${fase === 'ok' || jaAceitei ? `<span class="aceite-selo">${ICO_OK}</span>` : ''}</span>`;
    const lista = unico ? '' : `<ul class="aceite-nomes">${st.map((x) => `<li class="aceite-chip${x.ok ? ' is-ok' : fase === 'fim' ? ' is-fim' : ''}">${x.ok ? ICO_OK : fase === 'fim' ? ICO_X : ''}${esc(x.n)}</li>`).join('')}</ul>`;
    let corpo: string;
    let cls = fase === 'ok' ? 'is-ok' : fase === 'fim' ? 'is-fim' : '';
    if (meu && jaAceitei) {
      cls = 'is-ok is-meu';
      corpo = '<p class="aceite-titulo" tabindex="-1">Prêmio aceito</p>' + joia + '<p class="aceite-texto">Agora fale com quem organizou para receber no jogo.</p>';
    } else if (fase === 'ok') {
      corpo = joia + `<p class="aceite-ok">${unico ? `${esc(st[0].n)} aceitou o prêmio` : 'Todo mundo aceitou o prêmio'}</p>`;
    } else if (fase === 'conta' && meu) {
      cls = 'is-meu';
      corpo = '<p class="aceite-titulo">Você ganhou!</p>' + joia
        + `<p class="aceite-tempo">${relogio}<small>para aceitar</small></p>`
        + '<button type="button" class="btn btn-primario btn-lg" data-aceitar aria-describedby="aceite-prazo">Aceitar o prêmio</button><span class="sr-only" id="aceite-prazo">Você tem 1 minuto para aceitar.</span>';
    } else if (fase === 'conta') {
      corpo = joia + `<p class="aceite-tempo">${relogio}<small>para aceitar</small></p><p class="aceite-texto">Esperando ${quem} aceitar.</p>`;
    } else {
      corpo = joia + (meu
        ? '<p class="aceite-perdeu">O tempo acabou</p><p class="aceite-texto">Quem organiza vai sortear outra pessoa no seu lugar.</p>'
        : `<p class="aceite-perdeu">${pend.length === 1 ? `${esc(pend[0].n)} não aceitou a tempo` : `${pend.length} pessoas não aceitaram a tempo`}</p><p class="aceite-texto">Quem organiza vai sortear outra pessoa.</p>`);
    }
    return `<div class="aceite-medalhao ${cls}">${corpo}${lista}</div>`;
  }

  function painelOrg(st: { n: string; ok: boolean }[], fase: 'conta' | 'fim' | 'ok') {
    const ok = st.filter((x) => x.ok);
    const pend = st.filter((x) => !x.ok);
    const conta = st.length === 1 ? (ok.length ? 'Aceitou' : 'Ainda não aceitou') : `${ok.length} de ${st.length} aceitaram`;
    const linhas = st.map((x) => `<li class="${x.ok ? 'is-ok' : fase === 'fim' ? 'is-fim' : ''}"><span class="aceite-org-nome">${esc(x.n)}</span>${chip(x, fase === 'fim')}</li>`).join('');
    const rotulo = pend.length === 1 ? 'Sortear outra pessoa' : `Sortear ${pend.length} outras pessoas`;
    const fica = ok.length ? `${ok.map((x) => esc(x.n)).join(', ')} continua${ok.length > 1 ? 'm' : ''} com o prêmio.` : '';
    const acao = fase === 'ok'
      ? `<p class="aceite-org-tudo">${ICO_OK}${st.length === 1 ? 'Aceitou. Agora é entregar o prêmio no jogo.' : 'Todo mundo aceitou. Agora é entregar os prêmios no jogo.'}</p>`
      : fase === 'conta'
        ? `<button type="button" class="btn btn-primario aceite-trocar" data-trocar aria-disabled="true" aria-describedby="aceite-dica">${ICO_GIRA}${rotulo}${relogio}</button><p class="aceite-dica" id="aceite-dica">Dá para sortear outra pessoa quando o minuto acabar. ${fica}</p>`
        : `<button type="button" class="btn btn-primario aceite-trocar" data-trocar aria-describedby="aceite-dica">${ICO_GIRA}${rotulo}</button><p class="aceite-dica" id="aceite-dica">${pend.length === 1 ? `${esc(pend[0].n)} não aceitou a tempo.` : `${pend.length} pessoas não aceitaram a tempo.`} ${fica}</p>`;
    return `<div class="aceite-org">
      <div class="aceite-org-topo"><p class="aceite-org-titulo">Aceite do prêmio</p><p class="aceite-org-conta">${conta}</p></div>
      <ul class="aceite-org-lista">${linhas}</ul>
      <div class="aceite-org-acao">${acao}</div>
    </div>`;
  }

  function pintaAceite() {
    const r = s?.resultado;
    const caixa = bloco.querySelector<HTMLElement>('[data-aceite]');
    if (!r || !r.prazo || !caixa) return;
    const resta = r.prazo.toMillis() - Date.now();
    const st = r.ganhadores.map((n) => ({ n, ok: aceitos.has(chaveDe(n)) }));
    const fase: 'conta' | 'fim' | 'ok' = st.every((x) => x.ok) ? 'ok' : resta > 0 ? 'conta' : 'fim';
    const meu = Boolean(minhaChave && r.ganhadores.some((n) => chaveDe(n) === minhaChave));
    const jaAceitei = Boolean(minhaChave && aceitos.has(minhaChave));
    // quem organiza vê o painel; se também ganhou e ainda não aceitou, vê primeiro o botão de aceitar
    const comoOrg = org && !(meu && !jaAceitei && fase === 'conta');
    const chave = [r.codigo, fase, comoOrg, meu, jaAceitei, st.map((x) => +x.ok).join('')].join('|');
    const anuncio = bloco.querySelector<HTMLElement>('[data-a-anuncio]');
    const antes = caixa.dataset.chave;
    if (antes !== chave) {
      caixa.dataset.chave = chave;
      const ativo = document.activeElement;
      const virouMeu = meu && !jaAceitei && fase === 'conta' && !antes?.startsWith(`${r.codigo}|conta`);
      const foco = ativo?.hasAttribute('data-trocar') ? '[data-trocar]' : (ativo?.hasAttribute('data-aceitar') || virouMeu) ? '[data-aceitar]' : '';
      caixa.classList.add('is-novo'); // o anel e o botão nascem no ponto certo, sem "varrer" do zero
      caixa.innerHTML = comoOrg ? painelOrg(st, fase) : medalhao(st, fase, meu, jaAceitei);
      if (foco) (caixa.querySelector<HTMLElement>(foco) ?? caixa.querySelector<HTMLElement>('[tabindex="-1"]'))?.focus();
      // anuncia só a mudança (a primeira pintura já foi anunciada junto com o resultado)
      const antigo = antes?.split('|');
      if (anuncio && antigo && antigo[0] === r.codigo) {
        const okAntes = antigo[5] ?? '';
        const novos = st.filter((x, i) => x.ok && okAntes[i] !== '1').map((x) => x.n);
        anuncio.textContent = fase === 'ok' ? (st.length === 1 ? `${st[0].n} aceitou o prêmio.` : 'Todo mundo aceitou o prêmio.')
          : novos.length ? `${novos.join(', ')} aceitou o prêmio.`
            : fase === 'fim' ? (comoOrg ? 'O tempo acabou. Já dá para sortear outra pessoa.' : 'O tempo para aceitar acabou.') : '';
      }
    }
    const p = Math.max(0, Math.min(1, resta / PRAZO_ACEITE));
    const urgente = fase === 'conta' && resta <= 10_000;
    if (urgente && !caixa.classList.contains('is-urgente') && meu && !jaAceitei && anuncio) anuncio.textContent = 'Faltam 10 segundos para aceitar.';
    caixa.classList.toggle('is-urgente', urgente);
    caixa.querySelectorAll<HTMLElement>('[data-a-tempo]').forEach((e) => { e.textContent = fmt(resta); });
    caixa.querySelectorAll<SVGCircleElement>('[data-a-anel]').forEach((c) => { c.style.strokeDashoffset = String(100 * (1 - p)); });
    caixa.querySelector<HTMLElement>('[data-trocar]')?.style.setProperty('--gasto', String(1 - p));
    // no cartão: quem não aceitou a tempo perde o dourado e ganha "não aceitou" (e sai do texto do Discord)
    const cartao = caixa.closest<HTMLElement>('.vitoria');
    if (cartao) {
      const fora = new Set(fase === 'fim' ? st.filter((x) => !x.ok).map((x) => x.n) : []);
      const marca = [...fora].join('\n');
      if ((cartao.dataset.fora ?? '') !== marca) {
        cartao.dataset.fora = marca;
        cartao.querySelectorAll<HTMLElement>('.vitoria-nome').forEach((e) => {
          const saiu = fora.has(e.textContent!.trim());
          e.classList.toggle('is-fora', saiu);
          const tag = e.nextElementSibling?.classList.contains('vitoria-fora') ? e.nextElementSibling : null;
          if (saiu && !tag) e.insertAdjacentHTML('afterend', '<span class="vitoria-fora">não aceitou</span>');
          if (!saiu && tag) tag.remove();
        });
      }
    }
    // aba em segundo plano: quem ganhou vê no título da aba que precisa aceitar
    if (meu && !jaAceitei && fase === 'conta') document.title = `Você ganhou! Aceite em ${fmt(resta)}`;
    else if (document.title !== tituloSala) document.title = tituloSala;
    if (caixa.classList.contains('is-novo')) { void caixa.offsetWidth; caixa.classList.remove('is-novo'); }
  }
  bloco.addEventListener('click', async (e) => {
    const alvo = e.target as HTMLElement;
    if (alvo.closest('[data-aceitar]') && minhaChave) {
      const b = alvo.closest<HTMLButtonElement>('[data-aceitar]')!;
      if (b.getAttribute('aria-disabled') === 'true') return;
      b.setAttribute('aria-disabled', 'true'); b.textContent = 'Aceitando…';
      try {
        await setDoc(doc(d, 'sorteios', id, 'aceites', minhaChave), { em: serverTimestamp(), expiraEm: Timestamp.fromMillis(Date.now() + 16 * DIA) });
        avisa(`Prêmio aceito. Fale com quem organizou para receber ${s?.premio || 'o prêmio'}.`, 'ok');
      } catch (err) {
        console.warn('sorteio ao vivo: aceite falhou', err);
        avisa('Não deu para aceitar. Se o tempo acabou, quem organiza pode sortear outra pessoa. Se não, tente de novo.', 'erro');
        b.removeAttribute('aria-disabled'); b.textContent = 'Aceitar o prêmio';
      }
    }
    if (alvo.closest('[data-trocar]:not([aria-disabled="true"])') && org) trocarAusentes();
  });
  onSnapshot(collection(d, 'sorteios', id, 'aceites'), (snap) => { aceitos = new Set(snap.docs.map((x) => x.id)); pintaAceite(); },
    () => avisa('Não deu para acompanhar quem aceitou o prêmio. Confira sua internet e recarregue a página.', 'erro'));
  setInterval(() => {
    const r = s?.resultado;
    if (!r?.prazo) return;
    const ch = bloco.querySelector<HTMLElement>('[data-aceite]')?.dataset.chave ?? '';
    if (ch.includes('|conta|') || r.prazo.toMillis() > Date.now() - 2000 || !ch) pintaAceite();
  }, 500);

  /** Quem não aceitou sai; quem aceitou fica (mantidos); só as vagas abertas são sorteadas, com código novo. */
  async function trocarAusentes() {
    const r = s?.resultado;
    if (!r) return;
    const mant = r.ganhadores.filter((n) => aceitos.has(chaveDe(n)));
    const sem = r.ganhadores.filter((n) => !aceitos.has(chaveDe(n)));
    const exc = [...new Set([...r.excluidos, ...fora(), ...sem.map(chaveDe), ...mant.map(chaveDe)])];
    const livres = inscritos.filter((p) => !exc.includes(p.chave)).length;
    if (!sem.length) return;
    if (livres < 1) return avisa('Não sobrou ninguém para sortear: todo mundo que se inscreveu já ganhou ou não aceitou.', 'erro');
    if ((s!.historico ?? []).length >= 20) return avisa('Este sorteio já foi refeito 20 vezes, que é o máximo. Abra um sorteio novo.', 'erro');
    if (!(await confirma(`Sortear ${sem.length === 1 ? 'outra pessoa' : `${sem.length} outras pessoas`} no lugar de ${sem.join(', ')}? ${mant.length ? `${mant.join(', ')} continua${mant.length > 1 ? 'm' : ''} com o prêmio. ` : ''}A roleta gira de novo para todo mundo.`, sem.length === 1 ? 'Sortear outra pessoa' : 'Sortear outras pessoas'))) return;
    const codigo = novoCodigo();
    const x = await sortear(inscritos, exc, Math.min(sem.length, livres), codigo);
    const lote = writeBatch(d);
    lote.update(doc(d, 'sorteios', id), {
      resultado: { ganhadores: [...mant, ...x.ganhadores], codigo, impressao: x.impressao, total: r.total, excluidos: exc, mantidos: mant, em: serverTimestamp(), prazo: Timestamp.fromMillis(Date.now() + PRAZO_ACEITE) },
      historico: [...(s!.historico ?? []), r],
      ausentes: arrayUnion(...sem),
      expiraEm: Timestamp.fromMillis(Date.now() + DIA),
    });
    lote.set(doc(d, 'registros', id), {
      titulo: s!.titulo, premio: s!.premio, premioInfo: s!.premioInfo ?? null, ganhadores: [...mant, ...x.ganhadores], codigo,
      impressao: x.impressao, total: r.total, excluidos: exc, participantes: inscritos.map((p) => p.conta),
      refeito: (s!.historico ?? []).length + 1, mantidos: mant, ausentes: [...new Set([...(s!.ausentes ?? []), ...sem])], data: serverTimestamp(),
    });
    await lote.commit().catch((err) => { console.warn('sorteio ao vivo: troca não salvou', err); avisa('Não deu para sortear outra pessoa. Tente de novo.', 'erro'); });
  }

  function pintaLista() {
    const ex = new Set(fora());
    $('[data-i-lista]').hidden = inscritos.length === 0;
    $('[data-i-total]').textContent = String(inscritos.length);
    $('[data-i-nomes]').replaceChildren(...inscritos.map((p) => {
      const li = document.createElement('li');
      if (ex.has(p.chave)) li.className = 'is-fora';
      const nome = document.createElement('span');
      nome.textContent = p.conta;
      li.append(nome);
      if (org && s && !s.resultado) {
        const tira = botao('Tirar', 'btn-fantasma btn-sm');
        tira.setAttribute('aria-label', `Tirar ${p.conta} do sorteio`);
        tira.addEventListener('click', async () => {
          if (!(await confirma(`Tirar ${p.conta} do sorteio? O nome fica na lista pública de inscrições tiradas, e essa pessoa não consegue se inscrever de novo pelo mesmo aparelho.`, `Tirar ${p.conta}`))) return;
          const b = writeBatch(d);
          b.delete(doc(d, 'sorteios', id, 'inscritos', p.chave));
          b.update(doc(d, 'sorteios', id), { tirados: arrayUnion(p.conta) });
          b.commit().catch(() => avisaDono('Não deu para tirar. Tente de novo.', 'erro'));
        });
        li.append(tira);
      }
      return li;
    }));
  }

  // ---------------------------------------------------------------- controles de quem organiza
  const painelDono = $('[data-i-dono]');
  const avisaDono = (t: string, tipo = '') => { const m = painelDono.querySelector<HTMLElement>('[data-dono-msg]'); if (m) { m.textContent = t; m.className = `sorteio-msg${tipo ? ` is-${tipo}` : ''}`; } };
  let montouDono = false;
  const copiar = botao('Copiar link', 'btn-secundario btn-sm');
  const abrirFechar = botao('');
  const sortearB = botao('Sortear agora', 'btn-primario');
  const deNovo = botao('Sortear de novo', 'btn-secundario btn-sm');
  const apagar = botao('Apagar sorteio', 'btn-fantasma btn-sm');

  async function linkOrganizador() {
    let token = le(chaveOrg(id));
    if (!token) {
      const x = await getDoc(doc(d, 'sorteios', id, 'privado', 'chave')).catch(() => null);
      token = x?.exists() ? String(x.data().token) : null;
      if (token) grava(chaveOrg(id), token);
    }
    return token ? `${linkDe(id)}&org=${token}` : null;
  }

  function montaDono() {
    montouDono = true;
    painelDono.innerHTML = `
      <div class="sala-dono-barra">
        <span class="sala-dono-titulo">Você organiza</span>
        <div class="sala-dono-acoes" data-dono-acoes></div>
        <button type="button" class="btn btn-secundario btn-sm" aria-expanded="false" aria-controls="sala-mais" data-dono-mais>Mais opções</button>
      </div>
      <p class="sorteio-msg" data-dono-msg role="status"></p>
      <div class="sala-dono-mais" id="sala-mais" hidden>
      <details class="sorteio-api">
        <summary>Link de organizador</summary>
        <div class="sorteio-api-corpo">
          <p>Quem abrir este link também vira organizador. <b>Não mande no chat.</b></p>
          <button type="button" class="btn btn-secundario btn-sm" data-org-copiar>Copiar link de organizador</button>
        </div>
      </details>
      <details class="sorteio-api" data-guilda-api>
        <summary>Só membros da guilda</summary>
        <div class="sorteio-api-corpo">
          <p>Chave de API do líder (permissões <b>account</b> e <b>guilds</b>). Quem não é da guilda fica de fora. A chave não sai desta aba.</p>
          <label class="campo"><span class="campo-rotulo">Chave de API</span><input class="campo-entrada campo-mono" type="password" name="chave" autocomplete="off" spellcheck="false" /></label>
          <label class="campo" hidden data-guilda><span class="campo-rotulo">Guilda</span><select class="campo-entrada" name="guilda"></select></label>
          <button type="button" class="btn btn-secundario btn-sm" data-api>Buscar membros</button>
          <p class="sorteio-msg" data-api-msg role="status"></p>
        </div>
      </details>
      <div data-dono-denovo></div>
      <div data-dono-apagar></div>
      </div>`;
    const maisB = painelDono.querySelector<HTMLButtonElement>('[data-dono-mais]')!;
    const maisP = painelDono.querySelector<HTMLElement>('#sala-mais')!;
    maisB.addEventListener('click', () => { maisP.hidden = !maisP.hidden; maisB.setAttribute('aria-expanded', String(!maisP.hidden)); });
    painelDono.querySelector('[data-dono-apagar]')!.append(apagar);
    copiar.addEventListener('click', () => navigator.clipboard.writeText(`**${s!.titulo}**${s!.premio ? ` · ${s!.premio}` : ''}\nEntre e ponha sua conta do jogo: ${linkDe(id)}`)
      .then(() => { avisaDono('Link copiado. Agora é só colar no Discord.', 'ok'); copiar.textContent = 'Link copiado'; setTimeout(() => (copiar.textContent = 'Copiar link'), 2000); })
      .catch(() => avisaDono(`Não deu para copiar. O link é ${linkDe(id)}`, 'erro')));
    const orgB = painelDono.querySelector<HTMLButtonElement>('[data-org-copiar]')!;
    orgB.addEventListener('click', async () => {
      const l = await linkOrganizador();
      if (!l) return avisaDono('Não deu para pegar o link de organizador. Recarregue a página e tente de novo.', 'erro');
      navigator.clipboard.writeText(l)
        .then(() => { avisaDono('Link de organizador copiado. Não mande no chat.', 'ok'); orgB.textContent = 'Link de organizador copiado'; setTimeout(() => (orgB.textContent = 'Copiar link de organizador'), 2000); })
        .catch(() => avisaDono(`Não deu para copiar. O link é ${l}`, 'erro'));
    });
    abrirFechar.addEventListener('click', () => updateDoc(doc(d, 'sorteios', id), s!.aberto ? { aberto: false } : { aberto: true, fechaEm: null })
      .catch(() => avisaDono('Não deu para mudar. Tente de novo.', 'erro')));
    const sorteia = async (confirmacao: string, sim: string) => {
      const exc = fora();
      const n = inscritos.length - exc.length;
      if (n < 1) return avisaDono('Ainda não tem ninguém inscrito para sortear.', 'erro');
      if (!(await confirma(confirmacao.replace('{n}', String(n)), sim))) return;
      const codigo = novoCodigo();
      const r = await sortear(inscritos, exc, s!.vencedores, codigo);
      const anterior = s!.resultado;
      const lote = writeBatch(d);
      lote.update(doc(d, 'sorteios', id), {
        aberto: false,
        resultado: { ...r, codigo, excluidos: exc, mantidos: [], em: serverTimestamp(), prazo: s!.aceite ? Timestamp.fromMillis(Date.now() + PRAZO_ACEITE) : null },
        ...(anterior ? { historico: [...(s!.historico ?? []), anterior] } : {}),
        expiraEm: Timestamp.fromMillis(Date.now() + DIA), // o resultado fica no ar por 24 h
      });
      // registro permanente (aba Ganhadores): fica depois que o sorteio sai do ar, com a lista para conferir
      lote.set(doc(d, 'registros', id), {
        titulo: s!.titulo, premio: s!.premio, premioInfo: s!.premioInfo ?? null, ganhadores: r.ganhadores, codigo,
        impressao: r.impressao, total: r.total, excluidos: exc, participantes: inscritos.map((p) => p.conta),
        refeito: (s!.historico ?? []).length + (anterior ? 1 : 0), mantidos: [], ausentes: s!.ausentes ?? [], data: serverTimestamp(),
      });
      await lote.commit().then(() => avisaDono('')).catch((err) => { console.warn('sorteio ao vivo: resultado não salvou', err); avisaDono('Não deu para salvar o resultado. Tente de novo.', 'erro'); });
    };
    sortearB.addEventListener('click', () => sorteia(`Sortear ${vencedoresTxt(s!.vencedores)} entre {n} inscritos? As inscrições fecham e a roleta gira na tela de todo mundo.`, 'Sortear agora'));
    deNovo.addEventListener('click', () => {
      if ((s!.historico ?? []).length >= 20) return avisaDono('Este sorteio já foi refeito 20 vezes, que é o máximo. Abra um sorteio novo.', 'erro');
      sorteia(s!.resultado?.prazo ? 'Refazer o sorteio inteiro, com um código novo? Todo mundo que ganhou perde o prêmio, inclusive quem já aceitou. Para trocar só quem não aceitou, use Sortear outra pessoa. O resultado de agora vai para a lista pública de resultados anteriores.' : 'Sortear de novo, com um código novo? O resultado de agora vai para a lista pública de resultados anteriores, e a roleta gira outra vez para todo mundo.', s!.resultado?.prazo ? 'Refazer o sorteio inteiro' : 'Sortear de novo');
    });
    apagar.addEventListener('click', async () => {
      if (!(await confirma('Apagar este sorteio e todas as inscrições? Não dá para desfazer.', 'Apagar sorteio'))) return;
      try {
        const b = writeBatch(d);
        (await getDocs(collection(d, 'sorteios', id, 'inscritos'))).docs.forEach((x) => b.delete(x.ref));
        b.delete(doc(d, 'sorteios', id));
        await b.commit();
        location.href = '/sorteio.html#ao-vivo';
      } catch { avisaDono('Não deu para apagar. Tente de novo.', 'erro'); }
    });

    // filtro da guilda
    const api = painelDono.querySelector<HTMLElement>('[data-guilda-api]')!;
    const apiMsg = api.querySelector<HTMLElement>('[data-api-msg]')!;
    const selG = api.querySelector<HTMLSelectElement>('select')!;
    let chave = '';
    const avisaApi = (t: string, tipo = '') => { apiMsg.textContent = t; apiMsg.className = `sorteio-msg${tipo ? ` is-${tipo}` : ''}`; };
    const puxa = async () => {
      const ms = await membros(chave, selG.value);
      membrosGuilda = new Set(ms.map((x) => x.nome.toLocaleLowerCase('pt-BR')));
      avisaApi(`${ms.length} membros carregados. Quem não é da guilda aparece riscado na lista de inscritos.`, 'ok');
      pintaLista();
    };
    api.querySelector('[data-api]')!.addEventListener('click', async () => {
      chave = (api.querySelector<HTMLInputElement>('input[name="chave"]')!.value || '').trim();
      if (!chave) return avisaApi('Cole a chave de API primeiro.', 'erro');
      try {
        avisaApi('Conferindo a chave…');
        const gs = await guildasLideradas(chave);
        if (!gs.length) return avisaApi('Essa conta não é líder de nenhuma guilda. A API do jogo só mostra os membros para quem é líder.', 'erro');
        selG.innerHTML = gs.map((g) => `<option value="${esc(g.id)}">${esc(g.nome)} [${esc(g.tag)}]</option>`).join('');
        api.querySelector<HTMLElement>('[data-guilda]')!.hidden = gs.length < 2;
        await puxa();
      } catch (err) { avisaApi(err instanceof Error ? err.message : 'Não deu para falar com a API do jogo.', 'erro'); }
    });
    selG.addEventListener('change', () => puxa().catch((err) => avisaApi(err.message, 'erro')));
  }

  function pintaDono() {
    painelDono.hidden = !org;
    if (!org || !s) return;
    if (!montouDono) montaDono();
    abrirFechar.textContent = s.aberto ? 'Encerrar inscrições' : 'Reabrir inscrições';
    const comAceite = Boolean(s.resultado?.prazo);
    deNovo.textContent = comAceite ? 'Refazer o sorteio inteiro' : 'Sortear de novo';
    painelDono.querySelector('[data-dono-acoes]')!.replaceChildren(
      ...(s.resultado ? (comAceite ? [copiar] : [deNovo, copiar]) : [sortearB, abrirFechar, copiar]),
    );
    if (s.resultado && comAceite) painelDono.querySelector('[data-dono-denovo]')!.replaceChildren(deNovo);
  }

  // ---------------------------------------------------------------- dados ao vivo
  onSnapshot(doc(d, 'sorteios', id), (snap) => {
    if (!snap.exists()) {
      titulo().textContent = 'Sorteio não encontrado';
      bloco.removeAttribute('aria-busy');
      $('[data-i-estado]').setAttribute('role', 'alert');
      $('[data-i-estado]').textContent = 'Confira se o link está completo. Se estiver, o sorteio já acabou e saiu do ar, ou foi apagado por quem organizou.';
      form.hidden = true; painelDono.hidden = true;
      return;
    }
    s = snap.data({ serverTimestamps: 'estimate' }) as Sorteio;
    pinta();
    primeira = false;
  }, () => {
    titulo().textContent = 'Não deu para abrir o sorteio';
    bloco.removeAttribute('aria-busy');
    $('[data-i-estado]').setAttribute('role', 'alert');
    $('[data-i-estado]').textContent = 'Verifique sua internet e recarregue a página.';
  });

  onSnapshot(collection(d, 'sorteios', id, 'inscritos'), (snap) => {
    inscritos = snap.docs.map((x) => ({ chave: x.id, conta: String(x.data().conta) })).sort((a, b) => (a.chave < b.chave ? -1 : 1));
    pintaLista();
    if (s?.resultado && !girando && !$('[data-i-resultado]').childElementCount) mostraResultado();
  }, () => avisa('Não deu para atualizar a lista de inscritos. Confira sua internet e recarregue a página.', 'erro'));

  // contagem regressiva do prazo
  let estavaAberto = false;
  document.addEventListener('visibilitychange', () => { if (!document.hidden && s && !s.resultado && s.fechaEm) pintaEstado(); });
  setInterval(() => {
    if (!s || s.resultado || !s.fechaEm || document.hidden) return;
    if (aberto(s) !== estavaAberto) pinta(); else pintaEstado();
    estavaAberto = aberto(s);
  }, 1000);

  /** Depois de entrar (ou de trocar de conta, no modo rigoroso): este navegador organiza? já se inscreveu? */
  async function conecta(u: User) {
    uid = u.uid;
    const dono = await getDoc(doc(d, 'sorteios', id)).then((x) => x.data()?.dono === uid).catch(() => false);
    org = dono || Boolean((await getDoc(doc(d, 'sorteios', id, 'organizadores', uid)).catch(() => null))?.exists());
    const token = le(chaveOrg(id));
    if (!org && token) {
      org = await setDoc(doc(d, 'sorteios', id, 'organizadores', uid), { token, expiraEm: Timestamp.fromMillis(Date.now() + 16 * DIA) })
        .then(() => true).catch(() => false);
      if (!org) avisa('Este link de organizador não vale para este sorteio. Peça o link de novo para quem abriu o sorteio.', 'erro');
    }
    const marca = await getDoc(doc(d, 'sorteios', id, 'aparelhos', uid)).catch(() => null);
    minha = marca?.exists() ? (inscritos.find((p) => p.chave === marca.data().chave)?.conta ?? String(marca.data().chave)) : null;
    minhaChave = marca?.exists() ? String(marca.data().chave) : null;
    pinta();
  }
  eu().then(conecta).catch(() => avisa('Não deu para conectar ao sorteio. Confira sua internet: quando você clicar em Participar, o site tenta de novo.', 'erro'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entrada = form.elements.namedItem('conta') as HTMLInputElement;
    const conta = entrada.value.trim().replace(/\s{2,}/g, ' ');
    const b = form.querySelector<HTMLButtonElement>('button')!;
    if (b.getAttribute('aria-disabled') === 'true') return;
    if (!CONTA_GW2.test(conta)) { entrada.setAttribute('aria-invalid', 'true'); entrada.setAttribute('aria-describedby', 'i-conta-ajuda i-msg'); avisa('Isso não parece uma conta do jogo. O formato é o nome, um ponto e 4 números, como Joana.1234.', 'erro'); entrada.focus(); return; }
    entrada.removeAttribute('aria-invalid'); entrada.setAttribute('aria-describedby', 'i-conta-ajuda');
    const chave = conta.toLocaleLowerCase('pt-BR');
    const solta = ocupa(b, 'Entrando…')!;
    try {
      const u0 = await eu();
      if (!uid) await conecta(u0);
      // modo rigoroso: liga a conta Google antes (abre a janela do Google)
      if (s?.google && !temGoogle(a.currentUser)) {
        try {
          const u = await ligarGoogle(a);
          await conecta(u);
          if (minha) { avisa(`Essa conta Google já está participando como ${minha}. Cada conta Google entra uma vez só.`, 'erro'); return; }
        } catch {
          avisa('Este sorteio pede a conta Google, e o login não terminou. Clique em Participar e escolha uma conta na janela do Google.', 'erro');
          return;
        }
      }
      if (inscritos.some((p) => p.chave === chave)) { avisa(`A conta ${conta} já está participando deste sorteio.`, 'erro'); return; }
      const expiraEm = Timestamp.fromMillis(Date.now() + 16 * DIA);
      const lote = writeBatch(d);
      lote.set(doc(d, 'sorteios', id, 'inscritos', chave), { conta, em: serverTimestamp(), uid, expiraEm });
      lote.set(doc(d, 'sorteios', id, 'aparelhos', uid), { chave, expiraEm });
      await lote.commit();
      minha = conta;
      minhaChave = chave;
      avisa(`Pronto, ${conta} está participando. Deixe esta página aberta para ver a roleta na hora do sorteio.`, 'ok');
      pinta();
    } catch (err) {
      console.warn('sorteio ao vivo: inscrição falhou', err);
      avisa(s && !aberto(s) ? 'As inscrições acabaram de fechar.' : 'Não deu para fazer a inscrição. Se você já se inscreveu neste sorteio por este aparelho, não dá para entrar de novo. Se não, confira sua internet e tente outra vez.', 'erro');
    } finally { solta(); }
  });
}

// ======================================================================== aba "Ao vivo": abrir sorteio e ver os seus
export function painel(config: FirebaseOptions, el: HTMLElement) {
  const { d, garante: eu } = base(config);
  const novo = el.querySelector<HTMLFormElement>('[data-novo]')!;
  const m = novo.querySelector<HTMLElement>('[data-msg]')!;
  m.id ||= 'msg-novo';
  const erro = (t: string, campo?: string) => {
    m.textContent = t; m.className = `sorteio-msg${t ? ' is-erro' : ''}`;
    novo.querySelectorAll('[aria-invalid]').forEach((x) => {
      x.removeAttribute('aria-invalid');
      const resto = (x.getAttribute('aria-describedby') ?? '').split(' ').filter((i) => i && i !== m.id).join(' ');
      if (resto) x.setAttribute('aria-describedby', resto); else x.removeAttribute('aria-describedby');
    });
    if (campo) {
      const c = novo.elements.namedItem(campo) as HTMLElement;
      c.setAttribute('aria-invalid', 'true');
      c.setAttribute('aria-describedby', `${c.getAttribute('aria-describedby') ?? ''} ${m.id}`.trim());
      c.focus();
    }
  };

  novo.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (novo.querySelector('button[type="submit"]')?.getAttribute('aria-disabled') === 'true') return;
    const v = (n: string) => ((novo.elements.namedItem(n) as HTMLInputElement).value || '').trim();
    const venc = Number(v('vencedores') || '1');
    if (!v('titulo')) return erro('Dê um nome para o sorteio.', 'titulo');
    if (!Number.isInteger(venc) || venc < 1 || venc > 50) return erro('Em "Vencedores", ponha um número de 1 a 50.', 'vencedores');
    const minutos = Number(v('duracao') || '0');
    const agora = Date.now();
    const fechaEm = minutos ? Timestamp.fromMillis(agora + minutos * MIN) : null;
    // some da lista 7 dias depois de fechar sem sorteio (ou 7 dias depois de abrir, se não tiver prazo)
    const expiraEm = Timestamp.fromMillis((fechaEm ? fechaEm.toMillis() : agora) + 7 * DIA);
    const b = novo.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const solta = ocupa(b, 'Abrindo…')!;
    erro('');
    let premioInfo: PremioInfo | null = null;
    try { premioInfo = await lerPremio(novo); }
    catch (err) { solta(); return erro((err as Error).message, novo.querySelector<HTMLInputElement>('[data-p]:not([hidden]) input')?.name); }
    if (!premioInfo) {
      solta();
      const tipo = novo.querySelector<HTMLInputElement>('input[name="premioTipo"]:checked')?.value ?? 'item';
      const falta = { item: 'Digite o nome do item em inglês e escolha na lista.', gemas: 'Diga quantas gemas vai sortear.', ouro: 'Diga quanto ouro vai sortear.', texto: 'Escreva qual é o prêmio.' }[tipo] ?? 'Escolha o prêmio.';
      return erro(`Falta o prêmio. ${falta}`, novo.querySelector<HTMLInputElement>('[data-p]:not([hidden]) input')?.name);
    }
    const premio = textoPremio(premioInfo);
    try {
      const u = await eu();
      const ref = doc(collection(d, 'sorteios'));
      const token = novoToken();
      const google = (novo.elements.namedItem('google') as HTMLInputElement).checked;
      const aceite = (novo.elements.namedItem('aceite') as HTMLInputElement | null)?.checked ?? false;
      const lote = writeBatch(d);
      lote.set(doc(d, 'donos', u.uid), { ultimo: serverTimestamp() });
      lote.set(ref, {
        titulo: v('titulo'), premio: premio.slice(0, 120), premioInfo, descricao: v('descricao'), vencedores: venc, dono: u.uid,
        criadoEm: serverTimestamp(), fechaEm, aberto: true, resultado: null, expiraEm, google, aceite, ausentes: [], historico: [], tirados: [],
      });
      lote.set(doc(d, 'sorteios', ref.id, 'privado', 'chave'), { token, expiraEm: Timestamp.fromMillis(agora + 16 * DIA) });
      await lote.commit();
      grava(chaveOrg(ref.id), token);
      await navigator.clipboard.writeText(`**${v('titulo')}**${premio ? ` · ${premio}` : ''}\nEntre e ponha sua conta do jogo: ${linkDe(ref.id)}`).catch(() => {});
      location.href = `/sorteio.html?s=${ref.id}`;
    } catch (err) {
      console.warn('sorteio ao vivo: não abriu', err);
      erro('Não deu para abrir o sorteio. Se você acabou de abrir outro, espere 1 minuto e tente de novo. Se não, confira sua internet.');
    } finally { solta(); }
  });

  // sorteios abertos por este navegador
  const ul = el.querySelector<HTMLUListElement>('[data-meus]')!;
  eu().then((u) => onSnapshot(query(collection(d, 'sorteios'), where('dono', '==', u.uid), limit(20)), (snap) => {
    const meus = snap.docs.map((x) => ({ id: x.id, s: x.data() as Sorteio }))
      .filter((x) => x.s.expiraEm.toMillis() > Date.now() && !x.s.resultado) // sorteado vai para Ganhadores
      .sort((a, b) => (b.s.criadoEm?.toMillis() ?? 0) - (a.s.criadoEm?.toMillis() ?? 0));
    el.querySelector<HTMLElement>('[data-meus-bloco]')!.hidden = meus.length === 0;
    ul.innerHTML = meus.map(({ id, s }) => {
      const estado = s.resultado ? '<span class="selo-estado is-sorteado">Sorteado</span>' : aberto(s) ? '<span class="selo-estado is-aberto">Aberto</span>' : '<span class="selo-estado is-fechado">Fechado</span>';
      return `<li class="online-item"><p class="online-item-titulo"><a href="/sorteio.html?s=${esc(id)}">${esc(s.titulo)}</a></p><p class="online-item-meta">${estado}<span>${esc(vencedoresTxt(s.vencedores))}</span>${s.criadoEm ? `<span>Aberto em ${esc(dataHora(s.criadoEm))}</span>` : ''}</p></li>`;
    }).join('');
  }, () => { el.querySelector<HTMLElement>('[data-meus-bloco]')!.hidden = true; })).catch(() => { /* sem conexão: a lista só não aparece */ });
}
