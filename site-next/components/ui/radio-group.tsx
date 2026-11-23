"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Escolha única em "chips" (tipo de prêmio). O Radix cuida das setas, do Home/End e do tabindex.
// Selecionado = primary-bg + borda primary-border; o nome fica escrito, o peso da letra não muda.
function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("flex flex-wrap gap-2", className)} {...props} />
}

function RadioChip({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-chip"
      className={cn(
        "inline-flex h-control items-center gap-2 rounded-md border border-border bg-fill-1 px-3 text-small font-medium text-muted-foreground transition-[background-color,border-color,color] not-disabled:hover:not-data-[state=checked]:border-border-hover not-disabled:active:bg-fill-2 data-[state=checked]:border-primary-border data-[state=checked]:bg-primary-bg data-[state=checked]:text-primary-text disabled:cursor-not-allowed disabled:text-disabled",
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioChip }
