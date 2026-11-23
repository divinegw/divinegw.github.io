import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Caixa de marcar (várias podem estar ligadas). A linha inteira é o alvo (44 px de altura); a ajuda fica ligada à caixa.
// Marcada = ouro com o visto; o nome e o estado também vão pela caixa nativa, não só pela cor.
export function Opcao({
  rotulo,
  ajuda,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "children"> & { rotulo: React.ReactNode; ajuda?: React.ReactNode }) {
  const base = React.useId()
  const id = props.id ?? `opcao-${base}`
  const idAjuda = ajuda ? `${id}-ajuda` : undefined
  return (
    <label htmlFor={id} className={cn("flex min-h-control cursor-pointer items-start gap-3 py-2.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:text-disabled", className)}>
      <span className="relative mt-px size-[22px] shrink-0">
        <input
          {...props}
          id={id}
          type="checkbox"
          aria-describedby={[props["aria-describedby"], idAjuda].filter(Boolean).join(" ") || undefined}
          className="peer absolute inset-0 size-full cursor-[inherit] appearance-none rounded-sm border border-border-field bg-fill-1 transition-[background-color,border-color] checked:border-primary checked:bg-primary enabled:hover:not-checked:border-border-field-hover disabled:border-border"
        />
        <CheckIcon className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="grid min-w-0 gap-0.5 text-small font-medium">
        <span>{rotulo}</span>
        {ajuda && <span id={idAjuda} className="font-normal text-muted-foreground">{ajuda}</span>}
      </span>
    </label>
  )
}
