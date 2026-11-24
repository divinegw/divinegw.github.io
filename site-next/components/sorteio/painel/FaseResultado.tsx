"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Premio } from "@/components/sorteio/painel/Cabecalho"
import { Prova } from "@/components/sorteio/painel/Prova"
import { NomeConta } from "@/components/sorteio/NomeConta"
import type { Resultado, Sorteio } from "@/lib/dados/firebase"
import type { Inscrito } from "@/lib/sorteio/ao-vivo"
import { textoPremio } from "@/lib/sorteio/premio"
import { iniciais } from "@/lib/sorteio/painel"

// Resultado de um sorteio sem confirmação: o nome em destaque, centralizado, e embaixo a prova (código e conferência).
// Um vencedor: o nome é o título (o foco vem para ele). Vários: lista numerada, todos com o mesmo peso.
export function FaseResultado({
  s,
  r,
  inscritos,
  euGanhei,
  organizador,
  refTitulo,
}: {
  s: Sorteio
  r: Resultado
  inscritos: Inscrito[]
  euGanhei: boolean
  organizador: boolean
  refTitulo: React.Ref<HTMLHeadingElement>
}) {
  const premio = s.premioInfo ? textoPremio(s.premioInfo) : s.premio
  const varios = r.ganhadores.length > 1
  return (
    <>
      <Premio s={s} estado="sorteado" curto />
      <div className="grid justify-items-center gap-3 text-center">
        {varios ? (
          <>
            <h2 ref={refTitulo} tabIndex={-1} className="rotulo text-primary-text outline-none">{r.ganhadores.length} vencedores</h2>
            <ol className="grid w-full max-w-md gap-2 text-left">
              {r.ganhadores.map((n, i) => (
                <li key={n} className="flex min-h-control items-center gap-3 rounded-md border border-primary-border bg-primary-bg px-3 py-2">
                  <span className="dado w-5 shrink-0 text-center text-small font-bold text-primary-text">{i + 1}</span>
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-fill-1 text-small font-bold text-muted-foreground">{iniciais(n)}</span>
                  <span className="min-w-0 text-lead font-semibold [overflow-wrap:anywhere]"><NomeConta nome={n} /></span>
                </li>
              ))}
            </ol>
            {premio ? <p className="text-small text-muted-foreground">Cada um ganha <b className="font-semibold text-foreground [overflow-wrap:anywhere]">{premio}</b>.</p> : null}
          </>
        ) : (
          <>
            <span className="rotulo text-primary-text">Vencedor</span>
            <h2 ref={refTitulo} tabIndex={-1} className="max-w-full text-display font-bold tracking-titulo outline-none [overflow-wrap:anywhere]">
              <NomeConta nome={r.ganhadores[0] ?? ""} />
            </h2>
            {premio ? <p className="text-small text-muted-foreground">ganhou <b className="font-semibold text-foreground [overflow-wrap:anywhere]">{premio}</b></p> : null}
          </>
        )}
        {organizador ? null : euGanhei ? (
          <FaixaAviso tom="ok" titulo="Você ganhou." icone={<CheckIcon strokeWidth={1.75} />} className="text-left">
            Fale com quem organiza para receber no jogo.
          </FaixaAviso>
        ) : (
          <p className="text-small text-muted-foreground">Não foi dessa vez. {r.total.toLocaleString("pt-BR")} {r.total === 1 ? "pessoa participou" : "pessoas participaram"}.</p>
        )}
      </div>
      <Prova r={r} inscritos={inscritos} />
    </>
  )
}
