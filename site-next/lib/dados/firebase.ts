// Camada de dados do sorteio ao vivo: o ÚNICO arquivo do site-next que importa "firebase/*".
// Extraída de site-astro/src/scripts/sorteio-online.ts (Etapa 2a), sem DOM. Só roda no navegador:
// nada aqui acessa window no topo do módulo, e `iniciar()` recusa rodar na build.
//
// O site novo e o atual usam o MESMO banco (projeto divine-sorteio) e as mesmas regras
// (site-astro/firebase/firestore.rules). Por isso a forma dos documentos é idêntica à de hoje.
// Não crie nem renomeie campo aqui sem mudar as regras e o site atual juntos.
//   donos/{uid}                         ultimo: quando este aparelho abriu o último sorteio (1 por minuto)
//   sorteios/{id}                       titulo, premio, premioInfo, descricao, vencedores, dono, criadoEm, fechaEm, aberto,
//                                       resultado, expiraEm, google, aceite, ausentes, historico, tirados
//   sorteios/{id}/inscritos/{chave}     conta (Nome.1234), em, uid, expiraEm. Chave = conta em minúsculas
//   sorteios/{id}/aparelhos/{uid}       chave: marca de "este aparelho já se inscreveu"
//   sorteios/{id}/aceites/{chave}       em, expiraEm: quem ganhou e aceitou o prêmio
//   sorteios/{id}/privado/chave         token do link de organizador (só organizador lê)
//   sorteios/{id}/organizadores/{uid}   quem abriu o link de organizador em outro navegador/aparelho
//   registros/{id}                      registro permanente do resultado (aba Ganhadores)
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, limit, orderBy, arrayUnion,
  serverTimestamp, Timestamp, writeBatch, getDocs, type Firestore,
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithCredential,
  type Auth, type User,
} from 'firebase/auth';
import { FIREBASE } from '@/conteudo/sorteio';
import { novoCodigo } from '@/lib/sorteio/aleatorio';
import { sortearAoVivo, chaveDe, type Inscrito } from '@/lib/sorteio/ao-vivo';
import type { PremioInfo } from '@/lib/sorteio/premio';

export type { Inscrito, PremioInfo };
export type Carimbo = Timestamp;

// ---------------------------------------------------------------- tipos (mesmos campos de hoje)
export interface Resultado {
  ganhadores: string[]; codigo: string; impressao: string; total: number; excluidos: string[]; em?: Timestamp | null;
  prazo?: Timestamp | null; // até quando quem ganhou pode aceitar (sorteio com aceite)
  mantidos?: string[];      // ganhadores que já tinham aceitado quando os outros foram trocados
}
export interface Sorteio {
  titulo: string; premio: string; descricao: string; vencedores: number; dono: string;
  criadoEm?: Timestamp; fechaEm: Timestamp | null; aberto: boolean; resultado: Resultado | null; expiraEm: Timestamp;
  google?: boolean; historico?: Resultado[]; tirados?: string[]; premioInfo?: PremioInfo | null;
  aceite?: boolean; ausentes?: string[];
}
/** Registro permanente (aba Ganhadores). `data` em milissegundos, como o site atual lê. */
export interface Registro {
  id: string; titulo: string; premio: string; premioInfo: PremioInfo | null; ganhadores: string[]; codigo: string; impressao: string;
  total: number; excluidos: string[]; participantes: string[]; refeito: number; data: number;
  mantidos?: string[]; ausentes?: string[];
}
/** O que a pessoa preenche para abrir um sorteio. */
export interface NovoSorteio {
  titulo: string; descricao: string; vencedores: number;
  duracaoMin: number;          // 0 = sem prazo (fecha quando quem organiza encerrar)
  premio: string;              // texto do prêmio (cortado em 120 caracteres, como hoje)
  premioInfo: PremioInfo | null;
  google: boolean; aceite: boolean;
}
export interface Usuario { uid: string; google: boolean }
export interface Conexao {
  organizador: boolean;
  tokenRecusado: boolean;      // havia token guardado, mas as regras não aceitaram (link de organizador de outro sorteio)
  chaveMinha: string | null;   // chave da inscrição feita por este aparelho
}
export interface MeuSorteio { id: string; s: Sorteio }

/** Erro com código, para a tela escolher a mensagem. */
export class ErroSorteio extends Error {
  constructor(public codigo: 'sem-inscritos' | 'sem-livres' | 'limite-refeito' | 'sem-firebase' | 'so-navegador', mensagem: string) {
    super(mensagem);
    this.name = 'ErroSorteio';
  }
}

// ---------------------------------------------------------------- prazos (iguais aos de hoje)
export const MIN = 60_000;
export const HORA = 60 * MIN;
export const DIA = 24 * HORA;
export const PRAZO_ACEITE = MIN;       // quem ganhou tem 1 minuto para aceitar
export const EXPIRA_APOIO = 16 * DIA;  // inscritos, aparelhos, aceites, organizadores e chave privada
export const EXPIRA_SEM_SORTEIO = 7 * DIA; // some 7 dias depois de fechar sem sorteio
export const EXPIRA_RESULTADO = DIA;   // o resultado fica no ar por 24 h
export const MAX_REFEITOS = 20;

// ---------------------------------------------------------------- utilitários
export const temGoogle = (u: User | null) => Boolean(u?.providerData.some((p) => p.providerId === 'google.com'));
export const sorteioAberto = (s: Sorteio) => s.aberto && !s.resultado && (!s.fechaEm || s.fechaEm.toMillis() > Date.now());
export const linkDe = (id: string, origem: string) => `${origem}/sorteio.html?s=${id}`;
const apoio = () => Timestamp.fromMillis(Date.now() + EXPIRA_APOIO);
const chaveOrg = (id: string) => `divine-org-${id}`;
const le = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const grava = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const novoToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
const comoErro = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

// ---------------------------------------------------------------- início (app, Firestore e Auth, uma vez só)
let db: Firestore | null = null;
let auth: Auth | null = null;
let usuario: Promise<User> | null = null;

/** Liga o Firebase. Só no navegador; chamar de novo não faz nada. `config` padrão: conteudo/sorteio.ts. */
export function iniciar(config: FirebaseOptions | null = FIREBASE): void {
  if (typeof window === 'undefined') throw new ErroSorteio('so-navegador', 'O sorteio ao vivo só roda no navegador.');
  if (db) return;
  if (!config) throw new ErroSorteio('sem-firebase', 'O sorteio ao vivo não está ligado neste site.');
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
}
function banco(): Firestore { iniciar(); return db!; }
function autenticacao(): Auth { iniciar(); return auth!; }
const comoUsuario = (u: User): Usuario => ({ uid: u.uid, google: temGoogle(u) });

/** Login anônimo: a pessoa não vê nada; o navegador ganha um id que fica guardado nele.
 *  Se falhar (sem internet, Firebase fora), a próxima chamada tenta de novo, em vez de ficar presa no erro. */
function garante(): Promise<User> {
  const a = autenticacao();
  if (a.currentUser) return Promise.resolve(a.currentUser);
  return (usuario ??= new Promise<User>((ok, falha) => {
    const parar = onAuthStateChanged(a, (u) => {
      if (u) { parar(); ok(u); return; }
      signInAnonymously(a).catch((e) => { parar(); usuario = null; falha(e); });
    });
  }));
}

/** Entra (login anônimo, invisível) e devolve o aparelho. */
export async function entrar(): Promise<Usuario> { return comoUsuario(await garante()); }

/** Quem está logado agora, sem esperar login. */
export function usuarioAtual(): Usuario | null {
  const u = autenticacao().currentUser;
  return u ? comoUsuario(u) : null;
}

/** Modo rigoroso: liga a conta Google ao login anônimo. Se essa conta Google já foi usada antes, entra com ela. */
export async function ligarGoogle(): Promise<Usuario> {
  const a = autenticacao();
  await garante();
  const provedor = new GoogleAuthProvider();
  provedor.setCustomParameters({ prompt: 'select_account' });
  try {
    const r = await linkWithPopup(a.currentUser!, provedor);
    await r.user.getIdToken(true);
    return comoUsuario(r.user);
  } catch (err) {
    const cred = GoogleAuthProvider.credentialFromError(err as never);
    if ((err as { code?: string }).code === 'auth/credential-already-in-use' && cred) {
      const r = await signInWithCredential(a, cred);
      await r.user.getIdToken(true);
      return comoUsuario(r.user);
    }
    throw err;
  }
}

// ---------------------------------------------------------------- criar sorteio
/** Abre um sorteio: donos/{uid} (freio de 1 por minuto), o sorteio e a chave privada, num lote só.
 *  Guarda o token neste navegador. Devolve o id e o token do link de organizador. */
export async function criarSorteio(dados: NovoSorteio): Promise<{ id: string; token: string }> {
  const d = banco();
  const u = await garante();
  const agora = Date.now();
  const fechaEm = dados.duracaoMin ? Timestamp.fromMillis(agora + dados.duracaoMin * MIN) : null;
  // some da lista 7 dias depois de fechar sem sorteio (ou 7 dias depois de abrir, se não tiver prazo)
  const expiraEm = Timestamp.fromMillis((fechaEm ? fechaEm.toMillis() : agora) + EXPIRA_SEM_SORTEIO);
  const ref = doc(collection(d, 'sorteios'));
  const token = novoToken();
  const lote = writeBatch(d);
  lote.set(doc(d, 'donos', u.uid), { ultimo: serverTimestamp() });
  lote.set(ref, {
    titulo: dados.titulo, premio: dados.premio.slice(0, 120), premioInfo: dados.premioInfo, descricao: dados.descricao,
    vencedores: dados.vencedores, dono: u.uid, criadoEm: serverTimestamp(), fechaEm, aberto: true, resultado: null, expiraEm,
    google: dados.google, aceite: dados.aceite, ausentes: [], historico: [], tirados: [],
  });
  lote.set(doc(d, 'sorteios', ref.id, 'privado', 'chave'), { token, expiraEm: Timestamp.fromMillis(agora + EXPIRA_APOIO) });
  await lote.commit();
  grava(chaveOrg(ref.id), token);
  return { id: ref.id, token };
}

// ---------------------------------------------------------------- ouvir (todas devolvem a função que cancela)
type Falha = (erro: Error) => void;

/** Ouve o sorteio. `null` = não existe (acabou, foi apagado ou o link está errado). */
export function ouvirSorteio(id: string, aoMudar: (s: Sorteio | null) => void, aoFalhar?: Falha): () => void {
  return onSnapshot(doc(banco(), 'sorteios', id), (snap) => {
    aoMudar(snap.exists() ? (snap.data({ serverTimestamps: 'estimate' }) as Sorteio) : null);
  }, (e) => aoFalhar?.(comoErro(e)));
}

/** Ouve os inscritos, já em ordem de chave. */
export function ouvirInscritos(id: string, aoMudar: (inscritos: Inscrito[]) => void, aoFalhar?: Falha): () => void {
  return onSnapshot(collection(banco(), 'sorteios', id, 'inscritos'), (snap) => {
    aoMudar(snap.docs.map((x) => ({ chave: x.id, conta: String(x.data().conta) })).sort((a, b) => (a.chave < b.chave ? -1 : 1)));
  }, (e) => aoFalhar?.(comoErro(e)));
}

/** Ouve quem já aceitou o prêmio (chaves das contas). */
export function ouvirAceites(id: string, aoMudar: (chaves: Set<string>) => void, aoFalhar?: Falha): () => void {
  return onSnapshot(collection(banco(), 'sorteios', id, 'aceites'), (snap) => {
    aoMudar(new Set(snap.docs.map((x) => x.id)));
  }, (e) => aoFalhar?.(comoErro(e)));
}

/** Ouve os sorteios abertos por este aparelho que ainda não saíram do ar nem foram sorteados, do mais novo ao mais antigo. */
export function ouvirMeusSorteios(aoMudar: (meus: MeuSorteio[]) => void, aoFalhar?: Falha): () => void {
  let cancelado = false;
  let parar: (() => void) | null = null;
  garante().then((u) => {
    if (cancelado) return;
    parar = onSnapshot(query(collection(banco(), 'sorteios'), where('dono', '==', u.uid), limit(20)), (snap) => {
      aoMudar(snap.docs.map((x) => ({ id: x.id, s: x.data() as Sorteio }))
        .filter((x) => x.s.expiraEm.toMillis() > Date.now() && !x.s.resultado) // sorteado vai para Ganhadores
        .sort((a, b) => (b.s.criadoEm?.toMillis() ?? 0) - (a.s.criadoEm?.toMillis() ?? 0)));
    }, (e) => aoFalhar?.(comoErro(e)));
  }).catch((e) => aoFalhar?.(comoErro(e)));
  return () => { cancelado = true; parar?.(); };
}

// ---------------------------------------------------------------- organizador (token, organizadores, chave privada)
/** Link de organizador (?org=...): guarda a chave neste navegador. Quem chama tira o token da barra de endereço. */
export function guardarToken(id: string, token: string): void { grava(chaveOrg(id), token); }

/** Token do link de organizador: do navegador ou, para quem organiza, da chave privada no banco. `null` se não achar. */
export async function tokenOrganizador(id: string): Promise<string | null> {
  let token = le(chaveOrg(id));
  if (!token) {
    const x = await getDoc(doc(banco(), 'sorteios', id, 'privado', 'chave')).catch(() => null);
    token = x?.exists() ? String(x.data().token) : null;
    if (token) grava(chaveOrg(id), token);
  }
  return token;
}

/** Depois de entrar (ou de trocar de conta, no modo rigoroso): este aparelho organiza? já se inscreveu?
 *  Quem tem o token do link de organizador vira organizador (documento em organizadores/{uid}). */
export async function conectar(id: string, uid: string): Promise<Conexao> {
  const d = banco();
  const dono = await getDoc(doc(d, 'sorteios', id)).then((x) => x.data()?.dono === uid).catch(() => false);
  let organizador = dono || Boolean((await getDoc(doc(d, 'sorteios', id, 'organizadores', uid)).catch(() => null))?.exists());
  const token = le(chaveOrg(id));
  let tokenRecusado = false;
  if (!organizador && token) {
    organizador = await setDoc(doc(d, 'sorteios', id, 'organizadores', uid), { token, expiraEm: apoio() }).then(() => true).catch(() => false);
    tokenRecusado = !organizador;
  }
  const marca = await getDoc(doc(d, 'sorteios', id, 'aparelhos', uid)).catch(() => null);
  return { organizador, tokenRecusado, chaveMinha: marca?.exists() ? String(marca.data().chave) : null };
}

// ---------------------------------------------------------------- inscrever, aceitar, tirar
/** Inscreve a conta (já validada) e marca o aparelho, no mesmo lote. Devolve a chave da inscrição. */
export async function inscrever(id: string, conta: string): Promise<string> {
  const d = banco();
  const u = await garante();
  const chave = chaveDe(conta);
  const expiraEm = apoio();
  const lote = writeBatch(d);
  lote.set(doc(d, 'sorteios', id, 'inscritos', chave), { conta, em: serverTimestamp(), uid: u.uid, expiraEm });
  lote.set(doc(d, 'sorteios', id, 'aparelhos', u.uid), { chave, expiraEm });
  await lote.commit();
  return chave;
}

/** Quem ganhou aceita o prêmio (dentro do prazo, pelas regras). */
export async function aceitar(id: string, chave: string): Promise<void> {
  await setDoc(doc(banco(), 'sorteios', id, 'aceites', chave), { em: serverTimestamp(), expiraEm: apoio() });
}

/** Tira um inscrito; o nome vai para a lista pública de tirados, na mesma gravação. */
export async function tirarParticipante(id: string, chave: string, conta: string): Promise<void> {
  const d = banco();
  const b = writeBatch(d);
  b.delete(doc(d, 'sorteios', id, 'inscritos', chave));
  b.update(doc(d, 'sorteios', id), { tirados: arrayUnion(conta) });
  await b.commit();
}

// ---------------------------------------------------------------- abrir e fechar inscrições
export async function encerrarInscricoes(id: string): Promise<void> { await updateDoc(doc(banco(), 'sorteios', id), { aberto: false }); }
export async function reabrirInscricoes(id: string): Promise<void> { await updateDoc(doc(banco(), 'sorteios', id), { aberto: true, fechaEm: null }); }

// ---------------------------------------------------------------- sortear
/** Sorteia (ou sorteia de novo) com um código novo. `excluidos`: chaves de quem fica de fora (filtro da guilda).
 *  Fecha as inscrições, guarda o resultado anterior em historico e grava o registro permanente, num lote só. */
export async function sortear(id: string, s: Sorteio, inscritos: Inscrito[], excluidos: string[]): Promise<Resultado> {
  const n = inscritos.length - excluidos.length;
  if (n < 1) throw new ErroSorteio('sem-inscritos', 'Ainda não tem ninguém inscrito para sortear.');
  const anterior = s.resultado;
  if (anterior && (s.historico ?? []).length >= MAX_REFEITOS) throw new ErroSorteio('limite-refeito', `Este sorteio já foi refeito ${MAX_REFEITOS} vezes, que é o máximo. Abra um sorteio novo.`);
  const d = banco();
  const codigo = novoCodigo();
  const r = await sortearAoVivo(inscritos, excluidos, s.vencedores, codigo);
  const lote = writeBatch(d);
  lote.update(doc(d, 'sorteios', id), {
    aberto: false,
    resultado: { ...r, codigo, excluidos, mantidos: [], em: serverTimestamp(), prazo: s.aceite ? Timestamp.fromMillis(Date.now() + PRAZO_ACEITE) : null },
    ...(anterior ? { historico: [...(s.historico ?? []), anterior] } : {}),
    expiraEm: Timestamp.fromMillis(Date.now() + EXPIRA_RESULTADO), // o resultado fica no ar por 24 h
  });
  // registro permanente (aba Ganhadores): fica depois que o sorteio sai do ar, com a lista para conferir
  lote.set(doc(d, 'registros', id), {
    titulo: s.titulo, premio: s.premio, premioInfo: s.premioInfo ?? null, ganhadores: r.ganhadores, codigo,
    impressao: r.impressao, total: r.total, excluidos, participantes: inscritos.map((p) => p.conta),
    refeito: (s.historico ?? []).length + (anterior ? 1 : 0), mantidos: [], ausentes: s.ausentes ?? [], data: serverTimestamp(),
  });
  await lote.commit();
  return { ...r, codigo, excluidos, mantidos: [] };
}
/** Mesma gravação de `sortear`; o nome diz a intenção na tela (refaz tudo, com código novo). */
export const sortearDeNovo = sortear;

/** Sorteio com aceite: quem não aceitou sai; quem aceitou fica (mantidos); só as vagas abertas são sorteadas, com código novo.
 *  `aceitos`: chaves de quem já aceitou. `fora`: chaves excluídas pelo filtro da guilda. Devolve `null` se não havia ninguém a trocar. */
export async function trocarAusentes(id: string, s: Sorteio, inscritos: Inscrito[], aceitos: Set<string>, fora: string[]): Promise<Resultado | null> {
  const r = s.resultado;
  if (!r) return null;
  const mant = r.ganhadores.filter((n) => aceitos.has(chaveDe(n)));
  const sem = r.ganhadores.filter((n) => !aceitos.has(chaveDe(n)));
  const exc = [...new Set([...r.excluidos, ...fora, ...sem.map(chaveDe), ...mant.map(chaveDe)])];
  const livres = inscritos.filter((p) => !exc.includes(p.chave)).length;
  if (!sem.length) return null;
  if (livres < 1) throw new ErroSorteio('sem-livres', 'Não sobrou ninguém para sortear: todo mundo que se inscreveu já ganhou ou não aceitou.');
  if ((s.historico ?? []).length >= MAX_REFEITOS) throw new ErroSorteio('limite-refeito', `Este sorteio já foi refeito ${MAX_REFEITOS} vezes, que é o máximo. Abra um sorteio novo.`);
  const d = banco();
  const codigo = novoCodigo();
  const x = await sortearAoVivo(inscritos, exc, Math.min(sem.length, livres), codigo);
  const lote = writeBatch(d);
  lote.update(doc(d, 'sorteios', id), {
    resultado: { ganhadores: [...mant, ...x.ganhadores], codigo, impressao: x.impressao, total: r.total, excluidos: exc, mantidos: mant, em: serverTimestamp(), prazo: Timestamp.fromMillis(Date.now() + PRAZO_ACEITE) },
    historico: [...(s.historico ?? []), r],
    ausentes: arrayUnion(...sem),
    expiraEm: Timestamp.fromMillis(Date.now() + EXPIRA_RESULTADO),
  });
  lote.set(doc(d, 'registros', id), {
    titulo: s.titulo, premio: s.premio, premioInfo: s.premioInfo ?? null, ganhadores: [...mant, ...x.ganhadores], codigo,
    impressao: x.impressao, total: r.total, excluidos: exc, participantes: inscritos.map((p) => p.conta),
    refeito: (s.historico ?? []).length + 1, mantidos: mant, ausentes: [...new Set([...(s.ausentes ?? []), ...sem])], data: serverTimestamp(),
  });
  await lote.commit();
  return { ganhadores: [...mant, ...x.ganhadores], codigo, impressao: x.impressao, total: r.total, excluidos: exc, mantidos: mant };
}

// ---------------------------------------------------------------- apagar
/** Apaga o sorteio e as inscrições. Não dá para desfazer. */
export async function apagarSorteio(id: string): Promise<void> {
  const d = banco();
  const b = writeBatch(d);
  (await getDocs(collection(d, 'sorteios', id, 'inscritos'))).docs.forEach((x) => b.delete(x.ref));
  b.delete(doc(d, 'sorteios', id));
  await b.commit();
}

// ---------------------------------------------------------------- ganhadores (registros permanentes)
const deRegistro = (x: { id: string; data(): Record<string, unknown> }): Registro => {
  const v = x.data();
  const em = v.data as Timestamp | null | undefined;
  return { ...(v as unknown as Registro), id: x.id, data: em ? em.toMillis() : 0 };
};

/** Os registros mais novos primeiro (até 30, como na aba Ganhadores de hoje; as regras aceitam no máximo 50). */
export async function lerRegistros(quantos = 30): Promise<Registro[]> {
  const snap = await getDocs(query(collection(banco(), 'registros'), orderBy('data', 'desc'), limit(Math.min(quantos, 50))));
  return snap.docs.map(deRegistro);
}

/** Acha o registro pelo código (o código já limpo, com hífens). `null` se não existir. */
export async function lerRegistroPorCodigo(codigo: string): Promise<Registro | null> {
  const snap = await getDocs(query(collection(banco(), 'registros'), where('codigo', '==', codigo), limit(1)));
  return snap.docs[0] ? deRegistro(snap.docs[0]) : null;
}
