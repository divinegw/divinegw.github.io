"use client"

import * as React from "react"
import { ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Resultado } from "@/lib/dados/firebase"
import { chaveDe, sortearAoVivo, type Inscrito } from "@/lib/sorteio/ao-vivo"
import { cn } from "@/lib/utils"

type Conferencia = "antes" | "conferindo" | "confere" | "mudou" | "nao-confere" | "falhou"

const TEXTO: Record<Exclude<Conferencia, "antes" | "conferindo" | "confere">, string> = {
  mudou: "A lista de inscritos mudou depois do sorteio. Confira pela página de Ganhadores, que guarda a lista do momento do sorteio.",
  "nao-confere": "Não confere: com esta lista e este código, o resultado seria outro.",
  falhou: "Não deu para refazer a conta agora. Tente de novo.",
}

const hora = (r: Resultado) => (r.em ? r.em.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "")

/** Os dados da prova: código, quantos participaram e quando saiu. Os mesmos no resultado do painel e no recibo dos Ganhadores. */
export function DadosProva({ codigo, total, quandoRotulo, quando, lista }: { codigo: string; total: number; quandoRotulo: string; quando: string; lista?: string }) {
  return (
    <dl className="grid grid-cols-[auto_auto_1fr] items-start gap-x-6 gap-y-1 max-[559px]:grid-cols-2">
      <div className="grid gap-0.5 max-[559px]:col-span-2">
        <dt className="rotulo text-muted-foreground">Código</dt>
        <dd className="dado break-all text-small font-medium">{codigo}</dd>
      </div>
      <div className="grid gap-0.5">
        <dt className="rotulo text-muted-foreground">Participantes</dt>
        <dd className="dado text-small font-medium">{total.toLocaleString("pt-BR")}</dd>
      </div>
      {quando && (
        <div className="grid gap-0.5">
          <dt className="rotulo text-muted-foreground">{quandoRotulo}</dt>
          <dd className="dado text-small font-medium">{quando}</dd>
        </div>
      )}
      {lista && (
        <div className="col-span-full grid gap-0.5 max-[559px]:col-span-2">
          <dt className="rotulo text-muted-foreground">Lista</dt>
          <dd className="dado break-all text-small font-medium">{lista}</dd>
        </div>
      )}
    </dl>
  )
}

/** O aviso "Conferido." (ouro, com o escudo). */
export function SeloConferido() {
  return (
    <p className="flex items-start gap-2 rounded-md border border-primary-border bg-primary-bg px-4 py-3 text-small">
      <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden="true" />
      <span><b className="font-semibold">Conferido.</b> Os cálculos refeitos com esta lista e este código deram o mesmo resultado.</span>
    </p>
  )
}

// A prova do sorteio: o código, quantos participaram e a hora, e o botão que refaz a conta com a lista de agora.
// Qualquer pessoa pode conferir: com o mesmo código e a mesma lista, o resultado é sempre o mesmo.
export function Prova({ r, inscritos, className }: { r: Resultado; inscritos: Inscrito[]; className?: string }) {
  const [estado, setEstado] = React.useState<Conferencia>("antes")
  const codigoAtual = React.useRef(r.codigo)
  // outro sorteio (refeito ou troca de quem não confirmou): a conferência anterior não vale mais
  React.useEffect(() => {
    if (codigoAtual.current !== r.codigo) { codigoAtual.current = r.codigo; setEstado("antes") }
  }, [r.codigo])

  async function conferir() {
    if (estado === "conferindo") return
    setEstado("conferindo")
    try {
      const mantidos = r.mantidos ?? []
      const x = await sortearAoVivo(inscritos, r.excluidos, r.ganhadores.length - mantidos.length, r.codigo)
      const mesmaLista = x.impressao === r.impressao
      const ok = mesmaLista && x.ganhadores.join("\n") === r.ganhadores.slice(mantidos.length).join("\n")
      setEstado(ok ? "confere" : mesmaLista ? "nao-confere" : "mudou")
    } catch {
      setEstado("falhou")
    }
  }

  const aviso = estado === "antes" || estado === "conferindo" || estado === "confere" ? "" : TEXTO[estado]
  return (
    <div className={cn("grid gap-4 border-t border-border pt-4", className)}>
      <DadosProva codigo={r.codigo} total={r.total} quandoRotulo="Sorteado às" quando={hora(r)} />
      {estado === "confere" ? (
        <SeloConferido />
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="button" variant="secondary" className="h-control" carregando={estado === "conferindo"} onClick={() => void conferir()}>
            <ShieldCheckIcon />
            Conferir o sorteio
          </Button>
          <span className="min-w-0 flex-1 basis-56 text-small text-muted-foreground">Confira o sorteio novamente com a lista de participantes e o código original.</span>
        </div>
      )}
      <p role="status" className={cn("text-small", aviso ? (estado === "nao-confere" || estado === "falhou" ? "text-destructive" : "text-muted-foreground") : "sr-only")}>
        {estado === "confere" ? "Sorteio conferido." : aviso}
      </p>
    </div>
  )
}

/** Quem ganhou, em chaves, para saber se uma conta está entre os ganhadores. */
export const ehGanhador = (r: Resultado | null, conta: string | null) => Boolean(r && conta && r.ganhadores.some((n) => chaveDe(n) === chaveDe(conta)))
