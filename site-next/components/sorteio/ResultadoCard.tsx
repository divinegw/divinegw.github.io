"use client"

import * as React from "react"
import { CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ORIGEM_SITE } from "@/conteudo/site"
import { textoParaCopiar } from "@/lib/sorteio/local"

/** Leva o card do resultado para a tela, só o necessário. Suave apenas se a pessoa não pediu menos movimento. */
export function mostrarCard(titulo: HTMLElement | null) {
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  titulo?.closest("section")?.scrollIntoView({ block: "nearest", behavior: reduz ? "auto" : "smooth" })
}

// O bloco de resultado das abas locais: título (o foco vem para ele), o corpo, e embaixo o código para conferir
// e "Copiar resultado". O anúncio para o leitor de tela sai da aba, numa região fixa.
export function ResultadoCard({
  titulo,
  refTitulo,
  codigo,
  impressao,
  discord,
  conferido,
  aoAnunciar,
  nivel = 3,
  children,
}: {
  titulo: string
  refTitulo: React.Ref<HTMLHeadingElement>
  codigo: string
  impressao?: string
  discord: string
  conferido?: boolean
  aoAnunciar: (texto: string) => void
  /** Nível do título: 3 nas abas; 4 quando o resultado fica dentro de um bloco que já tem título 3 (aba Extras). */
  nivel?: 3 | 4
  children: React.ReactNode
}) {
  const Titulo = nivel === 4 ? "h4" : "h3"
  const idTitulo = React.useId()
  const [copia, setCopia] = React.useState<"" | "ok" | "falhou">("")
  const temporizador = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // Resultado longo (até 10.000 números ou 2.000 nomes) rola dentro do bloco, para o código e o "Copiar resultado"
  // ficarem sempre à vista logo abaixo (stress de 23/11/2026: 10.000 números davam um bloco de 151 mil px no celular).
  // Só vira região focável pelo teclado quando de fato rola.
  const corpo = React.useRef<HTMLDivElement>(null)
  const [rola, setRola] = React.useState(false)
  React.useEffect(() => {
    const el = corpo.current
    if (!el) return
    const mede = () => setRola(el.scrollHeight > el.clientHeight + 1)
    mede()
    const ro = new ResizeObserver(mede)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  async function copiar() {
    let ok = false
    try {
      await navigator.clipboard.writeText(textoParaCopiar({ discord, codigo, impressao }, ORIGEM_SITE))
      ok = true
    } catch { /* sem área de transferência (ou sem permissão): avisa que não deu */ }
    setCopia(ok ? "ok" : "falhou")
    aoAnunciar(ok ? "Resultado copiado." : "Não deu para copiar.")
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setCopia(""), 2000)
  }

  return (
    <section aria-labelledby={idTitulo} className="grid gap-4 rounded-lg border border-primary-border bg-primary-bg p-4 min-[480px]:p-5">
      <Titulo id={idTitulo} ref={refTitulo} tabIndex={-1} className="rotulo text-primary-text outline-none">{titulo}</Titulo>
      <div
        ref={corpo}
        className="max-h-[min(60vh,32rem)] overflow-y-auto overscroll-contain"
        {...(rola ? { tabIndex: 0, role: "region", "aria-label": `${titulo}: lista completa. Use as setas para ver tudo.` } : {})}
      >
        {children}
      </div>
      {conferido && <p className="text-small text-muted-foreground">Resultado conferido pelo código.</p>}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3">
        <p className="min-w-0 text-small text-muted-foreground">
          Código <span className="dado break-all text-foreground">{codigo}</span>
          {impressao && <> · Lista <span className="dado text-foreground">{impressao}</span></>}
        </p>
        <Button type="button" variant="secondary" size="sm" className="h-control" onClick={copiar}>
          <CopyIcon />
          {copia === "ok" ? "Copiado" : copia === "falhou" ? "Não deu para copiar" : "Copiar resultado"}
        </Button>
      </div>
    </section>
  )
}
