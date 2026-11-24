"use client"

import * as React from "react"
import { RotateCcwIcon, ShieldAlertIcon } from "lucide-react"

import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { DadosProva, SeloConferido } from "@/components/sorteio/painel/Prova"
import { Button } from "@/components/ui/button"
import type { Registro } from "@/lib/dados/firebase"
import { confere } from "@/lib/sorteio/ao-vivo"
import { dataCurta, pessoas } from "@/lib/sorteio/exibir"
import { textoPremio } from "@/lib/sorteio/premio"
import { cn } from "@/lib/utils"

export type Conferencia = "conferindo" | "confere" | "nao-confere" | "falhou"

export const nomeDoRegistro = (r: Registro) => (r.premioInfo ? textoPremio(r.premioInfo) : r.premio) || r.titulo

/** O que o leitor de tela ouve quando a conferência termina. */
export function textoConferencia(r: Registro, c: Exclude<Conferencia, "conferindo">): string {
  if (c === "confere") return r.ganhadores.length > 1 ? `Resultado conferido. ${r.ganhadores.length} ganhadores.` : `Resultado conferido. ${r.ganhadores[0] ?? ""} ganhou.`
  if (c === "nao-confere") return "Não confere. Com a lista guardada, o sorteio não dá este resultado."
  return "Não deu para conferir agora. Tente de novo em alguns segundos."
}

const ROTULO: Record<Conferencia, string> = {
  conferindo: "Conferindo",
  confere: "Resultado conferido",
  "nao-confere": "Não confere",
  falhou: "Não deu para conferir",
}

/**
 * O recibo de um sorteio já feito: quem ganhou, o prêmio e a prova (código, participantes, quando), conferida na hora
 * com a lista guardada. Usa os mesmos dados e o mesmo selo "Conferido." do resultado do painel.
 * `foco`: o título recebe o foco quando o recibo aparece (a busca pelo código). `aoConferir`: avisa o resultado para a região fixa da página.
 */
export function Recibo({
  r,
  foco = false,
  nivel = 2,
  aoConferir,
  className,
}: {
  r: Registro
  foco?: boolean
  nivel?: 2 | 3
  aoConferir?: (resultado: Exclude<Conferencia, "conferindo">) => void
  className?: string
}) {
  const [estado, setEstado] = React.useState<Conferencia>("conferindo")
  const [tentativa, setTentativa] = React.useState(0)
  const [listaAberta, setListaAberta] = React.useState(false)
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const aviso = React.useRef(aoConferir)
  React.useEffect(() => { aviso.current = aoConferir }, [aoConferir])

  React.useEffect(() => {
    let vivo = true
    confere(r)
      .then((ok) => { if (vivo) { const e = ok ? "confere" : "nao-confere"; setEstado(e); aviso.current?.(e) } })
      .catch(() => { if (vivo) { setEstado("falhou"); aviso.current?.("falhou") } })
    return () => { vivo = false }
  }, [r, tentativa])

  React.useEffect(() => { if (foco) titulo.current?.focus() }, [foco])

  const Titulo = nivel === 2 ? "h2" : "h3"
  const varios = r.ganhadores.length > 1
  const premio = nomeDoRegistro(r)
  const quando = dataCurta(r.data)
  const fora = new Set(r.excluidos)
  const mantidos = new Set(r.mantidos ?? [])

  return (
    <article className={cn("grid gap-3 rounded-lg border border-primary-border bg-surface p-4 min-[560px]:p-5", className)}>
      <span className={cn("rotulo", estado === "nao-confere" || estado === "falhou" ? "text-destructive" : "text-primary-text")}>{ROTULO[estado]}</span>
      <Titulo ref={titulo} tabIndex={-1} className={cn("rounded-sm font-bold tracking-titulo outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [overflow-wrap:anywhere]", varios ? "text-title" : "text-[clamp(28px,5vw,40px)] leading-[1.1]")}>
        {varios ? `${r.ganhadores.length} ganhadores` : <NomeConta nome={r.ganhadores[0] ?? ""} />}
      </Titulo>
      {varios && (
        <ol className="grid gap-1.5">
          {r.ganhadores.map((n, i) => (
            <li key={`${i}-${n}`} className="flex min-w-0 items-baseline gap-3">
              <span className="dado w-5 shrink-0 text-center text-small font-bold text-primary-text">{i + 1}</span>
              <span className="min-w-0 font-semibold [overflow-wrap:anywhere]"><NomeConta nome={n} /></span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-lead text-muted-foreground [overflow-wrap:anywhere]">
        {varios ? "ganharam" : "ganhou"} <b className="font-semibold text-foreground">{premio}</b>
        {r.titulo && r.titulo !== premio ? <> em {r.titulo}</> : null}
      </p>

      <div className="grid gap-4 border-t border-border pt-4">
        <DadosProva codigo={r.codigo} total={r.total} quandoRotulo="Sorteado em" quando={quando} lista={r.impressao} />
        {estado === "confere" && <SeloConferido />}
        {estado === "nao-confere" && (
          <FaixaAviso titulo="Não confere." icone={<ShieldAlertIcon strokeWidth={1.75} />}>
            Com a lista guardada, o sorteio não dá este resultado.
          </FaixaAviso>
        )}
        {estado === "falhou" && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-small text-destructive">Não deu para conferir agora. Tente de novo em alguns segundos.</p>
            <Button type="button" variant="secondary" size="sm" className="h-control" onClick={() => { setEstado("conferindo"); setTentativa((n) => n + 1) }}>
              <RotateCcwIcon />
              Tentar de novo
            </Button>
          </div>
        )}
        {estado === "conferindo" && <p className="text-small text-muted-foreground">Refazendo a conta com a lista guardada.</p>}
      </div>

      {(r.ausentes ?? []).length > 0 && (
        <p className="text-small text-muted-foreground [overflow-wrap:anywhere]">Não aceitaram a tempo:{" "}
          {(r.ausentes ?? []).map((n, i) => (
            <React.Fragment key={`${i}-${n}`}>{i > 0 && ", "}<NomeConta nome={n} /></React.Fragment>
          ))}.
        </p>
      )}
      {r.refeito > 0 && (
        <p className="text-small text-muted-foreground">
          Este sorteio foi refeito {r.refeito === 1 ? "1 vez" : `${r.refeito} vezes`} antes deste resultado. Os resultados anteriores ficaram públicos na página do sorteio enquanto ela esteve no ar.
        </p>
      )}
      {r.participantes.length > 0 && (
        <details onToggle={(e) => setListaAberta(e.currentTarget.open)} className="group text-small">
          <summary className="-my-2 flex min-h-control w-fit cursor-pointer items-center rounded-sm font-medium text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Ver os {pessoas(r.participantes.length, "participante", "participantes")}
          </summary>
          {listaAberta && (
            <ol className="mt-2 grid max-h-72 gap-1 overflow-y-auto rounded-md border border-border bg-fill-1 p-3 min-[560px]:grid-cols-2">
              {r.participantes.map((p, i) => {
                const saiu = fora.has(p.toLocaleLowerCase("pt-BR")) && !mantidos.has(p)
                return (
                  <li key={`${i}-${p}`} className={cn("[overflow-wrap:anywhere]", saiu && "text-muted-foreground line-through")}>
                    <NomeConta nome={p} />
                    {saiu && <span className="sr-only"> (ficou de fora)</span>}
                  </li>
                )
              })}
            </ol>
          )}
        </details>
      )}
    </article>
  )
}
