import * as React from "react"

import { cn } from "@/lib/utils"

// Estado vazio: ícone, título, uma frase e (se couber) uma ação. Borda tracejada, para não parecer um card com dado.
export function Vazio({
  icone,
  titulo,
  children,
  acao,
  className,
}: {
  icone?: React.ReactNode
  titulo: string
  children?: React.ReactNode
  acao?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 rounded-lg border border-dashed border-border-hover px-4 py-8 text-center",
        className
      )}
    >
      {icone && <span className="text-muted-foreground [&_svg]:size-7" aria-hidden="true">{icone}</span>}
      <p className="font-semibold text-foreground">{titulo}</p>
      {children && <p className="max-w-[28ch] text-small text-muted-foreground">{children}</p>}
      {acao}
    </div>
  )
}
