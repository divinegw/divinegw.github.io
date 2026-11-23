import * as React from "react"

import { cn } from "@/lib/utils"

// Campo: borda border-field ("aqui se digita"), hover clareia a borda, foco = borda ring + 1 px,
// erro = borda destructive, desativado = cinza sem opacidade. Texto em 16 px (o iPhone não dá zoom).
export const campoBase =
  "w-full min-w-0 rounded-md border border-border-field bg-fill-1 px-3 text-body text-foreground transition-[border-color,box-shadow] placeholder:text-placeholder focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--ring)] focus-visible:outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2 enabled:hover:not-aria-invalid:border-border-field-hover aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_1px_var(--destructive)] disabled:cursor-not-allowed disabled:border-border disabled:bg-fill-1 disabled:text-disabled disabled:placeholder:text-disabled"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        campoBase,
        "h-control file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
