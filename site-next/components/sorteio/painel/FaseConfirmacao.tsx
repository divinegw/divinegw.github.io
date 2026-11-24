"use client"

import * as React from "react"
import { CheckIcon, DicesIcon } from "lucide-react"

import { Premio } from "@/components/sorteio/painel/Cabecalho"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { Prova } from "@/components/sorteio/painel/Prova"
import { Confirma } from "@/components/sorteio/painel/Confirma"
import { Button } from "@/components/ui/button"
import type { Resultado, Sorteio } from "@/lib/dados/firebase"
import type { Inscrito } from "@/lib/sorteio/ao-vivo"
import { formatarRelogio, tempoPorExtenso, type FaseAceite, type Ganhador } from "@/lib/sorteio/painel"
import { cn } from "@/lib/utils"

const MENSAGEM_ACEITE = "Não deu para aceitar. Se o tempo acabou, quem organiza pode sortear outra pessoa. Se não, tente de novo."

// O anel que esvazia em volta do ícone do prêmio. Só desenho: o tempo vem em texto.
function Anel({ fracao, estado, children }: { fracao: number; estado: "conta" | "urgente" | "ok" | "fim"; children: React.ReactNode }) {
  const cor = estado === "ok" ? "stroke-primary" : estado === "urgente" ? "stroke-urgente" : estado === "fim" ? "stroke-destructive" : "stroke-primary"
  return (
    <div aria-hidden="true" className="relative grid size-28 shrink-0 place-items-center min-[560px]:size-32">
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" focusable="false">
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5" className="stroke-fill-2" />
        <circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="5" strokeLinecap="round" pathLength={100}
          strokeDasharray={`${Math.max(0, Math.min(1, fracao)) * 100} 100`}
          className={cn(cor, "motion-safe:transition-[stroke-dasharray,stroke] motion-safe:duration-500 motion-safe:ease-linear")}
        />
      </svg>
      {children}
    </div>
  )
}

const Tempo = ({ ms }: { ms: number }) => (
  <>
    <b className="dado font-semibold" aria-hidden="true">{formatarRelogio(ms)}</b>
    <span className="sr-only">{tempoPorExtenso(ms)}</span>
  </>
)

// O minuto para confirmar. Quem ganhou vê o relógio grande e o botão; quem organiza vê quantos já confirmaram e,
// quando o minuto acaba, o botão de sortear outra pessoa; quem assiste vê quem está sendo esperado.
// O relógio não é anunciado a cada segundo: o painel avisa só quando alguém confirma, os 10 s finais (para quem ganhou) e o fim.
export function FaseConfirmacao({
  s,
  r,
  inscritos,
  fase,
  resta,
  ganhadores,
  euGanhei,
  jaConfirmei,
  organizador,
  refTitulo,
  aoConfirmar,
  aoTrocar,
  textoDaTroca,
}: {
  s: Sorteio
  r: Resultado
  inscritos: Inscrito[]
  fase: FaseAceite
  resta: number
  ganhadores: Ganhador[]
  euGanhei: boolean
  jaConfirmei: boolean
  organizador: boolean
  refTitulo: React.Ref<HTMLHeadingElement>
  aoConfirmar: () => Promise<string | null>
  aoTrocar: () => Promise<string | null>
  textoDaTroca: string
}) {
  const [enviando, setEnviando] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)
  const [trocando, setTrocando] = React.useState(false)
  const [pergunta, setPergunta] = React.useState(false)
  const [erroTroca, setErroTroca] = React.useState<string | null>(null)

  const pendentes = ganhadores.filter((g) => !g.ok)
  const confirmaram = ganhadores.length - pendentes.length
  const urgente = fase === "conta" && resta <= 10_000
  const fracao = fase === "ok" ? 1 : fase === "fim" ? 0 : resta / 60_000
  const estadoAnel = fase === "ok" ? "ok" : fase === "fim" ? "fim" : urgente ? "urgente" : "conta"
  // quem organiza vê o painel; se também ganhou e ainda não confirmou, vê primeiro o botão de confirmar
  const comoOrg = organizador && !(euGanhei && !jaConfirmei && fase === "conta")
  const eu = !comoOrg && euGanhei
  const unico = ganhadores.length === 1
  const faltam = pendentes.length

  async function confirmar() {
    if (enviando) return
    setEnviando(true)
    setErro(null)
    const e = await aoConfirmar()
    setEnviando(false)
    if (e) setErro(e || MENSAGEM_ACEITE)
  }
  async function trocar() {
    setTrocando(true)
    setErroTroca(null)
    const e = await aoTrocar()
    setTrocando(false)
    setErroTroca(e)
  }

  let titulo: React.ReactNode
  let apoio: React.ReactNode = null
  let tituloOuro = false
  if (comoOrg) {
    titulo = `${confirmaram} de ${ganhadores.length} ${ganhadores.length === 1 ? "confirmou" : "confirmaram"}`
    apoio = fase === "fim" ? "O minuto acabou." : fase === "ok" ? "Todo mundo confirmou. Agora é entregar no jogo." : <>Quem ganhou tem <Tempo ms={resta} /> para confirmar.</>
  } else if (eu) {
    if (jaConfirmei || fase === "ok") { titulo = "Pronto. O prêmio é seu."; apoio = "Fale com quem organiza para receber no jogo." }
    else if (fase === "fim") { titulo = "O tempo acabou."; apoio = "Quem organiza vai sortear outra pessoa. Se você estava aqui, avise no Discord." }
    else { titulo = "Você ganhou"; tituloOuro = true }
  } else if (fase === "ok") {
    titulo = unico ? <><NomeConta nome={ganhadores[0].nome} /> confirmou.</> : "Todo mundo confirmou."
  } else if (fase === "fim") {
    titulo = unico ? <><NomeConta nome={pendentes[0].nome} /> não confirmou a tempo.</> : `${faltam} pessoas não confirmaram a tempo.`
    apoio = "Quem organiza vai sortear outra pessoa."
  } else {
    titulo = unico ? <>Esperando <NomeConta nome={pendentes[0].nome} /></> : `Esperando ${faltam} ${faltam === 1 ? "pessoa" : "pessoas"}`
    apoio = <>Tem <Tempo ms={resta} /> para confirmar que está aqui.</>
  }

  const semProva = eu && fase === "conta" && !jaConfirmei
  const rotuloTroca = faltam === 1 ? "Sortear outra pessoa" : `Sortear ${faltam} outras pessoas`

  return (
    <>
      <div className="grid gap-5">
        <span className="rotulo text-primary-text">Confirmação do prêmio</span>
        <Premio s={s} estado="sorteado" curto semIcone />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Anel fracao={fracao} estado={estadoAnel}>
            {fase === "ok" ? (
              <span className="relative grid size-16 place-items-center">
                <IconePremio premio={s.premioInfo} tipo={s.premioInfo?.tipo ?? "texto"} tamanho="g" />
                <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><CheckIcon className="size-4" strokeWidth={2.5} /></span>
              </span>
            ) : (
              <IconePremio premio={s.premioInfo} tipo={s.premioInfo?.tipo ?? "texto"} tamanho="g" />
            )}
          </Anel>
          <div className="grid min-w-0 flex-1 basis-56 gap-1.5">
            <h2 ref={refTitulo} tabIndex={-1} className={cn("text-title font-semibold tracking-titulo outline-none [overflow-wrap:anywhere]", tituloOuro && "text-primary-text")}>
              {titulo}
            </h2>
            {eu && fase === "conta" && !jaConfirmei ? (
              <>
                <p aria-hidden="true" className={cn("text-display font-bold tracking-titulo tabular-nums", urgente ? "text-urgente" : "text-foreground")}>{formatarRelogio(resta)}</p>
                <p className="text-small text-muted-foreground"><span className="sr-only">Você tem {tempoPorExtenso(resta)} </span>para confirmar que está aqui</p>
              </>
            ) : apoio ? (
              <p className="text-small text-muted-foreground">{apoio}</p>
            ) : null}
          </div>
        </div>

        {eu && fase === "conta" && !jaConfirmei && (
          <div className="grid gap-2">
            <Button type="button" size="lg" className="w-full" carregando={enviando} onClick={() => void confirmar()}>
              Confirmar que estou aqui
            </Button>
            {erro && <p role="alert" className="text-small text-destructive">{erro}</p>}
          </div>
        )}

        {comoOrg && fase !== "ok" && (
          <div className="grid justify-items-start gap-2">
            {fase === "fim" ? (
              <Button type="button" size="lg" className="max-[559px]:w-full" carregando={trocando} onClick={() => setPergunta(true)}>
                <DicesIcon />
                {rotuloTroca}
              </Button>
            ) : (
              <>
                <Button type="button" size="lg" className="max-[559px]:w-full" aria-disabled="true" aria-describedby="libera-troca" onClick={(e) => e.preventDefault()}>
                  <DicesIcon />
                  Sortear outra pessoa
                </Button>
                <span id="libera-troca" className="text-small text-muted-foreground">Libera quando o minuto acabar.</span>
              </>
            )}
            {erroTroca && <p role="alert" className="text-small text-destructive">{erroTroca}</p>}
          </div>
        )}
      </div>

      {semProva ? null : <Prova r={r} inscritos={inscritos} />}

      <Confirma
        aberto={pergunta}
        aoFechar={() => setPergunta(false)}
        titulo={`${rotuloTroca}?`}
        texto={textoDaTroca}
        acao={rotuloTroca}
        aoConfirmar={() => void trocar()}
      />
    </>
  )
}
