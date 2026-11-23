import * as React from "react"
import { CircleAlertIcon, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Faixa de aviso dentro da página: "erro" (vermelho) ou "ok" (ouro). O ícone e o texto dizem o que é; a cor só reforça.
// Quem usa decide o `role`: aviso que muda sozinho vai numa região aria-live fora daqui.
export function FaixaAviso({
  tom = "erro",
  titulo,
  children,
  icone,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  tom?: "erro" | "ok"
  titulo: string
  icone?: React.ReactNode
}) {
  const Padrao = tom === "erro" ? CircleAlertIcon : CheckIcon
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-4 py-3 text-small",
        tom === "erro" ? "border-destructive-border bg-destructive-bg" : "border-primary-border bg-primary-bg",
        className
      )}
      {...props}
    >
      <span className={cn("mt-0.5 shrink-0 [&_svg]:size-4", tom === "erro" ? "text-destructive" : "text-primary-text")} aria-hidden="true">
        {icone ?? <Padrao strokeWidth={1.75} />}
      </span>
      <p>
        <b className="font-semibold">{titulo}</b>
        {children ? <> {children}</> : null}
      </p>
    </div>
  )
}
