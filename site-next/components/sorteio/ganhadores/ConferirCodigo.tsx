"use client"

import * as React from "react"
import { CircleAlertIcon, SearchCheckIcon } from "lucide-react"

import { Recibo, textoConferencia } from "@/components/sorteio/ganhadores/Recibo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DadosGanhadores } from "@/lib/dados"
import type { Registro } from "@/lib/dados/firebase"
import { limpaCodigo } from "@/lib/sorteio/aleatorio"

type Busca = { fase: "ocioso" | "procurando" | "formato" | "nao-achou" | "falhou" }

const MSG = {
  formato: "O código tem 12 letras e números, como RFMJ-M2RD-QWNK.",
  "nao-achou": "Nenhum sorteio com esse código. Confira se digitou igual ao resultado.",
  falhou: "Não deu para procurar agora. Confira sua internet e tente de novo.",
} as const

/** 12 letras e números, em maiúsculas, com os hifens no lugar (RFMJ-M2RD-QWNK). `null` se não tem essa forma. */
export function normalizarCodigo(texto: string): string | null {
  const limpo = limpaCodigo(texto).replace(/-/g, "")
  return /^[A-Z0-9]{12}$/.test(limpo) ? `${limpo.slice(0, 4)}-${limpo.slice(4, 8)}-${limpo.slice(8)}` : null
}

// "Conferir pelo código": o campo, a busca e, quando acha, o recibo com a prova (a mesma do resultado do painel).
export function ConferirCodigo({ dados, anunciar }: { dados: DadosGanhadores; anunciar: (texto: string) => void }) {
  const [valor, setValor] = React.useState("")
  const [busca, setBusca] = React.useState<Busca>({ fase: "ocioso" })
  // o recibo anterior fica na tela enquanto a nova busca não responde
  const [recibo, setRecibo] = React.useState<Registro | null>(null)
  const pedido = React.useRef<AbortController | null>(null)
  const campo = React.useRef<HTMLInputElement>(null)
  const id = React.useId()
  React.useEffect(() => () => pedido.current?.abort(), [])

  const erro = busca.fase === "formato" || busca.fase === "nao-achou" || busca.fase === "falhou" ? MSG[busca.fase] : null
  const procurando = busca.fase === "procurando"

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (procurando) return
    pedido.current?.abort()
    const codigo = normalizarCodigo(valor)
    if (!codigo) {
      // o foco volta ao campo, que aponta para a mensagem (aria-describedby): o leitor de tela lê o erro uma vez só
      setBusca({ fase: "formato" })
      setRecibo(null)
      campo.current?.focus()
      return
    }
    const este = (pedido.current = new AbortController())
    setBusca({ fase: "procurando" })
    anunciar("Conferindo.")
    try {
      const r = await dados.lerRegistroPorCodigo(codigo, este.signal)
      if (este.signal.aborted) return
      if (r) {
        setBusca({ fase: "ocioso" })
        setRecibo(r)
      } else {
        setBusca({ fase: "nao-achou" })
        setRecibo(null)
        anunciar(MSG["nao-achou"])
      }
    } catch {
      if (este.signal.aborted) return
      setBusca({ fase: "falhou" })
      setRecibo(null)
      anunciar(MSG.falhou)
    }
  }

  return (
    <div className="grid max-w-[640px] gap-4">
      <form onSubmit={(e) => void enviar(e)} noValidate className="grid gap-2 rounded-lg border border-border bg-surface p-4 min-[560px]:p-5">
        <label htmlFor={`${id}-codigo`} className="text-body font-semibold">Conferir pelo código</label>
        <div className="flex gap-2">
          <Input
            ref={campo}
            id={`${id}-codigo`}
            name="codigo"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value)
              if (busca.fase === "formato" || busca.fase === "nao-achou" || busca.fase === "falhou") setBusca({ fase: "ocioso" })
            }}
            maxLength={20}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="RFMJ-M2RD-QWNK"
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? `${id}-msg` : `${id}-ajuda`}
            className="dado min-w-0 flex-1"
          />
          <Button type="submit" carregando={procurando} className="min-w-[8.75rem]">
            <SearchCheckIcon />
            {procurando ? "Conferindo…" : "Conferir"}
          </Button>
        </div>
        {erro ? (
          <p id={`${id}-msg`} className="flex items-start gap-1.5 text-small text-destructive">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {erro}
          </p>
        ) : (
          <p id={`${id}-ajuda`} className="text-small text-muted-foreground">12 letras e números, como aparece no resultado.</p>
        )}
      </form>
      {recibo && (
        <Recibo key={recibo.id} r={recibo} foco aoConferir={(c) => anunciar(textoConferencia(recibo, c))} />
      )}
    </div>
  )
}
