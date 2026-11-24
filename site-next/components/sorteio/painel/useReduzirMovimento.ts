"use client"

import * as React from "react"

const CONSULTA = "(prefers-reduced-motion: reduce)"

/** `true` quando a pessoa pediu menos movimento: sem roleta, sem animação de entrada, o vencedor aparece direto. */
export function useReduzirMovimento(): boolean {
  return React.useSyncExternalStore(
    (aviso) => {
      const m = window.matchMedia(CONSULTA)
      m.addEventListener("change", aviso)
      return () => m.removeEventListener("change", aviso)
    },
    () => window.matchMedia(CONSULTA).matches,
    () => false
  )
}
