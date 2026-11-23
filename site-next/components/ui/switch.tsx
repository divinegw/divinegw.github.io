"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Interruptor: trilho de 44 x 26 (a linha inteira com o rótulo é o alvo de toque, 44 px de altura).
// Ligado = ouro; desligado = cinza com borda. O estado também vai por aria-checked, não só pela cor.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full border border-border-hover bg-border transition-[background-color,border-color] disabled:cursor-not-allowed disabled:bg-fill-1 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-muted-foreground transition-[translate,background-color] data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-primary-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
