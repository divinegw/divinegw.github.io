"use client"

import * as React from "react"

import { lerAbertos, type SorteioAberto } from "@/lib/dados/rest"

export type EstadoAbertos = { fase: "carregando" } | { fase: "erro" } | { fase: "ok"; lista: SorteioAberto[] }

// Lê os sorteios abertos pela REST (leve, sem o SDK). Recarrega a cada 3 min com a aba à vista e quando
// a pessoa volta para a aba depois de mais de 1 min (o plano grátis do Firebase tem limite de leituras por dia).
export function useAbertos(): { estado: EstadoAbertos; recarregar: () => void } {
  const [estado, setEstado] = React.useState<EstadoAbertos>({ fase: "carregando" })
  const [tentativa, setTentativa] = React.useState(0)
  const jaTemLista = React.useRef(false)

  React.useEffect(() => {
    let vivo = true
    let pedido: AbortController | null = null
    const carregar = () => {
      pedido?.abort()
      const este = (pedido = new AbortController())
      lerAbertos(este.signal)
        .then((lista) => {
          if (!vivo || este.signal.aborted) return
          jaTemLista.current = true
          setEstado({ fase: "ok", lista })
        })
        .catch(() => {
          if (!vivo || este.signal.aborted) return
          // se já havia lista, ela fica na tela; sem lista, mostra o erro
          if (!jaTemLista.current) setEstado({ fase: "erro" })
        })
    }
    carregar()
    const id = window.setInterval(() => { if (!document.hidden) carregar() }, 180_000)
    let saiuEm = 0
    const aoMudarAba = () => {
      if (document.hidden) saiuEm = Date.now()
      else if (Date.now() - saiuEm > 60_000) carregar()
    }
    document.addEventListener("visibilitychange", aoMudarAba)
    return () => {
      vivo = false
      pedido?.abort()
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", aoMudarAba)
    }
  }, [tentativa])

  const recarregar = React.useCallback(() => {
    jaTemLista.current = false
    setEstado({ fase: "carregando" })
    setTentativa((n) => n + 1)
  }, [])

  return { estado, recarregar }
}
