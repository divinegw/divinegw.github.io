"use client"

import * as React from "react"

// A página é estática: os parâmetros da URL (?s=, ?ver=, ?aba=) só existem no navegador.
// useSyncExternalStore lê `location.search` sem Suspense: no servidor e na hidratação o valor é "" (tela Início);
// logo depois, o navegador entrega o valor de verdade.
const EVENTO = "divine:url"

function assinar(aviso: () => void) {
  window.addEventListener("popstate", aviso)
  window.addEventListener(EVENTO, aviso)
  return () => {
    window.removeEventListener("popstate", aviso)
    window.removeEventListener(EVENTO, aviso)
  }
}

/** Os parâmetros da URL atual. Muda quando a pessoa usa voltar/avançar ou quando `navegar` é chamado. */
export function useParametros(): URLSearchParams {
  const busca = React.useSyncExternalStore(
    assinar,
    () => window.location.search,
    () => ""
  )
  return React.useMemo(() => new URLSearchParams(busca), [busca])
}

/** `false` na página gerada e na hidratação; `true` assim que a URL do navegador já pode ser lida. */
export function useUrlLida(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

/** Troca os parâmetros da URL sem recarregar a página. `substituir`: não cria uma entrada nova no histórico (usado nas abas). */
export function navegar(parametros: Record<string, string | null>, substituir = false) {
  const p = new URLSearchParams(window.location.search)
  for (const [k, v] of Object.entries(parametros)) {
    if (v === null) p.delete(k)
    else p.set(k, v)
  }
  const busca = p.toString()
  const destino = window.location.pathname + (busca ? `?${busca}` : "") + window.location.hash
  if (substituir) window.history.replaceState(null, "", destino)
  else window.history.pushState(null, "", destino)
  window.dispatchEvent(new Event(EVENTO))
}

/** "Agora", atualizado a cada `ms`. Faz os "fecha em 13 min" andarem sem recarregar. Começa em 0 (servidor) e vira a hora real no navegador. */
export function useAgora(ms = 30_000): number {
  const [agora, setAgora] = React.useState(0)
  React.useEffect(() => {
    const tique = () => setAgora(Date.now())
    tique()
    const id = window.setInterval(tique, ms)
    return () => window.clearInterval(id)
  }, [ms])
  return agora
}
