"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Menu que abre de um botão (setas, Esc e foco de volta ao botão já vêm do Radix). Flutua: usa shadow-float.
// Abre em 120 ms com a curva do sistema, saindo do ponto do botão (transform-origin do Radix). Itens com 44 px de toque.
function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger(props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 grid min-w-56 max-w-[min(22rem,calc(100vw-2rem))] origin-(--radix-dropdown-menu-content-transform-origin) gap-1 rounded-lg bg-surface p-1 text-foreground shadow-float ease-divine outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:duration-[120ms] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-100",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  perigo = false,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { perigo?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex min-h-control cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-small font-medium outline-none select-none data-highlighted:bg-tint-hover data-[disabled]:cursor-not-allowed data-[disabled]:text-disabled [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        perigo && "text-destructive [&_svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("mx-1 h-px bg-divider", className)} {...props} />
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger }
