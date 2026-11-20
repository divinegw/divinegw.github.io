// API oficial do Guild Wars 2 (api.guildwars2.com), chamada direto do navegador.
// A chave de API é colada pela pessoa, usada só nas chamadas abaixo e nunca é salva nem enviada a outro lugar.
// Ver os membros de uma guilda exige a chave de quem é LÍDER da guilda, com a permissão "guilds".

const API = 'https://api.guildwars2.com/v2';

export interface Guilda { id: string; nome: string; tag: string }
export interface Membro { nome: string; rank: string; entrou: string | null }

async function pede<T>(caminho: string, chave: string): Promise<T> {
  const sep = caminho.includes('?') ? '&' : '?';
  const r = await fetch(`${API}${caminho}${sep}access_token=${encodeURIComponent(chave.trim())}&v=2024-07-20T00:00:00Z`);
  if (r.status === 401 || r.status === 403) throw new Error('A API do jogo recusou a chave. Confira se ela está completa e tem as permissões "account" e "guilds".');
  if (!r.ok) throw new Error(`A API do jogo respondeu com erro ${r.status}. Tente de novo em alguns minutos.`);
  return r.json() as Promise<T>;
}

/** Guildas em que a dona da chave é líder (só essas deixam ver os membros). */
export async function guildasLideradas(chave: string): Promise<Guilda[]> {
  const conta = await pede<{ guild_leader?: string[] }>('/account', chave);
  const ids = conta.guild_leader ?? [];
  return Promise.all(ids.map(async (id) => {
    const g = await pede<{ name: string; tag: string }>(`/guild/${id}`, chave);
    return { id, nome: g.name, tag: g.tag };
  }));
}

export async function membros(chave: string, guilda: string): Promise<Membro[]> {
  const lista = await pede<{ name: string; rank: string; joined: string | null }[]>(`/guild/${guilda}/members`, chave);
  return lista
    .filter((m) => m.rank !== 'invited')
    .map((m) => ({ nome: m.name, rank: m.rank, entrou: m.joined }));
}
