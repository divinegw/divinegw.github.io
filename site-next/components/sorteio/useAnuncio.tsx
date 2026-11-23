"use client"

import * as React from "react"

// Frase curta para o leitor de tela. A região fica sempre montada; o texto é limpo e preenchido de novo,
// para ser lido outra vez mesmo se for igual ao anterior.
export function useAnuncio() {
  const [anuncio, setAnuncio] = React.useState("")
  const temporizador = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(temporizador.current), [])
  const anunciar = React.useCallback((texto: string) => {
    window.clearTimeout(temporizador.current)
    setAnuncio("")
    if (texto) temporizador.current = window.setTimeout(() => setAnuncio(texto), 60)
  }, [])
  const regiao = <p role="status" className="sr-only">{anuncio}</p>
  return { anunciar, regiao }
}
