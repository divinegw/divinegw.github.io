// Cópia de site-astro/src/lib/sorteio/ao-vivo.ts (Etapa 2a). Não mude o sorteio: os testes de referência garantem o mesmo resultado.
// A conta do sorteio ao vivo, usada para sortear (sorteio-online.ts) e para conferir (sorteio-vivo.ts).
// Inscritos (menos os excluídos) em ordem de chave, embaralhados pelo código: com a mesma lista e o mesmo código,
// qualquer pessoa chega ao mesmo resultado.
import { gerador, comPeso, impressao } from './aleatorio';

/** `uid`: o aparelho que fez a inscrição (campo do documento). Só quem organiza usa, para o "Tirar" apagar também a marca do aparelho. */
export interface Inscrito { chave: string; conta: string; uid?: string }

export const chaveDe = (conta: string) => conta.toLocaleLowerCase('pt-BR');

export async function sortearAoVivo(inscritos: Inscrito[], excluidos: string[], vencedores: number, codigo: string) {
  const fora = new Set(excluidos);
  const ps = inscritos.filter((p) => !fora.has(p.chave)).sort((a, b) => (a.chave < b.chave ? -1 : 1)).map((p) => ({ ...p, bilhetes: 1 }));
  const g = await gerador(codigo, 'online');
  const saiu = comPeso(g, ps, Math.min(vencedores, ps.length));
  return { ganhadores: saiu.map((p) => p.conta), total: ps.length, impressao: await impressao(ps.map((p) => p.chave).join('\n')) };
}

/** Refaz o sorteio com a lista guardada e diz se bate com o resultado registrado.
 *  `mantidos`: ganhadores que já tinham aceitado quando quem não aceitou foi trocado. Eles vêm primeiro em `ganhadores`,
 *  ficam de fora da conta (estão em `excluidos`) e só as outras vagas saem do código. */
export async function confere(r: { participantes: string[]; excluidos: string[]; ganhadores: string[]; codigo: string; impressao: string; mantidos?: string[] }) {
  const m = r.mantidos ?? [];
  const x = await sortearAoVivo(r.participantes.map((c) => ({ chave: chaveDe(c), conta: c })), r.excluidos, r.ganhadores.length - m.length, r.codigo);
  return x.impressao === r.impressao && x.ganhadores.join('\n') === r.ganhadores.slice(m.length).join('\n');
}
