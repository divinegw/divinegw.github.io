// Regras do formulário "Com inscrição" (as do site de hoje: site-astro/src/pages/sorteio.astro e sorteio-online.ts).
// Sem DOM: dá para testar em Node.
import { EXPANSOES, textoPremio, type PremioInfo, type TipoPremio } from './premio';

export const TIPOS_PREMIO: { valor: TipoPremio; rotulo: string }[] = [
  { valor: 'item', rotulo: 'Item do jogo' },
  { valor: 'gemas', rotulo: 'Gemas' },
  { valor: 'ouro', rotulo: 'Ouro' },
  { valor: 'expansao', rotulo: 'Expansão' },
  { valor: 'texto', rotulo: 'Outro prêmio' },
];
export const DURACOES: { min: number; rotulo: string }[] = [
  { min: 5, rotulo: '5 minutos' }, { min: 10, rotulo: '10 minutos' }, { min: 15, rotulo: '15 minutos' }, { min: 30, rotulo: '30 minutos' },
  { min: 60, rotulo: '1 hora' }, { min: 180, rotulo: '3 horas' }, { min: 1440, rotulo: '1 dia' }, { min: 4320, rotulo: '3 dias' },
  { min: 10080, rotulo: '7 dias' }, { min: 0, rotulo: 'Sem prazo (você encerra)' },
];
export const LIMITES = { titulo: 80, descricao: 300, textoPremio: 80, vencedores: 50, qtdItem: 250, gemas: 100_000, ouro: 1_000_000 } as const;
export const EXPANSOES_OPCOES = EXPANSOES.map((e) => ({ valor: e.nome, rotulo: `${e.nome} (${e.sigla})` }));

/** Número inteiro de 1 a `max`. Campo vazio vira `vazio`; fora da faixa ou quebrado vira `invalido`. */
export function lerInteiro(texto: string, max: number): { ok: true; valor: number } | { ok: false; motivo: 'vazio' | 'invalido' } {
  const t = texto.trim();
  if (!t) return { ok: false, motivo: 'vazio' };
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= max ? { ok: true, valor: n } : { ok: false, motivo: 'invalido' };
}
export const msgFaixa = (max: number) => `Use um número de 1 a ${max.toLocaleString('pt-BR')}.`;

/** O texto que vai para a área de transferência: o que o Discord mostra bonito. */
export const textoConvite = (titulo: string, premio: PremioInfo | null, link: string) => {
  const nome = premio ? textoPremio(premio) : '';
  return `**${titulo}**${nome ? ` · ${nome}` : ''}\nEntre e ponha sua conta do jogo: ${link}`;
};
