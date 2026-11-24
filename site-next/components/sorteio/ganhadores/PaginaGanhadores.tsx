"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { ConferirCodigo } from "@/components/sorteio/ganhadores/ConferirCodigo"
import { ListaGanhadores } from "@/components/sorteio/ganhadores/ListaGanhadores"
import { useParametros, useUrlLida } from "@/components/sorteio/url"
import { carregarGanhadores, type DadosGanhadores } from "@/lib/dados"

const FRASE = "Confira os vencedores e valide qualquer resultado pelo código de verificação."

// Se a camada de dados nem carregar, a lista mostra "Não deu para carregar" e a busca, "Não deu para procurar".
const SEM_DADOS: DadosGanhadores = {
  falso: false,
  lerRegistros: () => Promise.reject(new Error("sem dados")),
  lerRegistroPorCodigo: () => Promise.reject(new Error("sem dados")),
}

// /sorteio/ganhadores.html: conferir um sorteio pelo código (recibo com a prova) e a lista dos últimos ganhadores.
export function PaginaGanhadores() {
  const lida = useUrlLida()
  const cenario = useParametros().get("falso")
  const [dados, setDados] = React.useState<DadosGanhadores | null>(null)
  const [anuncio, setAnuncio] = React.useState("")
  const quadro = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!lida) return
    let vivo = true
    carregarGanhadores(cenario)
      .then((d) => { if (vivo) setDados(d) })
      .catch(() => { if (vivo) setDados(SEM_DADOS) })
    return () => { vivo = false }
  }, [lida, cenario])

  // uma região fixa para tudo o que o leitor de tela precisa ouvir; o texto limpa antes, para a mesma frase ser lida de novo
  const anunciar = React.useCallback((texto: string) => {
    if (quadro.current !== null) cancelAnimationFrame(quadro.current)
    setAnuncio("")
    quadro.current = requestAnimationFrame(() => setAnuncio(texto))
  }, [])

  return (
    <>
      <header className="mb-8 grid gap-2">
        <nav aria-label="Você está em" className="flex items-center gap-1 text-small text-muted-foreground">
          <a href="/" className="-my-3 inline-flex h-control items-center rounded-sm hover:text-foreground">DIVINE</a>
          <ChevronRightIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          <a href="/sorteio.html" className="-my-3 inline-flex h-control items-center rounded-sm hover:text-foreground">Sorteio</a>
          <ChevronRightIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span aria-current="page">Ganhadores</span>
        </nav>
        <h1 className="text-page font-bold tracking-titulo">Ganhadores</h1>
        <p className="max-w-[60ch] text-lead text-muted-foreground">{FRASE}</p>
      </header>
      <p role="status" className="sr-only">{anuncio}</p>
      <div className="grid gap-10">
        {dados ? (
          <>
            <ConferirCodigo dados={dados} anunciar={anunciar} />
            <ListaGanhadores dados={dados} anunciar={anunciar} />
          </>
        ) : (
          <GanhadoresCarregando />
        )}
      </div>
    </>
  )
}

// Só na primeira pintura, até a URL poder ser lida (a página gerada não sabe se tem ?falso=).
function GanhadoresCarregando() {
  return <div aria-hidden="true" className="h-40 max-w-[640px] rounded-lg border border-border bg-surface" />
}
