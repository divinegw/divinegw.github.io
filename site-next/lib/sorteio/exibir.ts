// Apoio para mostrar sorteios na tela. Nada daqui vira HTML: tudo é texto ou número.
import { textoPremio, type PremioInfo } from './premio';

/** O ícone do prêmio só vale se vier do render do jogo (as regras do banco também só aceitam esse endereço). */
export function iconeSeguro(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'render.guildwars2.com' ? u.href : null;
  } catch { return null; }
}

/** Quanto falta, curto: "13 min", "2 h", "1 dia". Menos de 1 minuto: "1 min". */
export function tempoCurto(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? 'dia' : 'dias'}`;
}
/** Falta pouco: menos de 5 minutos. */
export const fechaLogo = (ms: number) => ms < 5 * 60_000;

/** Nome do prêmio para o card: o do prêmio escolhido, ou o texto salvo, ou o nome do sorteio. */
export const nomeDoPremio = (s: { premio: string; titulo: string; premioInfo: PremioInfo | null }) =>
  (s.premioInfo ? textoPremio(s.premioInfo) : s.premio) || s.titulo;

export const pessoas = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;
