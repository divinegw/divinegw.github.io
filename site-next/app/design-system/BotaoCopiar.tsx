"use client"

import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

// Exemplo do aviso rápido: copia o endereço da vitrine e avisa. Se o navegador não deixar, diz o que fazer.
export function BotaoCopiar() {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast("Link copiado.")
    } catch {
      toast.error("Não deu para copiar. Copie o endereço pela barra do navegador.")
    }
  }

  return (
    <Button variant="secondary" onClick={copiar}>
      <CopyIcon strokeWidth={1.75} aria-hidden="true" />
      Copiar link
    </Button>
  )
}
