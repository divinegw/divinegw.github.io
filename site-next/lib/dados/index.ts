// Porta de entrada dos dados do painel do sorteio. Quem usa (components/sorteio/painel) só conhece o tipo `Dados`.
//
// Em produção: o Firebase de verdade (lib/dados/firebase.ts), baixado só quando alguém abre um sorteio.
// Em desenvolvimento (`npm run dev`) e só com `?falso=<cenario>` na URL: a camada em memória de lib/dados/falso.ts,
// que nunca toca no banco. A condição `process.env.NODE_ENV === "development"` é trocada por `false` na build,
// e o import dinâmico do falso some do pacote: confira com `grep -r inscricoes-cheia out/` (não pode achar nada).
import type * as Firebase from "./firebase"
import { ouvirConexao } from "./conexao"

type Real = typeof Firebase

/** Tudo o que o painel faz com o banco, mais o relógio e a conexão. O falso e o real têm esta mesma forma. */
export type Dados = Pick<
  Real,
  | "entrar" | "ligarGoogle" | "ouvirSorteio" | "ouvirInscritos" | "ouvirAceites" | "conectar" | "tokenOrganizador"
  | "guardarToken" | "inscrever" | "aceitar" | "tirarParticipante" | "encerrarInscricoes" | "reabrirInscricoes"
  | "sortear" | "sortearDeNovo" | "trocarAusentes" | "apagarSorteio" | "linkDe" | "PRAZO_ACEITE" | "MAX_REFEITOS"
> & {
  /** Hora de agora em milissegundos. No falso, dá para parar e avançar. */
  agora(): number
  /** Avisa quando a internet cai e volta. */
  ouvirConexao(aoMudar: (online: boolean) => void): () => void
  /** `true` só na camada de teste do desenvolvimento. */
  falso: boolean
}

export async function carregarDados(cenario: string | null, papel: string | null, extras: URLSearchParams): Promise<Dados> {
  if (process.env.NODE_ENV === "development" && cenario) {
    const { criarFalso } = await import("./falso")
    return criarFalso(cenario, papel === "organizador" || papel === "visitante" ? papel : null, extras)
  }
  const fb = await import("./firebase")
  return {
    entrar: fb.entrar,
    ligarGoogle: fb.ligarGoogle,
    ouvirSorteio: fb.ouvirSorteio,
    ouvirInscritos: fb.ouvirInscritos,
    ouvirAceites: fb.ouvirAceites,
    conectar: fb.conectar,
    tokenOrganizador: fb.tokenOrganizador,
    guardarToken: fb.guardarToken,
    inscrever: fb.inscrever,
    aceitar: fb.aceitar,
    tirarParticipante: fb.tirarParticipante,
    encerrarInscricoes: fb.encerrarInscricoes,
    reabrirInscricoes: fb.reabrirInscricoes,
    sortear: fb.sortear,
    sortearDeNovo: fb.sortearDeNovo,
    trocarAusentes: fb.trocarAusentes,
    apagarSorteio: fb.apagarSorteio,
    linkDe: fb.linkDe,
    PRAZO_ACEITE: fb.PRAZO_ACEITE,
    MAX_REFEITOS: fb.MAX_REFEITOS,
    agora: () => Date.now(),
    ouvirConexao,
    falso: false,
  }
}
