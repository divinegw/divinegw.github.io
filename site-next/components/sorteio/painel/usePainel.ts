"use client"

import * as React from "react"

import { carregarDados, type Dados } from "@/lib/dados"
import type { Carimbo, Conexao, Sorteio, Usuario } from "@/lib/dados/firebase"
import { CONTA_GW2 } from "@/lib/sorteio/contas"
import { chaveDe, type Inscrito } from "@/lib/sorteio/ao-vivo"
import { estaAberto } from "@/lib/sorteio/painel"

export type Carga = "carregando" | "erro" | "inexistente" | "pronto"

export const MSG = {
  formato: "Esse ID não existe. Confira o ponto e os 4 números, como Joana.1234.",
  duplicada: "Esse ID já está no sorteio. Se não foi você, avise quem organiza.",
  falha: "Não deu para entrar. Confira sua internet e tente de novo.",
  fechou: "As inscrições acabaram de fechar.",
  google: "Este sorteio pede a conta Google, e o login não terminou. Clique em Participar e escolha uma conta na janela do Google.",
  semConexao: "Não deu para conectar ao sorteio. Confira sua internet: quando você clicar em Participar, o site tenta de novo.",
  tokenRecusado: "Este link de organizador não vale para este sorteio. Peça o link de novo para quem abriu o sorteio.",
  inscritos: "Não deu para atualizar a lista de inscritos. Confira sua internet e recarregue a página.",
  aceites: "Não deu para acompanhar quem aceitou o prêmio. Confira sua internet e recarregue a página.",
} as const

const aoErro = (e: unknown, padrao: string) => (e && typeof e === "object" && "codigo" in e && e instanceof Error ? e.message : padrao)
const ms = (c: Carimbo | null | undefined) => (c ? c.toMillis() : 0)

/**
 * Tudo o que o painel precisa do banco: ouve o sorteio, os inscritos e os aceites, descobre se este aparelho
 * organiza ou já se inscreveu, e entrega as ações (inscrever, aceitar, sortear...). Todo `ouvir*` é cancelado na saída:
 * abrir e fechar o painel não deixa ouvinte para trás.
 * O token de organizador (?org=) é guardado no navegador e sai da barra de endereço; nunca vai para a tela nem para o console.
 */
export function usePainel(id: string, cenario: string | null, papel: string | null, extras: string, aoAnunciar: (t: string) => void) {
  const [dados, setDados] = React.useState<Dados | null>(null)
  const [sorteio, setSorteio] = React.useState<Sorteio | null | undefined>(undefined)
  const [inscritos, setInscritos] = React.useState<Inscrito[] | null>(null)
  const [aceites, setAceites] = React.useState<Set<string>>(() => new Set())
  const [usuario, setUsuario] = React.useState<Usuario | null>(null)
  const [conexao, setConexao] = React.useState<Conexao | null>(null)
  const [online, setOnline] = React.useState(true)
  const [falhou, setFalhou] = React.useState(false)
  const [avisos, setAvisos] = React.useState<{ conectar?: boolean; inscritos?: boolean; aceites?: boolean }>({})
  const [novos, setNovos] = React.useState<Set<string>>(() => new Set())
  const [agora, setAgora] = React.useState(0)
  // a conta que esta pessoa acabou de digitar, até a lista de inscritos chegar com ela
  const [contaLocal, setContaLocal] = React.useState<string | null>(null)

  const anunciar = React.useRef(aoAnunciar)
  React.useEffect(() => { anunciar.current = aoAnunciar }, [aoAnunciar])

  React.useEffect(() => {
    let vivo = true
    const parar: (() => void)[] = []
    let vistos: Set<string> | null = null
    let fila: string[] = []
    let t: number | undefined

    carregarDados(cenario, papel, new URLSearchParams(extras))
      .then((d) => {
        if (!vivo) return
        setDados(d)
        setAgora(d.agora())

        // link de organizador: guarda a chave neste navegador e tira da barra de endereço
        const url = new URL(window.location.href)
        const token = url.searchParams.get("org")
        if (token) {
          d.guardarToken(id, token)
          url.searchParams.delete("org")
          window.history.replaceState(null, "", url.pathname + url.search + url.hash)
        }

        parar.push(d.ouvirConexao((o) => vivo && setOnline(o)))
        parar.push(d.ouvirSorteio(id, (s) => vivo && setSorteio(s), () => vivo && setFalhou(true)))
        parar.push(d.ouvirInscritos(id, (lista) => {
          if (!vivo) return
          setInscritos(lista)
          setAvisos((a) => (a.inscritos ? { ...a, inscritos: false } : a))
          if (!vistos) { vistos = new Set(lista.map((p) => p.chave)); return }
          const chegaram = lista.filter((p) => !vistos!.has(p.chave))
          if (!chegaram.length) return
          chegaram.forEach((p) => vistos!.add(p.chave))
          setNovos((n) => new Set([...n, ...chegaram.map((p) => p.chave)]))
          // quem entra em lote é anunciado uma vez só, não um por um
          fila = [...fila, ...chegaram.map((p) => p.conta)]
          window.clearTimeout(t)
          t = window.setTimeout(() => {
            anunciar.current(fila.length === 1 ? `${fila[0]} entrou no sorteio.` : `${fila.length} pessoas entraram no sorteio.`)
            fila = []
          }, 1500)
        }, () => vivo && setAvisos((a) => ({ ...a, inscritos: true }))))
        parar.push(d.ouvirAceites(id, (c) => vivo && setAceites(c), () => vivo && setAvisos((a) => ({ ...a, aceites: true }))))

        d.entrar()
          .then(async (u) => {
            if (!vivo) return
            setUsuario(u)
            const c = await d.conectar(id, u.uid)
            if (vivo) setConexao(c)
          })
          .catch(() => vivo && setAvisos((a) => ({ ...a, conectar: true })))
      })
      .catch(() => vivo && setFalhou(true))

    return () => {
      vivo = false
      window.clearTimeout(t)
      parar.forEach((f) => f())
    }
  }, [id, cenario, papel, extras])

  // o relógio só anda quando há contagem na tela (prazo das inscrições ou minuto de confirmar)
  const r = sorteio?.resultado ?? null
  const contando = Boolean(
    sorteio && dados && ((sorteio.aberto && !r && sorteio.fechaEm && ms(sorteio.fechaEm) > agora - 2000) || (r?.prazo && ms(r.prazo) > agora - 2000))
  )
  React.useEffect(() => {
    if (!dados || !contando) return
    const tique = () => setAgora(dados.agora())
    tique()
    const i = window.setInterval(tique, 500)
    return () => window.clearInterval(i)
  }, [dados, contando])

  const carga: Carga = falhou ? "erro" : !dados || sorteio === undefined ? "carregando" : sorteio === null ? "inexistente" : "pronto"
  const organizador = Boolean(conexao?.organizador)
  const minhaChave = conexao?.chaveMinha ?? null
  const minhaConta = minhaChave ? (inscritos?.find((p) => p.chave === minhaChave)?.conta ?? (contaLocal && chaveDe(contaLocal) === minhaChave ? contaLocal : null)) : null
  const tirado = Boolean(
    minhaChave && inscritos && !inscritos.some((p) => p.chave === minhaChave) && sorteio?.tirados?.some((n) => chaveDe(n) === minhaChave)
  )
  const aberto = Boolean(sorteio && agora && estaAberto(sorteio, agora))

  // ---------------------------------------------------------------- ações: devolvem o texto do erro, ou `null` se deu certo
  async function participar(contaBruta: string): Promise<{ erro: string; campo: boolean } | null> {
    const conta = contaBruta.trim().replace(/\s{2,}/g, " ")
    if (!CONTA_GW2.test(conta)) return { erro: MSG.formato, campo: true }
    if (!dados || !sorteio) return { erro: MSG.falha, campo: false }
    const chave = chaveDe(conta)
    try {
      let u = await dados.entrar()
      setUsuario(u)
      let c = conexao ?? (await dados.conectar(id, u.uid))
      // modo rigoroso: liga a conta Google antes (abre a janela do Google)
      if (sorteio.google && !u.google) {
        try {
          u = await dados.ligarGoogle()
          setUsuario(u)
          c = await dados.conectar(id, u.uid)
          setConexao(c)
        } catch {
          return { erro: MSG.google, campo: false }
        }
        if (c.chaveMinha) {
          const quem = inscritos?.find((p) => p.chave === c.chaveMinha)?.conta ?? c.chaveMinha
          return { erro: `Essa conta Google já está participando como ${quem}. Cada conta Google entra uma vez só.`, campo: false }
        }
      }
      if (inscritos?.some((p) => p.chave === chave)) return { erro: MSG.duplicada, campo: true }
      await dados.inscrever(id, conta)
      setContaLocal(conta)
      setConexao({ ...c, chaveMinha: chave })
      return null
    } catch (e) {
      console.warn("sorteio ao vivo: inscrição falhou", e instanceof Error ? e.name : "erro")
      return { erro: agora && !estaAberto(sorteio, dados.agora()) ? MSG.fechou : MSG.falha, campo: false }
    }
  }

  async function confirmarPresenca(): Promise<string | null> {
    if (!dados || !minhaChave) return "Não deu para aceitar. Se o tempo acabou, quem organiza pode sortear outra pessoa. Se não, tente de novo."
    try { await dados.aceitar(id, minhaChave); return null } catch (e) {
      console.warn("sorteio ao vivo: aceite falhou", e instanceof Error ? e.name : "erro")
      return "Não deu para aceitar. Se o tempo acabou, quem organiza pode sortear outra pessoa. Se não, tente de novo."
    }
  }

  const exige = () => (dados && sorteio && inscritos ? { d: dados, s: sorteio, l: inscritos } : null)
  const tentar = async (f: () => Promise<unknown>, falha: string): Promise<string | null> => {
    try { await f(); return null } catch (e) { console.warn("sorteio ao vivo:", e instanceof Error ? e.name : "erro"); return aoErro(e, falha) }
  }

  const acoes = {
    participar,
    confirmarPresenca,
    tirar: (chave: string, conta: string) => { const x = exige(); return x ? tentar(() => x.d.tirarParticipante(id, chave, conta), "Não deu para tirar. Tente de novo.") : Promise.resolve("Não deu para tirar. Tente de novo.") },
    encerrar: () => (dados ? tentar(() => dados.encerrarInscricoes(id), "Não deu para mudar. Tente de novo.") : Promise.resolve("Não deu para mudar. Tente de novo.")),
    reabrir: () => (dados ? tentar(() => dados.reabrirInscricoes(id), "Não deu para mudar. Tente de novo.") : Promise.resolve("Não deu para mudar. Tente de novo.")),
    sortear: (fora: string[]) => { const x = exige(); return x ? tentar(() => x.d.sortear(id, x.s, x.l, fora), "Não deu para salvar o resultado. Tente de novo.") : Promise.resolve("Não deu para salvar o resultado. Tente de novo.") },
    trocar: (fora: string[]) => { const x = exige(); return x ? tentar(() => x.d.trocarAusentes(id, x.s, x.l, aceites, fora), "Não deu para sortear outra pessoa. Tente de novo.") : Promise.resolve("Não deu para sortear outra pessoa. Tente de novo.") },
    apagar: () => (dados ? tentar(() => dados.apagarSorteio(id), "Não deu para apagar. Tente de novo.") : Promise.resolve("Não deu para apagar. Tente de novo.")),
    /** O link de organizador, só no momento de copiar. Nunca fica em estado nem na tela. */
    linkOrganizador: async () => {
      if (!dados) return null
      const token = await dados.tokenOrganizador(id)
      return token ? `${dados.linkDe(id, window.location.origin)}&org=${token}` : null
    },
  }

  return { dados, carga, sorteio: sorteio ?? null, inscritos, aceites, usuario, conexao, online, avisos, novos, agora, organizador, minhaChave, minhaConta, tirado, aberto, acoes }
}

export type PainelDados = ReturnType<typeof usePainel>
