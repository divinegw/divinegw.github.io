"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { iniciais } from "@/lib/sorteio/painel"
import { cn } from "@/lib/utils"

export interface ItemPessoa {
  chave: string
  /** O texto simples: a busca e a bolinha de iniciais saem dele. Vem de fora: nunca vira HTML. */
  texto: string
  /** Como o nome aparece (por exemplo, com o ".1234" apagado). */
  nome: React.ReactNode
  voce?: boolean
  /** Entrou depois de a página abrir: aparece com um realce de 200 ms. */
  novo?: boolean
  /** Fica riscado (por exemplo, quem não é da guilda). */
  riscado?: boolean
  /** Destaque de vencedor. */
  vencedor?: boolean
  /** O que fica à direita da linha: etiqueta, botão... */
  fim?: React.ReactNode
}

const BUSCA_A_PARTIR_DE = 21
const NO_CELULAR = 8

// Lista de pessoas ao estilo da lista de membros do Discord: bolinha com iniciais, nome que quebra a linha (nunca corta),
// busca a partir de 21 nomes, rolagem dentro da coluna no computador e 8 nomes + "Ver todos" no celular.
// Cada linha é texto puro. A lista só é focável pelo teclado quando de fato rola.
export const ListaPessoas = React.memo(function ListaPessoas({
  itens,
  idTitulo,
  vazio,
  className,
}: {
  itens: ItemPessoa[]
  /** id do título da seção que nomeia a lista (aria-labelledby). */
  idTitulo: string
  /** O que aparece quando não há ninguém. */
  vazio?: React.ReactNode
  className?: string
}) {
  const [busca, setBusca] = React.useState("")
  const [todos, setTodos] = React.useState(false)
  const lista = React.useRef<HTMLUListElement>(null)
  const [rola, setRola] = React.useState(false)
  const [resultado, setResultado] = React.useState("")

  const termo = busca.trim().toLocaleLowerCase("pt-BR")
  const comBusca = itens.length >= BUSCA_A_PARTIR_DE
  const visiveis = React.useMemo(
    () => (comBusca && termo ? itens.filter((i) => i.texto.toLocaleLowerCase("pt-BR").includes(termo)) : itens),
    [itens, termo, comBusca]
  )

  React.useEffect(() => {
    const el = lista.current
    if (!el) return
    const mede = () => setRola(el.scrollHeight > el.clientHeight + 1)
    mede()
    const ro = new ResizeObserver(mede)
    ro.observe(el)
    return () => ro.disconnect()
  }, [visiveis.length])

  // quantos sobraram na busca, dito uma vez quando a pessoa para de digitar
  React.useEffect(() => {
    if (!termo) return
    const t = window.setTimeout(
      () => setResultado(visiveis.length ? `${visiveis.length} de ${itens.length}` : "Ninguém com esse nome."),
      500
    )
    return () => { window.clearTimeout(t); setResultado("") }
  }, [termo, visiveis.length, itens.length])

  if (!itens.length) return <div className={className}>{vazio}</div>

  const mostraTudo = todos || Boolean(termo)
  return (
    <div className={cn("grid min-w-0 gap-3", className)}>
      {comBusca && (
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar nome"
            aria-label="Procurar nome"
            autoComplete="off"
            className="pl-9"
          />
        </label>
      )}
      <p role="status" className="sr-only">{resultado}</p>
      <ul
        ref={lista}
        role="list"
        data-todos={mostraTudo}
        {...(rola ? { tabIndex: 0, "aria-labelledby": idTitulo } : {})}
        className={cn(
          "grid content-start gap-1 min-[900px]:max-h-[21rem] min-[900px]:overflow-y-auto min-[900px]:overscroll-contain",
          "max-[899px]:data-[todos=false]:[&>li:nth-child(n+9)]:hidden"
        )}
      >
        {visiveis.map((p) => (
          <li
            key={p.chave}
            className={cn(
              "flex min-h-control items-center gap-2.5 rounded-md px-2 py-1 text-small font-semibold",
              p.voce && "bg-primary-bg",
              p.novo && "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
            )}
          >
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-fill-1 text-caption font-bold text-muted-foreground"
            >
              {iniciais(p.texto)}
            </span>
            <span className={cn("min-w-0 flex-1 leading-snug [overflow-wrap:anywhere]", p.riscado && "text-muted-foreground line-through")}>
              {p.nome}
              {p.voce && <small className="ml-1.5 text-caption font-semibold text-primary-text">Você</small>}
            </span>
            {p.fim}
          </li>
        ))}
      </ul>
      {itens.length > NO_CELULAR && !termo && (
        <button
          type="button"
          aria-expanded={todos}
          onClick={() => setTodos((v) => !v)}
          className="inline-flex min-h-control items-center justify-self-start rounded-md px-2 text-small font-semibold text-primary-text underline-offset-4 hover:underline min-[900px]:hidden"
        >
          {todos ? "Ver só os primeiros" : `Ver todos os ${itens.length.toLocaleString("pt-BR")}`}
        </button>
      )}
    </div>
  )
})
