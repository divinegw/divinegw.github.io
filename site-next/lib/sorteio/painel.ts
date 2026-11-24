// Contas e textos do painel do sorteio (?s=<id>), sem React e sem DOM: dá para testar em Node.
// As regras e as frases vêm de site-astro/src/scripts/sorteio-online.ts e do protótipo aprovado
// (design-system/publicar/prototipo-sorteio.html, tela Painel).
import { chaveDe } from './ao-vivo';
import { textoPremio, type PremioInfo } from './premio';

export type Fase = 'inscricoes' | 'sorteando' | 'resultado' | 'confirmacao';
export type FaseAceite = 'conta' | 'fim' | 'ok';

/** Os mesmos limites do site de hoje: 1 min para confirmar, últimos 10 s em laranja. */
export const URGENTE_MS = 10_000;

interface Carimbo { toMillis(): number }
interface SorteioMin { aberto: boolean; resultado: unknown; fechaEm: Carimbo | null }

/** Inscrições abertas agora: ligado, sem resultado e dentro do prazo. */
export const estaAberto = (s: SorteioMin, agora: number) => s.aberto && !s.resultado && (!s.fechaEm || s.fechaEm.toMillis() > agora);

// ---------------------------------------------------------------- relógio
const dois = (n: number) => String(n).padStart(2, '0');

/** Quanto falta para o relógio grande: 13:23, 1:05:09, 2 d 03 h. Nunca negativo. */
export function formatarRelogio(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (d >= 1) return `${d} d ${dois(h)} h`;
  if (h >= 1) return `${h}:${dois(m)}:${dois(s)}`;
  return `${m}:${dois(s)}`;
}

const un = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** O mesmo tempo por extenso, para o leitor de tela: "13 minutos e 23 segundos". */
export function tempoPorExtenso(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (d >= 1) return `${un(d, 'dia', 'dias')} e ${un(h, 'hora', 'horas')}`;
  if (h >= 1) return `${un(h, 'hora', 'horas')} e ${un(m, 'minuto', 'minutos')}`;
  if (m >= 1) return `${un(m, 'minuto', 'minutos')} e ${un(s, 'segundo', 'segundos')}`;
  return un(s, 'segundo', 'segundos');
}

// ---------------------------------------------------------------- confirmação do prêmio
export interface Ganhador { nome: string; chave: string; ok: boolean }

/** Quem ganhou e já aceitou. `fase`: 'ok' todo mundo aceitou, 'conta' ainda dá tempo, 'fim' o minuto acabou. */
export function estadoDoAceite(r: { ganhadores: string[]; prazo?: Carimbo | null }, aceitos: Set<string>, agora: number) {
  const ganhadores: Ganhador[] = r.ganhadores.map((nome) => ({ nome, chave: chaveDe(nome), ok: aceitos.has(chaveDe(nome)) }));
  const resta = r.prazo ? r.prazo.toMillis() - agora : 0;
  const fase: FaseAceite = ganhadores.every((g) => g.ok) ? 'ok' : resta > 0 ? 'conta' : 'fim';
  return { ganhadores, resta, fase, urgente: fase === 'conta' && resta <= URGENTE_MS };
}

// ---------------------------------------------------------------- textos que vão para a área de transferência
const premioDe = (s: { premio: string; premioInfo?: PremioInfo | null }) => (s.premioInfo ? textoPremio(s.premioInfo) : s.premio);

export type Convite = 'curto' | 'completo' | 'prazo';

/** Os convites do botão "Copiar link". `Convite` com prazo usa o horário do Discord (<t:...:R>), que cada pessoa vê no seu fuso. */
export function textoConviteDiscord(tipo: Convite, s: { titulo: string; premio: string; premioInfo?: PremioInfo | null; vencedores: number; fechaEm: Carimbo | null }, link: string): string {
  const premio = premioDe(s);
  if (tipo === 'curto') return `**Sorteio: ${premio || s.titulo}**\nParticipe com seu ID: ${link}`;
  if (tipo === 'completo') return `**${s.titulo}**\n${premio ? `Prêmio: ${premio}\n` : ''}Participe com seu ID: ${link}\n-# Digite seu ID com os 4 números, como Joana.1234`;
  const quando = s.fechaEm ? `Inscrições fecham <t:${Math.floor(s.fechaEm.toMillis() / 1000)}:R>\n` : '';
  return `**${s.titulo}**\n${premio ? `Prêmio: ${premio} · ${un(s.vencedores, 'vencedor', 'vencedores')}\n` : ''}${quando}Participe com seu ID: ${link}`;
}

/** "Copiar resultado": o texto para colar no Discord. `naoAceitaram` saem da lista de quem leva. */
export function textoResultado(s: { titulo: string; premio: string; premioInfo?: PremioInfo | null }, r: { ganhadores: string[]; codigo: string }, naoAceitaram: string[], origem: string): string {
  const premio = premioDe(s);
  const fora = new Set(naoAceitaram);
  const levam = r.ganhadores.filter((n) => !fora.has(n));
  return `**${s.titulo}**${premio ? ` · ${premio}` : ''}\n${levam.map((n, i) => (levam.length > 1 ? `${i + 1}º ${n}` : n)).join('\n')}${fora.size ? `\nNão aceitaram a tempo: ${[...fora].join(', ')}` : ''}\nCódigo: ${r.codigo}\nConfira em ${origem}/sorteio/ganhadores.html`;
}

// ---------------------------------------------------------------- lista de pessoas
/** Iniciais para a bolinha ao lado do nome: o primeiro "grafema" de até 2 palavras; emoji vale sozinho. Só decoração (aria-hidden). */
export function iniciais(conta: string): string {
  const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }) : null;
  const primeiro = (w: string) => (seg ? ([...seg.segment(w)][0]?.segment ?? '') : [...w][0] ?? '');
  const palavras = conta.replace(/\.\d{4}$/, '').replace(/<[^>]*>/g, '').split(/\s+/).filter((w) => /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(w));
  if (palavras[0] && /^\p{Extended_Pictographic}/u.test(palavras[0])) return primeiro(palavras[0]);
  const tira = (w: string) => w.replace(/^[^\p{L}\p{N}\p{Extended_Pictographic}]+/u, '');
  return palavras.slice(0, 2).map((w) => primeiro(tira(w))).join('').toLocaleUpperCase('pt-BR') || '?';
}
