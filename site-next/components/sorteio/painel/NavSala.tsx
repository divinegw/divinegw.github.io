"use client"

import * as React from "react"
import { ChevronLeftIcon, TrophyIcon } from "lucide-react"

import { navegar } from "@/components/sorteio/url"

const link = "-my-2.5 inline-flex min-h-control items-center gap-1.5 rounded-sm text-small font-semibold text-muted-foreground hover:text-foreground [&_svg]:size-4"

/** Os dois caminhos de saída do painel: a lista de sorteios abertos e os vencedores. */
export function NavSala() {
  return (
    <nav aria-label="Sorteios" className="flex flex-wrap items-center gap-x-4">
      <a
        href="/sorteio.html?ver=abertos"
        className={link}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          navegar({ s: null, ver: "abertos" })
          window.scrollTo({ top: 0 })
        }}
      >
        <ChevronLeftIcon strokeWidth={1.75} aria-hidden="true" />
        Todos os sorteios
      </a>
      <a href="/sorteio/ganhadores.html" className={link}>
        <TrophyIcon strokeWidth={1.75} aria-hidden="true" />
        Vencedores
      </a>
    </nav>
  )
}
