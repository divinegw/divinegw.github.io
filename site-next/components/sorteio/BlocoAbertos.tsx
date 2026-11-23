"use client"

import * as React from "react"
import { ChevronRightIcon, ClockIcon, RotateCcwIcon, TrophyIcon, UsersIcon, WifiOffIcon } from "lucide-react"

import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { navegar, useAgora } from "@/components/sorteio/url"
import { fechaLogo, nomeDoPremio, tempoCurto } from "@/lib/sorteio/exibir"
import { estaAberto, type SorteioAberto } from "@/lib/dados/rest"
import type { EstadoAbertos } from "@/components/sorteio/useAbertos"
import { cn } from "@/lib/utils"

// No celular o foco é criar: a coluna de abertos mostra só o primeiro card + "Ver todos".
const SO_PRIMEIRO_NO_CELULAR = "max-[899px]:[&>li:nth-child(n+2)]:hidden"

function CardAberto({ s, agora }: { s: SorteioAberto; agora: number }) {
  const premio = nomeDoPremio(s)
  const falta = s.fechaEm !== null && agora ? s.fechaEm - agora : null
  const urgente = falta !== null && fechaLogo(falta)
  return (
    <li>
      <a
        href={`/sorteio.html?s=${encodeURIComponent(s.id)}`}
        // prêmio e título longos são cortados no card: a dica mostra os dois inteiros (stress de 23/11/2026)
        title={s.titulo !== premio ? `${premio} · ${s.titulo}` : premio}
        className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-border-hover active:bg-fill-2"
      >
        <IconePremio premio={s.premioInfo} tipo={s.premioInfo?.tipo ?? "texto"} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <b className="line-clamp-2 font-semibold wrap-anywhere">{premio}</b>
          {s.titulo !== premio && <span className="truncate text-small text-muted-foreground">{s.titulo}</span>}
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption text-muted-foreground">
            {s.inscritos !== null && (
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span className="dado">{s.inscritos.toLocaleString("pt-BR")}</span>
                <span className="sr-only"> {s.inscritos === 1 ? "inscrito" : "inscritos"}</span>
              </span>
            )}
            {s.vencedores > 1 && (
              <span className="inline-flex items-center gap-1">
                <TrophyIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span className="dado">{s.vencedores}</span>
                <span className="sr-only"> vencedores</span>
              </span>
            )}
            {falta !== null ? (
              <span className={cn("inline-flex items-center gap-1", urgente ? "text-urgente" : "text-primary-text")}>
                <ClockIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">Fecha em </span>
                <span className="dado">{tempoCurto(falta)}</span>
                {urgente && " · fecha logo"}
              </span>
            ) : (
              s.fechaEm === null && (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  Sem prazo
                </span>
              )
            )}
          </span>
        </span>
        <ChevronRightIcon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      </a>
    </li>
  )
}

function EsqueletoCards({ n, className }: { n: number; className?: string }) {
  return (
    <ul aria-hidden="true" className={cn("grid gap-2", className)}>
      {Array.from({ length: n }, (_, i) => (
        // mesmo tamanho do card: 40 de ícone + 12 de respiro nos quatro lados
        <li key={i} className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
          <Skeleton className="size-10 shrink-0" />
          <span className="grid flex-1 gap-2">
            <Skeleton className="h-3.5 w-[70%]" />
            <Skeleton className="h-3 w-[45%]" />
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * "Abertos agora". `completo`: a lista inteira (tela "Sorteios abertos"); senão, 3 + "Ver todos os N".
 * Sem nenhum aberto, o bloco some (quem usa vê isso em `estado`): aqui devolve null.
 */
export function BlocoAbertos({
  estado,
  recarregar,
  completo = false,
  className,
}: {
  estado: EstadoAbertos
  recarregar: () => void
  completo?: boolean
  className?: string
}) {
  const agora = useAgora()
  const titulo = React.useId()

  const cabecalho = (n?: number) => (
    <div className="flex items-center gap-2">
      <h2 id={titulo} className="flex items-center gap-2 text-body font-semibold">
        <span className="size-2 rounded-full bg-aberto ring-[3px] ring-aberto/20" aria-hidden="true" />
        Abertos agora
      </h2>
      {n ? (
        <span className="dado text-small text-muted-foreground">
          {n}
          <span className="sr-only"> {n === 1 ? "sorteio aberto" : "sorteios abertos"}</span>
        </span>
      ) : null}
    </div>
  )

  // a região ao vivo fica sempre montada (em todas as fases); só o texto muda
  const aviso = <p className="sr-only" role="status">{estado.fase === "carregando" ? "Carregando os sorteios." : ""}</p>

  if (estado.fase === "carregando") {
    // no celular o esqueleto da tela Início não aparece: o formulário é o foco e não pula quando a lista chega
    const so = !completo && "max-[899px]:hidden"
    return (
      <section aria-labelledby={titulo} aria-busy="true" className={cn("grid content-start gap-3", className)}>
        {aviso}
        <div className={cn(so)}>{cabecalho()}</div>
        <EsqueletoCards n={completo ? 6 : 3} className={cn(so, completo && "min-[560px]:grid-cols-2")} />
      </section>
    )
  }
  if (estado.fase === "erro") {
    return (
      <section aria-labelledby={titulo} className={cn("grid content-start gap-3", className)}>
        {aviso}
        {cabecalho()}
        <FaixaAviso role="alert" icone={<WifiOffIcon strokeWidth={1.75} />} titulo="Não deu para carregar os sorteios.">
          Confira sua internet e tente de novo.
        </FaixaAviso>
        <Button variant="secondary" size="sm" className="h-control w-fit" onClick={recarregar}>
          <RotateCcwIcon />
          Tentar de novo
        </Button>
      </section>
    )
  }

  // o tempo anda: o que fechou desde a última leitura sai da lista
  const lista = estado.lista.filter((s) => !agora || estaAberto(s, agora))
  if (!lista.length) return null
  const total = lista.length
  const mostrados = completo ? lista : lista.slice(0, 3)

  return (
    <section aria-labelledby={titulo} className={cn("grid content-start gap-3", className)}>
      {aviso}
      {cabecalho(total)}
      <ul className={cn("grid gap-2", completo ? "min-[560px]:grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]" : SO_PRIMEIRO_NO_CELULAR)}>
        {mostrados.map((s) => <CardAberto key={s.id} s={s} agora={agora} />)}
      </ul>
      {!completo && total > 1 && (
        <Button asChild variant="secondary" size="sm" className={cn("h-control w-fit", total <= 3 && "min-[900px]:hidden")}>
          <a
            href="?ver=abertos"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              navegar({ ver: "abertos", aba: null, s: null })
              window.scrollTo({ top: 0 })
            }}
          >
            Ver todos os {total}
          </a>
        </Button>
      )}
    </section>
  )
}

/** A lista veio e não tem nenhum sorteio aberto: o bloco some e o formulário ocupa a largura. */
export function semAbertos(estado: EstadoAbertos, agora: number) {
  return estado.fase === "ok" && !estado.lista.some((s) => estaAberto(s, agora || s.criadoEm))
}
