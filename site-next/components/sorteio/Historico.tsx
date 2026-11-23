"use client"

import * as React from "react"
import { HistoryIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { apagarHistorico, assinarHistorico, lerCru, lerHistorico } from "@/lib/sorteio/historico"
import { quando } from "@/lib/sorteio/local"

// "Histórico neste navegador": os últimos sorteios das abas locais, guardados só aqui (mesma chave do site de hoje).
// No servidor e na hidratação o histórico é vazio; o navegador entrega o de verdade logo depois.
export function Historico() {
  const cru = React.useSyncExternalStore(assinarHistorico, lerCru, () => "[]")
  const itens = React.useMemo(() => lerHistorico(cru), [cru])
  const titulo = React.useRef<HTMLHeadingElement>(null)

  return (
    <section aria-labelledby="hist-titulo" className="mt-6 grid gap-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-2">
        <h3 id="hist-titulo" ref={titulo} tabIndex={-1} className="flex items-center gap-2 text-body font-semibold outline-none">
          <HistoryIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          Histórico neste navegador
        </h3>
        {itens.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-control"
            onClick={() => {
              apagarHistorico()
              titulo.current?.focus()
            }}
          >
            Apagar histórico
          </Button>
        )}
      </div>
      {itens.length === 0 ? (
        <p className="text-small text-muted-foreground">Os sorteios que você fizer aparecem aqui. Ficam salvos só neste navegador.</p>
      ) : (
        <ol className="grid">
          {itens.map((x, i) => (
            <li key={`${x.em}-${x.codigo}-${i}`} className="grid gap-0.5 border-b border-divider py-2 text-small min-[640px]:grid-cols-[8rem_minmax(0,1fr)_auto] min-[640px]:items-baseline min-[640px]:gap-3">
              <span className="rotulo text-muted-foreground">{x.modo}</span>
              <span className="[overflow-wrap:anywhere]">{x.resumo}</span>
              <span className="dado text-caption whitespace-nowrap text-muted-foreground">
                {quando(new Date(x.em))} · {x.codigo}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
