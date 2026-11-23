import * as React from "react"

import { campoBase } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(campoBase, "flex field-sizing-content min-h-24 py-2.5", className)}
      {...props}
    />
  )
}

export { Textarea }
