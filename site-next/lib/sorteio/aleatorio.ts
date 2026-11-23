// Cópia de site-astro/src/lib/sorteio/aleatorio.ts (Etapa 2a). Não mude o sorteio: os testes de referência garantem o mesmo resultado.
// Motor do sorteador (/sorteio.html). Roda só no navegador.
//
// Todo sorteio parte de um CÓDIGO (a semente). Sem código informado, o código nasce do crypto.getRandomValues
// (aleatório de verdade, do sistema). Do código sai, por SHA-256, o estado de um gerador xoshiro128**: com o mesmo
// código e a mesma entrada (mesma lista, mesma faixa), o resultado é sempre o mesmo. É isso que deixa qualquer um
// conferir um sorteio: basta colar o código e a lista na aba certa.
//
// Números são BigInt: a faixa não tem limite de tamanho. Sorteio de inteiro em [0, n) por rejeição (sem viés).

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O, 1/I/L: fácil de ditar no Discord

/** Código novo: 12 caracteres em 3 blocos (ex.: K7PX-3QMA-9RTD). */
export function novoCodigo(): string {
  const b = new Uint32Array(12);
  crypto.getRandomValues(b);
  const c = [...b].map((x) => ALFABETO[x % ALFABETO.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}

/** Normaliza o código digitado: maiúsculas, sem espaços. Qualquer texto vale como código. */
export const limpaCodigo = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');

export interface Gerador {
  u32(): number;
  abaixo(n: bigint): bigint;
  /** inteiro em [min, max], os dois inclusos */
  entre(min: bigint, max: bigint): bigint;
  indice(n: number): number;
  embaralha<T>(lista: T[]): T[];
}

/** Gerador a partir de um código. `contexto` separa usos diferentes do mesmo código (ex.: "numeros", "lista"). */
export async function gerador(codigo: string, contexto = ''): Promise<Gerador> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${limpaCodigo(codigo)}|${contexto}`)));
  const v = new DataView(bytes.buffer);
  const s = [v.getUint32(0), v.getUint32(4), v.getUint32(8), v.getUint32(12)];
  if (!s.some(Boolean)) s[0] = 1;
  const rotl = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0;
  const u32 = () => {
    // xoshiro128**
    const r = Math.imul(rotl(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3];
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotl(s[3], 11);
    s[0] >>>= 0; s[1] >>>= 0; s[2] >>>= 0;
    return r;
  };
  const abaixo = (n: bigint): bigint => {
    if (n <= 1n) return 0n;
    const bits = (n - 1n).toString(2).length;
    const palavras = Math.ceil(bits / 32);
    const sobra = BigInt(palavras * 32 - bits);
    for (;;) {
      let x = 0n;
      for (let i = 0; i < palavras; i++) x = (x << 32n) | BigInt(u32());
      x >>= sobra;
      if (x < n) return x;
    }
  };
  const indice = (n: number) => Number(abaixo(BigInt(n)));
  return {
    u32,
    abaixo,
    entre: (min, max) => min + abaixo(max - min + 1n),
    indice,
    embaralha<T>(lista: T[]) {
      const a = [...lista];
      for (let i = a.length - 1; i > 0; i--) {
        const j = indice(i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/** `qtd` números de [min, max]. Sem repetição: algoritmo de Floyd (qtd passos, serve para faixa de qualquer tamanho). */
export function numeros(g: Gerador, min: bigint, max: bigint, qtd: number, repetir: boolean): bigint[] {
  if (repetir) return Array.from({ length: qtd }, () => g.entre(min, max));
  const n = max - min + 1n;
  const escolhidos = new Set<bigint>();
  const ordem: bigint[] = [];
  for (let j = n - BigInt(qtd); j < n; j++) {
    const t = g.abaixo(j + 1n);
    const v = escolhidos.has(t) ? j : t;
    escolhidos.add(v);
    ordem.push(v);
  }
  return g.embaralha(ordem).map((x) => x + min);
}

/** Sorteio com peso: cada item tem `bilhetes`. Tira `qtd` itens diferentes, na ordem em que saíram. */
export function comPeso<T extends { bilhetes: number }>(g: Gerador, itens: T[], qtd: number): T[] {
  const resto = [...itens];
  const saiu: T[] = [];
  while (saiu.length < qtd && resto.length) {
    const total = resto.reduce((s, x) => s + BigInt(x.bilhetes), 0n);
    let r = g.abaixo(total);
    let i = 0;
    for (; i < resto.length; i++) {
      r -= BigInt(resto[i].bilhetes);
      if (r < 0n) break;
    }
    saiu.push(resto.splice(i, 1)[0]);
  }
  return saiu;
}

/** Impressão digital curta de um texto (SHA-256, 8 caracteres): mostra que a lista conferida é a mesma. */
export async function impressao(texto: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
  return [...h.slice(0, 4)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Lê um inteiro digitado ("1.000", "-5", "1e3" não). Devolve null se não for inteiro. */
export function inteiro(s: string): bigint | null {
  const t = s.trim().replace(/[.\s_]/g, '');
  if (!/^-?\d+$/.test(t)) return null;
  return BigInt(t);
}

/** Número grande com separador de milhar (pt-BR). */
export const formata = (n: bigint) => n.toLocaleString('pt-BR');
