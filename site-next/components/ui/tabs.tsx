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

// Lista: trilho bg-fill-1 com borda; a aba ativa sobe para bg-surface. Altura h-control-sm.
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 rounded-md border border-border bg-fill-1 p-1 text-muted-foreground group-data-horizontal/tabs:h-control-sm group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
        className
      )}
      {...props}
    />
  )
}

// O peso da letra não muda entre ativa e inativa (nada de salto de largura).
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-sm border border-transparent px-3 text-small font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color] group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start enabled:hover:not-data-active:bg-tint-hover disabled:cursor-not-allowed disabled:text-disabled data-active:border-border data-active:bg-surface data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
