"use client"

import * as React from "react"
import { TrophyIcon } from "lucide-react"

import { Relogio, SemPrazo } from "@/components/divine/Relogio"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { Badge } from "@/components/ui/badge"
import type { Sorteio } from "@/lib/dados/firebase"
import { textoPremio } from "@/lib/sorteio/premio"
import { cn } from "@/lib/utils"

export type EstadoSelo = "aberto" | "encerrado" | "sorteando" | "sorteado"

const SELO: Record<EstadoSelo, { variante: "aberto" | "default" | "ouro"; texto: string }> = {
  aberto: { variante: "aberto", texto: "Inscrições abertas" },
  encerrado: { variante: "default", texto: "Inscrições encerradas" },
  sorteando: { variante: "ouro", texto: "Sorteando" },
  sorteado: { variante: "default", texto: "Sorteado" },
}

const vencedoresTexto = (n: number) => `${n} ${n === 1 ? "vencedor" : "vencedores"}`

/** O prêmio e os selos de estado. O nome do prêmio é o título da fase de inscrições (o foco vem para ele quando a fase volta). */
export function Premio({
  s,
  estado,
  refTitulo,
  curto = false,
  semIcone = false,
}: {
  s: Sorteio
  estado: EstadoSelo
  refTitulo?: React.Ref<HTMLHeadingElement>
  /** Nas outras fases o prêmio só aparece em linha, sem selos nem nota. */
  curto?: boolean
  /** Na confirmação o ícone já está dentro do anel do relógio: aqui sai só o nome. */
  semIcone?: boolean
}) {
  const pi = s.premioInfo ?? null
  const nome = pi ? textoPremio(pi) : s.premio
  if (!nome && !pi) return null
  const selo = SELO[estado]
  return (
    <div className={cn("grid items-start gap-x-4 gap-y-3", semIcone ? "grid-cols-1" : curto ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-[auto_minmax(0,1fr)] min-[560px]:gap-y-2")}>
      {!semIcone && <IconePremio premio={pi} tipo={pi?.tipo ?? "texto"} tamanho="g" className="row-span-2" />}
      <div className="min-w-0">
        <h2 ref={refTitulo} tabIndex={-1} className="text-title font-semibold tracking-titulo outline-none [overflow-wrap:anywhere]">{nome}</h2>
        {pi?.descricao ? <p className="text-small text-muted-foreground">{pi.descricao}</p> : null}
      </div>
      {!curto && (
        <div className="col-start-2 flex flex-wrap gap-1.5 max-[559px]:col-span-2 max-[559px]:col-start-1">
          <Badge variant={selo.variante}>{selo.texto}</Badge>
          <Badge variant="ouro"><TrophyIcon aria-hidden="true" />{vencedoresTexto(s.vencedores)}</Badge>
        </div>
      )}
      {!curto && s.descricao ? (
        <p className="col-span-2 border-l-2 border-border-hover pl-3 text-small text-muted-foreground [overflow-wrap:anywhere] whitespace-pre-line">{s.descricao}</p>
      ) : null}
    </div>
  )
}

/** O prazo: relógio com barra, ou "sem prazo". Some quando as inscrições fecham (o selo e o aviso já dizem). */
export function PrazoInscricoes({ s, aberto, agora, organizador }: { s: Sorteio; aberto: boolean; agora: number; organizador: boolean }) {
  const fechaEm = s.fechaEm ? s.fechaEm.toMillis() : null
  // o prazo inteiro, para a barra: da abertura até o fim; sem a data de abertura, vale o que faltava na primeira vez que a tela viu
  const [primeiro, setPrimeiro] = React.useState<number | null>(null)
  if (primeiro === null && fechaEm !== null && agora) setPrimeiro(Math.max(0, fechaEm - agora))
  if (!aberto) return null
  if (fechaEm === null) {
    return (
      <SemPrazo rotulo="Inscrições">
        {organizador ? "Sem prazo. As inscrições ficam abertas até você encerrar." : "Sem prazo. As inscrições ficam abertas até quem organiza encerrar."}
      </SemPrazo>
    )
  }
  const abriu = s.criadoEm ? s.criadoEm.toMillis() : null
  const total = abriu !== null ? fechaEm - abriu : (primeiro ?? 0)
  return <Relogio rotulo="Inscrições fecham em" restanteMs={fechaEm - agora} totalMs={total} />
}
