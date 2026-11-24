import * as React from "react"
import { ClockIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { URGENTE_MS, formatarRelogio, tempoPorExtenso } from "@/lib/sorteio/painel"
import { cn } from "@/lib/utils"

// Relógio do prazo: número grande em Inter com algarismos de largura fixa, barra que esvazia embaixo.
// Laranja só nos últimos 10 s. O desenho é aria-hidden e o tempo vem por extenso num texto só para leitor de tela,
// que NÃO é uma região viva: o leitor lê quando a pessoa chega ali, nunca a cada segundo (quem avisa a mudança de estado é o painel).
export function Relogio({
  rotulo,
  restanteMs,
  totalMs,
  className,
}: {
  rotulo: string
  /** Quanto falta, em milissegundos. */
  restanteMs: number
  /** O prazo inteiro, para a barra. Sem ele, não há barra. */
  totalMs?: number
  className?: string
}) {
  const urgente = restanteMs > 0 && restanteMs <= URGENTE_MS
  const fracao = totalMs && totalMs > 0 ? Math.max(0, Math.min(1, restanteMs / totalMs)) : 0
  return (
    <div className={cn("grid gap-2", className)}>
      <span className="rotulo text-muted-foreground">{rotulo}</span>
      <span
        aria-hidden="true"
        className={cn("text-display font-bold tracking-titulo tabular-nums transition-colors", urgente ? "text-urgente" : "text-foreground")}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatarRelogio(restanteMs)}
      </span>
      <span className="sr-only">{tempoPorExtenso(restanteMs)}</span>
      {totalMs ? <Progress aria-hidden="true" value={fracao * 100} tom={urgente ? "urgente" : "ouro"} /> : null}
    </div>
  )
}

/** "Sem prazo": no lugar do relógio, uma frase com ícone. */
export function SemPrazo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="rotulo text-muted-foreground">{rotulo}</span>
      <p className="flex items-start gap-2 text-small text-muted-foreground">
        <ClockIcon className="mt-0.5 size-4 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden="true" />
        <span>{children}</span>
      </p>
    </div>
  )
}
