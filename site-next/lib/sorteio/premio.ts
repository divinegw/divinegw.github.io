// Cópia de site-astro/src/lib/sorteio/premio.ts (Etapa 2a). Não mude o sorteio: os testes de referência garantem o mesmo resultado.
// Prêmio do sorteio ao vivo: item do jogo (com ícone e raridade), gemas, ouro, expansão ou texto livre.
// O item é achado pelo nome na wiki oficial (busca e id) e completado pela API do jogo (ícone, raridade, tipo).
// A API não tem português: a descrição em PT-BR sai dos campos fixos (tipo e raridade), e o nome fica no original.

export type TipoPremio = 'item' | 'gemas' | 'ouro' | 'expansao' | 'texto';
export interface PremioInfo {
  tipo: TipoPremio;
  nome: string;        // nome do item/expansão, ou o texto livre
  quantidade: number;  // gemas, ouro ou unidades do item (1 para expansão e texto)
  icone: string;       // URL do ícone (vazio = ícone do site)
  raridade: string;    // classe de cor: legendary, ascended, exotic... ou gema/ouro/expansao/texto
  descricao: string;   // linha curta em PT-BR
  itemId: number;      // 0 quando não é item
}

export const ICONE_GEMA = 'https://render.guildwars2.com/file/220061640ECA41C0577758030357221B4ECCE62C/502065.png';
export const ICONE_OURO = 'https://render.guildwars2.com/file/98457F504BA2FAC8457F532C4B30EDC23929ACF9/619316.png';

// Ícone de cada expansão: o da história dela na API oficial do jogo (achievements/categories), servido pelo
// render.guildwars2.com, o único endereço de ícone que as regras do banco aceitam. Escolhidos em 20/11/2026.
const R = 'https://render.guildwars2.com/file/';
export const EXPANSOES = [
  { nome: 'Visions of Eternity', sigla: 'VoE', icone: `${R}D42AB56DEB5371FDD366A333A04F01E4F6FDEB56/3713023.png` },
  { nome: 'Janthir Wilds', sigla: 'JW', icone: `${R}197153B3BBB303BB7225A25C3FA65358EC1404CB/3378970.png` },
  { nome: 'Secrets of the Obscure', sigla: 'SotO', icone: `${R}11BCA3C6BBD60E18F1F2F3BD900B9DA2C875760F/3124850.png` },
  { nome: 'End of Dragons', sigla: 'EoD', icone: `${R}03C4A3F469363909391802723A03C275A29A033F/2604539.png` },
  { nome: 'Path of Fire', sigla: 'PoF', icone: `${R}03B7FD1061D69F44A808D952CEE3CD6D4B583117/1769823.png` },
  { nome: 'Heart of Thorns', sigla: 'HoT', icone: `${R}CA03DDA1E4125A5FE5D3C0AF155958FFBE04AFD6/1228217.png` },
];

/** Ícone escolhido para um prêmio "Outro" (gemas, ouro ou a sigla de uma expansão). Presente ou desconhecido: null. */
export function iconeOutro(v: string): { icone: string; raridade: string } | null {
  if (v === 'gemas') return { icone: ICONE_GEMA, raridade: 'gema' };
  if (v === 'ouro') return { icone: ICONE_OURO, raridade: 'ouro' };
  const e = EXPANSOES.find((x) => x.sigla === v);
  return e ? { icone: e.icone, raridade: 'expansao' } : null;
}

// tipo do item na API → nome em PT-BR e gênero (para concordar a raridade)
const TIPOS: Record<string, [string, 'm' | 'f']> = {
  Weapon: ['Arma', 'f'], Armor: ['Armadura', 'f'], Back: ['Mochila', 'f'], Trinket: ['Acessório', 'm'],
  UpgradeComponent: ['Melhoria', 'f'], Consumable: ['Consumível', 'm'], Container: ['Recipiente', 'm'],
  CraftingMaterial: ['Material', 'm'], Gizmo: ['Item', 'm'], MiniPet: ['Miniatura', 'f'], Trophy: ['Troféu', 'm'],
  Bag: ['Bolsa', 'f'], Tool: ['Ferramenta', 'f'], Gathering: ['Ferramenta de coleta', 'f'], Trait: ['Guia de traço', 'm'],
  Relic: ['Relíquia', 'f'], JadeTechModule: ['Módulo Jade Tech', 'm'], PowerCore: ['Núcleo de energia', 'm'],
};
const RARIDADES: Record<string, [string, string]> = {
  Junk: ['sem valor', 'sem valor'], Basic: ['básico', 'básica'], Fine: ['fino', 'fina'], Masterwork: ['obra-prima', 'obra-prima'],
  Rare: ['raro', 'rara'], Exotic: ['exótico', 'exótica'], Ascended: ['ascendido', 'ascendida'], Legendary: ['lendário', 'lendária'],
};

interface ItemApi { id: number; name: string; icon: string; rarity: string; type: string; details?: { type?: string } }

/** "Arma lendária · Greatsword", "Material exótico", "Miniatura rara". */
export function descricaoPt(it: ItemApi) {
  const [tipo, g] = TIPOS[it.type] ?? ['Item', 'm'];
  const rar = RARIDADES[it.rarity]?.[g === 'f' ? 1 : 0] ?? it.rarity.toLowerCase();
  const sub = it.details?.type && ['Weapon', 'Armor', 'Trinket', 'Back', 'Gathering'].includes(it.type) ? ` · ${it.details.type.replace(/([a-z])([A-Z])/g, '$1 $2')}` : '';
  return `${tipo} ${rar}${sub}`;
}

const WIKI = 'https://wiki.guildwars2.com/api.php';

/** Sugestões de nome enquanto a pessoa digita (só páginas de item, sem as de skin). */
export async function sugestoes(termo: string, sinal?: AbortSignal): Promise<string[]> {
  if (termo.trim().length < 3) return [];
  const r = await fetch(`${WIKI}?action=opensearch&format=json&origin=*&limit=10&namespace=0&search=${encodeURIComponent(termo.trim())}`, { signal: sinal });
  const [, nomes] = (await r.json()) as [string, string[]];
  return nomes.filter((n) => !/\((skin|achievement|mastery|effect)\)$/i.test(n)).slice(0, 8);
}

/** Sugestões já com ícone, raridade e tipo: os nomes da wiki viram ids numa consulta só, e os ids viram itens noutra. */
export async function sugestoesComIcone(termo: string, sinal?: AbortSignal): Promise<PremioInfo[]> {
  const nomes = await sugestoes(termo, sinal);
  if (!nomes.length) return [];
  const q = `[[Has canonical name::${nomes.join('||')}]]|?Has game id|?Has canonical name|limit=50`;
  const w = await fetch(`${WIKI}?action=ask&format=json&origin=*&query=${encodeURIComponent(q)}`, { signal: sinal }).then((r) => r.json()).catch(() => null);
  const ids = new Set<number>();
  Object.values((w?.query?.results ?? {}) as Record<string, { printouts: { 'Has game id': number[] } }>).forEach((x) => (x.printouts['Has game id'] ?? []).forEach((id) => ids.add(id)));
  if (!ids.size) return [];
  const itens = (await fetch(`https://api.guildwars2.com/v2/items?ids=${[...ids].slice(0, 100).join(',')}`, { signal: sinal }).then((r) => (r.ok ? r.json() : [])).catch(() => [])) as ItemApi[];
  // na ordem da wiki, um item por nome (o primeiro com o nome exato)
  return nomes.flatMap((n) => {
    const it = itens.find((x) => x.name.toLowerCase() === n.toLowerCase());
    return it ? [{ tipo: 'item' as const, nome: it.name, quantidade: 1, icone: it.icon, raridade: it.rarity.toLowerCase(), descricao: descricaoPt(it), itemId: it.id }] : [];
  });
}

/** Acha o item pelo nome exato: id na wiki, dados na API do jogo. */
export async function buscarItem(nome: string): Promise<PremioInfo> {
  const q = `[[Has canonical name::${nome.trim()}]]|?Has game id|limit=5`;
  const w = await fetch(`${WIKI}?action=ask&format=json&origin=*&query=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => null);
  const resultados = Object.values((w?.query?.results ?? {}) as Record<string, { printouts: { 'Has game id': number[] } }>);
  const ids = resultados.flatMap((x) => x.printouts['Has game id'] ?? []).slice(0, 10);
  if (!ids.length) throw new Error(`Não achei "${nome}" na wiki do jogo. Confira o nome em inglês, como aparece no jogo.`);
  const itens = (await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}`).then((r) => (r.ok ? r.json() : [])).catch(() => [])) as ItemApi[];
  const it = itens.find((x) => x.name.toLowerCase() === nome.trim().toLowerCase()) ?? itens[0];
  if (!it) throw new Error(`"${nome}" existe na wiki, mas o jogo não respondeu sobre ele agora. Tente de novo em alguns segundos ou escolha Outro e digite o nome.`);
  return { tipo: 'item', nome: it.name, quantidade: 1, icone: it.icon, raridade: it.rarity.toLowerCase(), descricao: descricaoPt(it), itemId: it.id };
}

/** Nome do prêmio para mostrar: "400 gemas", "2 × Aurene's Bite", "250 ouro". */
export function textoPremio(p: PremioInfo) {
  if (p.tipo === 'gemas') return `${p.quantidade.toLocaleString('pt-BR')} gemas`;
  if (p.tipo === 'ouro') return `${p.quantidade.toLocaleString('pt-BR')} ouro`;
  if (p.tipo === 'item' && p.quantidade > 1) return `${p.quantidade.toLocaleString('pt-BR')} × ${p.nome}`;
  return p.nome;
}

/** Monta o PremioInfo dos tipos que não precisam de busca. */
export function premioSimples(tipo: TipoPremio, nome: string, quantidade: number): PremioInfo {
  if (tipo === 'gemas') return { tipo, nome: 'Gemas', quantidade, icone: ICONE_GEMA, raridade: 'gema', descricao: 'Gemas da loja do jogo', itemId: 0 };
  if (tipo === 'ouro') return { tipo, nome: 'Ouro', quantidade, icone: ICONE_OURO, raridade: 'ouro', descricao: 'Moedas de ouro, direto no correio do jogo', itemId: 0 };
  if (tipo === 'expansao') {
    const e = EXPANSOES.find((x) => x.nome === nome || x.sigla.toLowerCase() === nome.toLowerCase()) ?? EXPANSOES[0];
    return { tipo, nome: e.nome, quantidade: 1, icone: e.icone, raridade: 'expansao', descricao: `Expansão do Guild Wars 2 (${e.sigla})`, itemId: 0 };
  }
  return { tipo: 'texto', nome, quantidade: 1, icone: '', raridade: 'texto', descricao: '', itemId: 0 };
}
