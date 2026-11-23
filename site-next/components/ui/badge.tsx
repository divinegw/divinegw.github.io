import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Etiqueta: 24 px de altura, canto de 6, texto de 12 px em seminegrito. O nome vem sempre escrito
// (a cor sozinha não diz nada). "aberto" leva um ponto de 6 px na cor do texto.
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-sm border border-transparent px-2 text-caption font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-border bg-fill-1 text-muted-foreground",
        ouro: "border-primary-border bg-primary-bg text-primary-text",
        aberto:
          "bg-aberto-bg text-aberto before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        urgente: "bg-urgente-bg text-urgente",
        perigo: "bg-destructive-bg text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
