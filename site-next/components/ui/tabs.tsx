"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

// Lista: trilho bg-fill-1 com borda e 6 px de folga em volta das abas (pedido do mantenedor em 23/11/2026: a aba ativa
// não pode encostar na borda do trilho). Cantos concêntricos: trilho 14 (rounded-lg), aba 8 (14 menos a folga de 6).
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1.5 rounded-lg border border-border bg-fill-1 p-1.5 text-muted-foreground group-data-horizontal/tabs:h-control-sm group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
        className
      )}
      {...props}
    />
  )
}

// Peça sem borda (DESIGN.md): hover com véu tint-hover, ativa com véu tint-selected e texto foreground, sem borda.
// O peso da letra não muda entre ativa e inativa (nada de salto de largura).
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-[8px] px-3.5 text-small font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color] group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start enabled:hover:not-data-active:bg-tint-hover enabled:hover:not-data-active:text-foreground enabled:active:not-data-active:bg-tint-pressed disabled:cursor-not-allowed disabled:text-disabled data-active:bg-tint-selected data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-body", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
