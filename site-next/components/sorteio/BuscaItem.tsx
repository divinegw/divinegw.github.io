"use client"

import * as React from "react"
import { CheckIcon, CircleAlertIcon, Loader2Icon, SearchIcon, WifiOffIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { sugestoesComIcone, type PremioInfo } from "@/lib/sorteio/premio"
import { cn } from "@/lib/utils"

export type EstadoBusca = "ocioso" | "procurando" | "achou" | "nada" | "offline"

type Props = {
  id?: string
  name?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false"
  texto: string
  onTexto: (texto: string) => void
  escolhido: PremioInfo | null
  onEscolher: (item: PremioInfo | null) => void
  /** Avisa o formulário quando a busca mostra um erro próprio (para ele não pôr um segundo aviso no mesmo campo). */
  onEstado?: (estado: EstadoBusca) => void
  maxLength?: number
}

// Busca de item com ícone: padrão ARIA "combobox com lista" (o foco fica no campo; a opção ativa vai em aria-activedescendant).
// Espera 250 ms depois da última tecla, cancela a busca anterior e só começa com 3 letras. Tudo que vem da wiki e da API
// do jogo é texto: nada vira HTML.
export function BuscaItem({ id = "item", name, texto, onTexto, escolhido, onEscolher, onEstado, maxLength = 80, ...aria }: Props) {
  const [estado, setEstadoLocal] = React.useState<EstadoBusca>("ocioso")
  const [opcoes, setOpcoes] = React.useState<PremioInfo[]>([])
  const [ativa, setAtiva] = React.useState(-1)
  const [aberta, setAberta] = React.useState(false)
  const [termo, setTermo] = React.useState("")
  const espera = React.useRef<number | undefined>(undefined)
  const pedido = React.useRef<AbortController | null>(null)
  const idLista = `${id}-lista`
  const idMsg = `${id}-busca-msg`
  const idDica = `${id}-dica`

  const setEstado = React.useCallback((e: EstadoBusca) => { setEstadoLocal(e); onEstado?.(e) }, [onEstado])

  React.useEffect(() => () => { window.clearTimeout(espera.current); pedido.current?.abort() }, [])

  function aoDigitar(valor: string) {
    onTexto(valor)
    if (escolhido && escolhido.nome.toLowerCase() !== valor.trim().toLowerCase()) onEscolher(null)
    window.clearTimeout(espera.current)
    pedido.current?.abort()
    const t = valor.trim()
    if (t.length < 3) { setEstado("ocioso"); setOpcoes([]); setAberta(false); return }
    setTermo(t)
    setEstado("procurando")
    espera.current = window.setTimeout(async () => {
      const este = (pedido.current = new AbortController())
      try {
        const r = await sugestoesComIcone(t, este.signal)
        if (este.signal.aborted) return
        setOpcoes(r); setAtiva(-1); setAberta(r.length > 0); setEstado(r.length ? "achou" : "nada")
      } catch {
        if (este.signal.aborted) return
        setOpcoes([]); setAberta(false); setEstado("offline")
      }
    }, 250)
  }

  function escolher(item: PremioInfo) {
    window.clearTimeout(espera.current)
    pedido.current?.abort()
    onTexto(item.nome)
    onEscolher(item)
    setAberta(false); setEstado("ocioso")
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && opcoes.length) {
      e.preventDefault(); setAberta(true); setAtiva((a) => Math.min(a + 1, opcoes.length - 1))
    } else if (e.key === "ArrowUp" && opcoes.length) {
      e.preventDefault(); setAberta(true); setAtiva((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && aberta && ativa >= 0) {
      e.preventDefault(); escolher(opcoes[ativa])
    } else if (e.key === "Escape" && aberta) {
      e.preventDefault(); setAberta(false)
    }
  }

  function aoSair() {
    // texto igual a uma sugestão: escolhe ela (o envio procura o resto)
    const igual = opcoes.find((o) => o.nome.toLowerCase() === texto.trim().toLowerCase())
    if (igual && !escolhido) escolher(igual)
    else setAberta(false)
  }

  const erroBusca = estado === "nada" || estado === "offline"
  const curto = texto.trim().length > 0 && texto.trim().length < 3 && !escolhido
  const aria_describedby = [aria["aria-describedby"], curto ? idDica : null, erroBusca ? idMsg : null].filter(Boolean).join(" ") || undefined
  // texto da região ao vivo (sempre montada): só o conteúdo muda
  const falado = estado === "procurando" ? `Procurando "${termo}".`
    : estado === "achou" ? (opcoes.length === 1 ? "1 item encontrado." : `${opcoes.length} itens encontrados.`)
    : ""

  return (
    <div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        <Input
          id={id}
          name={name}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={aberta}
          aria-controls={idLista}
          aria-activedescendant={aberta && ativa >= 0 ? `${id}-op${ativa}` : undefined}
          aria-describedby={aria_describedby}
          aria-invalid={aria["aria-invalid"] || erroBusca ? true : undefined}
          value={texto}
          onChange={(e) => aoDigitar(e.target.value)}
          onKeyDown={aoTeclar}
          onFocus={() => { if (opcoes.length && !escolhido) setAberta(true) }}
          onBlur={aoSair}
          placeholder="Aurene's Bite"
          autoComplete="off"
          spellCheck={false}
          maxLength={maxLength}
          className="pl-[38px]"
        />
      </div>

      {/* a lista fica sempre no DOM (aria-controls precisa de um alvo); escondida quando fechada */}
      <ul
        id={idLista}
        role="listbox"
        aria-label="Itens encontrados"
        hidden={!aberta}
        className="mt-1 grid gap-0.5 rounded-md border border-border-hover bg-fill-1 p-1"
      >
        {opcoes.map((o, i) => (
          <li
            key={o.itemId}
            id={`${id}-op${i}`}
            role="option"
            aria-selected={i === ativa}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => escolher(o)}
            className={cn(
              "flex min-h-control cursor-pointer items-center gap-2.5 rounded-sm p-2 hover:bg-tint-hover",
              i === ativa && "bg-primary-bg hover:bg-primary-bg"
            )}
          >
            <IconePremio premio={o} tipo="item" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-medium">{o.nome}</span>
              <small className="truncate text-caption text-muted-foreground">{o.descricao}</small>
            </span>
            {i === ativa && <CheckIcon className="size-4 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden="true" />}
          </li>
        ))}
      </ul>

      {curto && <p id={idDica} className="mt-1 text-small text-muted-foreground">Digite 3 letras ou mais.</p>}

      {/* regiões ao vivo: ficam sempre montadas e só o texto muda, para o leitor de tela anunciar */}
      <p role="status" className="sr-only">{falado}</p>
      {estado === "procurando" && (
        <p aria-hidden="true" className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
          <Loader2Icon className="size-4 shrink-0 animate-spin" />
          {/* o termo vem de quem digitou: entra como texto */}
          Procurando &quot;{termo}&quot;…
        </p>
      )}
      {estado === "nada" && (
        <p id={idMsg} role="alert" className="mt-1 flex items-start gap-2 text-small text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Nenhum item com esse nome. Confira se está em inglês, como no jogo.
        </p>
      )}
      {estado === "offline" && (
        <p id={idMsg} role="alert" className="mt-1 flex items-start gap-2 text-small text-destructive">
          <WifiOffIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Não deu para buscar agora. Confira sua internet e tente de novo.
        </p>
      )}
      <div role="status">
        {escolhido && estado === "ocioso" && (
          <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
            <IconePremio premio={escolhido} tipo="item" tamanho="mini" />
            <span className="min-w-0 truncate">
              <b className="font-semibold text-foreground">{escolhido.nome}</b> · {escolhido.descricao}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
