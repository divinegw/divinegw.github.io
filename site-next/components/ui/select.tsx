import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { campoBase } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Seletor nativo (o <select> do navegador: no celular abre a lista do sistema, sem custo de JS).
// Mesma aparência do Input; a seta é só desenho.
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(campoBase, "h-control appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </div>
  )
}

export { Select }
