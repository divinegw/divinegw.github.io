// Leitura das listas de participantes do sorteador.
// Uma pessoa por linha (também aceita vírgula ou ponto e vírgula entre nomes, quando não há peso).
// Conta do GW2: "Nome.1234" (o nome pode ter espaço; o final é ponto + 4 dígitos). Maiúscula não diferencia contas.
// Peso (bilhetes): "Nome.1234 x3", "Nome.1234 *3" ou "Nome.1234 = 3".
// Função (para montar squads): "Nome.1234 - Heal" (o que vem depois do " - ").

export const CONTA_GW2 = /^[^\s.][^.\n]{1,29}\.\d{4}$/;

export interface Participante {
  nome: string;
  chave: string;      // nome em minúsculas, para tirar repetidos
  bilhetes: number;
  funcao?: string;
  linha: number;
}

export interface Leitura {
  validos: Participante[];
  repetidos: string[];
  erros: { linha: number; texto: string }[];
}

const PESO = /\s*(?:[x*×]|=)\s*(\d{1,6})\s*$/i;

export function lerLista(texto: string, opcoes: { soGw2?: boolean; peso?: boolean; funcao?: boolean } = {}): Leitura {
  const validos: Participante[] = [];
  const repetidos: string[] = [];
  const erros: Leitura['erros'] = [];
  const vistos = new Map<string, Participante>();
  const linhas = texto.split(/\r?\n/);
  linhas.forEach((bruta, i) => {
    // sem peso nem função, "a, b; c" numa linha vira 3 nomes
    const partes = !opcoes.peso && !opcoes.funcao && /[;,]/.test(bruta) ? bruta.split(/[;,]/) : [bruta];
    for (const parte of partes) {
      let t = parte.replace(/\t/g, ' ').trim();
      if (!t) continue;
      let bilhetes = 1;
      let funcao: string | undefined;
      if (opcoes.funcao) {
        const m = /\s+[-–]\s+(.+)$/.exec(t);
        if (m) { funcao = m[1].trim(); t = t.slice(0, m.index).trim(); }
      }
      if (opcoes.peso) {
        const m = PESO.exec(t);
        if (m) { bilhetes = Number(m[1]); t = t.slice(0, m.index).trim(); }
        if (bilhetes < 1) { erros.push({ linha: i + 1, texto: bruta.trim() }); continue; }
      }
      t = t.replace(/\s{2,}/g, ' ');
      if (opcoes.soGw2 && !CONTA_GW2.test(t)) { erros.push({ linha: i + 1, texto: parte.trim() }); continue; }
      const chave = t.toLocaleLowerCase('pt-BR');
      const ja = vistos.get(chave);
      if (ja) {
        repetidos.push(t);
        if (opcoes.peso) ja.bilhetes += bilhetes; // com peso, a linha repetida soma bilhetes
        continue;
      }
      const p: Participante = { nome: t, chave, bilhetes, funcao, linha: i + 1 };
      vistos.set(chave, p);
      validos.push(p);
    }
  });
  return { validos, repetidos, erros };
}

/** Lista de itens simples (prêmios), com quantidade opcional: "Legendary x2". */
export function lerItens(texto: string): string[] {
  const out: string[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    let t = bruta.trim();
    if (!t) continue;
    let q = 1;
    const m = PESO.exec(t);
    if (m) { q = Math.min(Number(m[1]), 500); t = t.slice(0, m.index).trim(); }
    for (let i = 0; i < q; i++) out.push(t);
  }
  return out;
}

/** Texto de um arquivo .txt ou .csv: no CSV, fica só a 1ª coluna (e a 2ª, se for número, vira peso). */
export function textoDeArquivo(nome: string, conteudo: string): string {
  if (!/\.csv$/i.test(nome)) return conteudo;
  return conteudo
    .split(/\r?\n/)
    .map((l) => l.split(/[;,\t]/).map((c) => c.trim().replace(/^"|"$/g, '')))
    .filter((c) => c[0])
    .map((c) => (c[1] && /^\d+$/.test(c[1]) ? `${c[0]} x${c[1]}` : c[0]))
    .join('\n');
}
