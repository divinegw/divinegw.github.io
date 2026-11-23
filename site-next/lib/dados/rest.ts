// Leitura leve do Firestore pela API REST, sem o SDK do Firebase (porte de site-astro/src/scripts/sorteio-vivo.ts).
// A REST obedece às mesmas regras do banco. Serve para a abertura da página: lista os sorteios abertos sem baixar o SDK.
// Este arquivo NÃO importa "firebase/*" (só lib/dados/firebase.ts importa).
import { FIREBASE } from '@/conteudo/sorteio';
import type { PremioInfo } from '@/lib/sorteio/premio';

type Rest = {
  stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; timestampValue?: string; nullValue?: null;
  mapValue?: { fields?: Record<string, Rest> }; arrayValue?: { values?: Rest[] };
};

/** Converte um valor da REST em valor comum. Timestamp vira milissegundos. */
export function deRest(v: Rest | undefined): unknown {
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

/** Um sorteio como a REST devolve (datas em milissegundos). */
export interface SorteioRest {
  id: string; titulo: string; premio: string; premioInfo: PremioInfo | null; descricao: string; vencedores: number;
  aberto: boolean; fechaEm: number | null; criadoEm: number; resultado: { ganhadores: string[] } | null;
}
export interface SorteioAberto extends SorteioRest { inscritos: number | null }

/** Aberto de verdade: sem resultado, com inscrições abertas e dentro do prazo. */
export const estaAberto = (s: Pick<SorteioRest, 'aberto' | 'resultado' | 'fechaEm'>, agora = Date.now()) =>
  !s.resultado && s.aberto && (s.fechaEm === null || s.fechaEm > agora);

function config() {
  if (!FIREBASE) throw new Error('O sorteio ao vivo não está ligado neste site.');
  return FIREBASE;
}
const base = (projectId: string) => `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
/** Corta a espera em 10 s e respeita o cancelamento de quem chamou. */
const prazo = (sinal?: AbortSignal) => (sinal && 'any' in AbortSignal ? AbortSignal.any([sinal, AbortSignal.timeout(10_000)]) : sinal ?? AbortSignal.timeout(10_000));

async function consulta(structuredQuery: object, sinal?: AbortSignal) {
  const c = config();
  const r = await fetch(`${base(c.projectId)}:runQuery?key=${c.apiKey}`, { method: 'POST', body: JSON.stringify({ structuredQuery }), signal: prazo(sinal) });
  if (!r.ok) throw new Error(String(r.status));
  const linhas = (await r.json()) as { document?: { name: string; fields?: Record<string, Rest> } }[];
  return linhas.filter((l) => l.document).map(({ document: d }) => ({ id: d!.name.split('/').pop()!, ...(deRest({ mapValue: { fields: d!.fields } }) as Record<string, unknown>) }));
}

/** Quantos inscritos o sorteio tem agora. `null` se não deu para contar. */
export async function contarInscritos(id: string, sinal?: AbortSignal): Promise<number | null> {
  const c = config();
  const r = await fetch(`${base(c.projectId)}/sorteios/${encodeURIComponent(id)}:runAggregationQuery?key=${c.apiKey}`, {
    method: 'POST', signal: prazo(sinal),
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'inscritos' }] }, aggregations: [{ alias: 'n', count: {} }] } }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { result?: { aggregateFields?: { n?: Rest } } }[];
  return Number(deRest(j[0]?.result?.aggregateFields?.n) ?? 0);
}

/** Os sorteios com inscrição aberta agora: o que fecha primeiro vem antes (sem prazo por último). Até 12, cada um com a contagem de inscritos.
 *  Falha (rede, 4xx/5xx) vira exceção: quem chama mostra "Não deu para carregar". */
export async function lerAbertos(sinal?: AbortSignal): Promise<SorteioAberto[]> {
  const ss = (await consulta({
    from: [{ collectionId: 'sorteios' }],
    where: { fieldFilter: { field: { fieldPath: 'expiraEm' }, op: 'GREATER_THAN', value: { timestampValue: new Date().toISOString() } } },
    orderBy: [{ field: { fieldPath: 'expiraEm' }, direction: 'ASCENDING' }],
    limit: 20,
  }, sinal)) as unknown as SorteioRest[];
  const agora = Date.now();
  const abertos = ss.filter((s) => estaAberto(s, agora))
    .sort((a, b) => (a.fechaEm ?? Infinity) - (b.fechaEm ?? Infinity) || b.criadoEm - a.criadoEm)
    .slice(0, 12);
  const contas = await Promise.all(abertos.map((s) => contarInscritos(s.id, sinal).catch(() => null)));
  return abertos.map((s, i) => ({ ...s, inscritos: contas[i] }));
}
