import * as React from "react"

import { Detalhes } from "@/components/sorteio/Detalhes"
import type { Sorteio } from "@/lib/dados/firebase"

// O que todo mundo pode conferir: quantas vezes sortearam, quem foi tirado e quem ganhou e não aceitou a tempo.
// As três listas só crescem (as regras do banco não deixam apagar). Tudo é texto.
export function Transparencia({ s }: { s: Sorteio }) {
  const h = s.historico ?? []
  const t = s.tirados ?? []
  const au = s.ausentes ?? []
  if (!h.length && !t.length && !au.length) return null
  return (
    <section aria-label="Transparência do sorteio" className="grid gap-2">
      {h.length > 0 && (
        <Detalhes resumo={`${h.length === 1 ? "Este sorteio foi refeito 1 vez" : `Este sorteio foi refeito ${h.length} vezes`}. Ver os resultados anteriores`}>
          <ol className="grid gap-1 text-small">
            {h.map((r, i) => (
              <li key={`${r.codigo}-${i}`} className="[overflow-wrap:anywhere]">
                {r.ganhadores.join(", ")} <small className="dado text-muted-foreground">(código {r.codigo})</small>
              </li>
            ))}
          </ol>
        </Detalhes>
      )}
      {t.length > 0 && (
        <Detalhes resumo={`${t.length === 1 ? "1 inscrição foi tirada" : `${t.length} inscrições foram tiradas`} por quem organizou. Ver quais`}>
          <ol className="grid gap-1 text-small">{t.map((n, i) => <li key={`${n}-${i}`} className="[overflow-wrap:anywhere]">{n}</li>)}</ol>
        </Detalhes>
      )}
      {au.length > 0 && (
        <Detalhes resumo={`${au.length === 1 ? "1 pessoa ganhou e não aceitou a tempo" : `${au.length} pessoas ganharam e não aceitaram a tempo`}. Ver quem`}>
          <ol className="grid gap-1 text-small">{au.map((n, i) => <li key={`${n}-${i}`} className="[overflow-wrap:anywhere]">{n}</li>)}</ol>
        </Detalhes>
      )}
    </section>
  )
}
