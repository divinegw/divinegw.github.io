import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Bloco que abre e fecha (o <details> nativo: teclado e leitor de tela já vêm prontos). Fechado por padrão.
export function Detalhes({
  resumo,
  icone,
  extra,
  sufixoSr,
  className,
  children,
  open,
  onOpenChange,
  ...props
}: Omit<React.ComponentProps<"details">, "children" | "open"> & {
  resumo: string
  icone?: React.ReactNode
  extra?: React.ReactNode
  /** Texto só para leitor de tela, logo depois do resumo (ex.: "de dados"), para o nome acessível dizer de qual bloco é. */
  sufixoSr?: string
  children: React.ReactNode
  /** Controlado: com `open`, quem usa decide se está aberto (e ouve `onOpenChange` quando a pessoa clica). Sem ele, o <details> cuida sozinho. */
  open?: boolean
  onOpenChange?: (aberto: boolean) => void
}) {
  const controle = open === undefined ? {} : { open, onToggle: (e: React.SyntheticEvent<HTMLDetailsElement>) => onOpenChange?.(e.currentTarget.open) }
  return (
    <details className={cn("group rounded-md border border-border", className)} {...props} {...controle}>
      <summary className="flex min-h-control cursor-pointer list-none items-center gap-2 rounded-md px-4 text-small font-semibold text-muted-foreground group-open:rounded-b-none group-open:border-b group-open:border-border group-open:text-foreground not-group-open:hover:text-foreground [&::-webkit-details-marker]:hidden">
        {icone && <span className="shrink-0 [&_svg]:size-4" aria-hidden="true">{icone}</span>}
        <span className="min-w-0">{resumo}{sufixoSr && <span className="sr-only"> {sufixoSr}</span>}</span>
        {extra}
        <ChevronDownIcon className="ml-auto size-4 shrink-0 transition-[rotate] group-open:rotate-180" strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <div className="grid gap-4 p-4">{children}</div>
    </details>
  )
}
