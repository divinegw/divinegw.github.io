import * as React from "react"
import { CircleAlertIcon } from "lucide-react"

import { Label } from "@/components/ui/label"

type PropsDoCampo = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
}

// Rótulo + campo + ajuda + erro, já ligados: id, htmlFor, aria-describedby e aria-invalid saem daqui.
// Uso: <Campo rotulo="ID da conta" ajuda="..." erro="..."><Input /></Campo>
// O filho é um só elemento (Input ou Textarea). Sem `erro`, o campo não leva aria-invalid.
export function Campo({
  rotulo,
  ajuda,
  erro,
  children,
}: {
  rotulo: string
  ajuda?: string
  erro?: string
  children: React.ReactElement<PropsDoCampo>
}) {
  const base = React.useId()
  const id = children.props.id ?? `campo-${base}`
  const idAjuda = ajuda ? `${id}-ajuda` : undefined
  const idErro = erro ? `${id}-erro` : undefined
  const descricao = [children.props["aria-describedby"], idAjuda, idErro].filter(Boolean).join(" ") || undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": descricao,
        "aria-invalid": erro ? true : children.props["aria-invalid"],
      })}
      {ajuda && (
        <p id={idAjuda} className="text-small text-muted-foreground">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} role="alert" className="flex items-start gap-1.5 text-small text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {erro}
        </p>
      )}
    </div>
  )
}
