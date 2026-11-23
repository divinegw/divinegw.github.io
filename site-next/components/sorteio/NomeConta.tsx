import * as React from "react"

// Nome de conta com o ".1234" apagado ao lado. Sempre texto (o React escapa): nome de conta é dado de fora.
export function NomeConta({ nome }: { nome: string }) {
  const m = /^(.*?)(\.\d{4})$/.exec(nome)
  return m ? (
    <>
      {m[1]}
      <small className="dado text-muted-foreground">{m[2]}</small>
    </>
  ) : (
    <>{nome}</>
  )
}
