"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  tom = "ouro",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** "urgente" (laranja) só para o prazo, nos últimos segundos. */
  tom?: "ouro" | "urgente"
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative flex h-1 w-full items-center overflow-hidden rounded-full bg-fill-2",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 rounded-full transition-transform duration-200 ease-divine",
          tom === "urgente" ? "bg-urgente" : "bg-primary"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
