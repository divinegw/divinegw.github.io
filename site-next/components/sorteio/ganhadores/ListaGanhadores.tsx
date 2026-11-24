"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, RotateCcwIcon, TrophyIcon, WifiOffIcon } from "lucide-react"

import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Vazio } from "@/components/divine/Vazio"
import { Recibo, nomeDoRegistro, textoConferencia } from "@/components/sorteio/ganhadores/Recibo"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DadosGanhadores } from "@/lib/dados"
import type { Registro } from "@/lib/dados/firebase"
import { dataCurta, pessoas } from "@/lib/sorteio/exibir"

// Os mesmos 30 de hoje. "Ver mais" mostra de 10 em 10 e, no fim, busca até 50, o máximo que as regras do banco deixam listar.
const INICIAL = 30
const MAXIMO = 50
const PAGINA = 10

type Estado = { fase: "carregando" } | { fase: "erro" } | { fase: "ok"; itens: Registro[]; limite: number }

/** Até 3 nomes; passou disso, "e mais N" (a lista inteira está no recibo). */
function Quem({ nomes }: { nomes: string[] }) {
  const mostrar = nomes.slice(0, 3)
  const resto = nomes.length - mostrar.length
  return (
    <>
      {mostrar.map((n, i) => (
        <React.Fragment key={`${i}-${n}`}>
          {i > 0 && (i === mostrar.length - 1 && !resto ? " e " : ", ")}
          <b className="font-semibold"><NomeConta nome={n} /></b>
        </React.Fragment>
      ))}
      {resto > 0 && <> e mais {resto}</>}
    </>
  )
}

function Linha({ r, aberto, alternar, anunciar }: { r: Registro; aberto: boolean; alternar: () => void; anunciar: (t: string) => void }) {
  const [copiado, setCopiado] = React.useState(false)
  const premio = nomeDoRegistro(r)
  const quando = dataCurta(r.data)
  const painel = `gn-${r.id}`
  const varios = r.ganhadores.length > 1

  async function copiar() {
    const ok = await navigator.clipboard.writeText(r.codigo).then(() => true, () => false)
    anunciar(ok ? "Código copiado." : "Não deu para copiar. Selecione o código e copie à mão.")
    if (!ok) return
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <li className="min-w-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3 min-[560px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <IconePremio premio={r.premioInfo} tipo={r.premioInfo?.tipo ?? "texto"} />
        <div className="min-w-0">
          <p className="line-clamp-3 [overflow-wrap:anywhere]">
            <Quem nomes={r.ganhadores} /> {varios ? "ganharam" : "ganhou"} {premio}
          </p>
          <p className="mt-0.5 text-small text-muted-foreground [overflow-wrap:anywhere]">
            {r.titulo}
            {quando && <> · <span className="dado">{quando}</span></>}
            {r.total > 0 && <> · {pessoas(r.total, "participante", "participantes")}</>}
            <span className="min-[760px]:hidden"> · <span className="dado">{r.codigo}</span></span>
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2 min-[560px]:col-span-1">
          <span className="dado hidden text-small whitespace-nowrap text-muted-foreground min-[760px]:inline">{r.codigo}</span>
          <Button type="button" variant="ghost" size="icon" aria-label={`Copiar o código ${r.codigo}`} onClick={() => void copiar()}>
            {copiado ? <CheckIcon className="text-primary-text" /> : <CopyIcon />}
          </Button>
          <Button
            type="button"
            id={`${painel}-botao`}
            variant="secondary"
            size="sm"
            className="h-control"
            aria-expanded={aberto}
            aria-controls={painel}
            aria-label={`${aberto ? "Fechar os detalhes" : "Ver detalhes"} do sorteio de ${premio}${quando ? `, ${quando}` : ""}`}
            onClick={alternar}
          >
            {aberto ? "Fechar" : "Ver detalhes"}
          </Button>
        </div>
      </div>
      <div id={painel} hidden={!aberto} className="px-4 pb-4">
        {aberto && <Recibo r={r} nivel={3} aoConferir={(c) => anunciar(textoConferencia(r, c))} />}
      </div>
    </li>
  )
}

function Esqueleto() {
  return (
    <ul aria-hidden="true" className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0" />
          <span className="grid flex-1 gap-2">
            <Skeleton className="h-3.5 w-[60%]" />
            <Skeleton className="h-3 w-[35%]" />
          </span>
        </li>
      ))}
    </ul>
  )
}

// "Últimos ganhadores": carregando, vazio, não carregou e a lista, com "Ver mais".
export function ListaGanhadores({ dados, anunciar }: { dados: DadosGanhadores; anunciar: (texto: string) => void }) {
  const [estado, setEstado] = React.useState<Estado>({ fase: "carregando" })
  const [tentativa, setTentativa] = React.useState(0)
  const [visiveis, setVisiveis] = React.useState(PAGINA)
  const [abertos, setAbertos] = React.useState<Set<string>>(() => new Set())
  const [buscandoMais, setBuscandoMais] = React.useState(false)
  const focoEm = React.useRef<string | null>(null)
  const tituloLista = React.useRef<HTMLHeadingElement>(null)
  const maisPedido = React.useRef<AbortController | null>(null)
  const aviso = React.useRef(anunciar)
  React.useEffect(() => { aviso.current = anunciar }, [anunciar])

  React.useEffect(() => {
    const pedido = new AbortController()
    aviso.current("Carregando os ganhadores.")
    dados.lerRegistros(INICIAL, pedido.signal)
      .then((itens) => {
        if (pedido.signal.aborted) return
        setEstado({ fase: "ok", itens, limite: INICIAL })
        aviso.current(itens.length ? "Ganhadores carregados." : "Ainda ninguém ganhou um sorteio.")
      })
      .catch(() => {
        if (pedido.signal.aborted) return
        setEstado({ fase: "erro" })
        aviso.current("Não deu para carregar os ganhadores. Confira sua internet e tente de novo.")
      })
    return () => { pedido.abort(); maisPedido.current?.abort() }
  }, [dados, tentativa])

  // depois de "Ver mais", o foco vai para o primeiro item novo: o botão que clicou pode ter saído da tela
  React.useEffect(() => {
    if (!focoEm.current) return
    document.getElementById(`gn-${focoEm.current}-botao`)?.focus()
    focoEm.current = null
  }, [visiveis])

  const alternar = (id: string) => setAbertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  async function verMais() {
    if (estado.fase !== "ok" || buscandoMais) return
    let itens = estado.itens
    if (visiveis >= itens.length) {
      // tudo o que veio já está na tela: pede o máximo que o banco deixa
      maisPedido.current?.abort()
      const este = (maisPedido.current = new AbortController())
      setBuscandoMais(true)
      try {
        const novos = await dados.lerRegistros(MAXIMO, este.signal)
        if (este.signal.aborted) return
        itens = novos
        setEstado({ fase: "ok", itens, limite: MAXIMO })
      } catch {
        if (este.signal.aborted) return
        setBuscandoMais(false)
        anunciar("Não deu para carregar mais. Confira sua internet e tente de novo.")
        return
      }
      setBuscandoMais(false)
    }
    const proximo = itens[visiveis]
    setVisiveis(visiveis + PAGINA)
    if (proximo) {
      // só o foco no primeiro item novo: o leitor de tela lê o item
      focoEm.current = proximo.id
    } else {
      // nada novo: o botão some, então o foco vai para o título da lista
      tituloLista.current?.focus()
      anunciar("Não tem mais ganhadores.")
    }
  }

  const titulo = (
    <h2 ref={tituloLista} tabIndex={-1} id="gn-titulo" className="w-fit rounded-sm text-lead font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Últimos ganhadores</h2>
  )

  if (estado.fase === "carregando") {
    return (
      <section aria-labelledby="gn-titulo" aria-busy="true" className="grid max-w-[760px] gap-3">
        {titulo}
        <Esqueleto />
      </section>
    )
  }
  if (estado.fase === "erro") {
    return (
      <section aria-labelledby="gn-titulo" className="grid max-w-[760px] gap-3">
        {titulo}
        <FaixaAviso icone={<WifiOffIcon strokeWidth={1.75} />} titulo="Não deu para carregar os ganhadores.">
          Confira sua internet e tente de novo.
        </FaixaAviso>
        <Button type="button" variant="secondary" size="sm" className="h-control w-fit" onClick={() => { setEstado({ fase: "carregando" }); setBuscandoMais(false); setTentativa((n) => n + 1) }}>
          <RotateCcwIcon />
          Tentar de novo
        </Button>
      </section>
    )
  }
  if (!estado.itens.length) {
    return (
      <section aria-labelledby="gn-titulo" className="grid max-w-[760px] gap-3">
        {titulo}
        <Vazio icone={<TrophyIcon strokeWidth={1.75} />} titulo="Ainda ninguém ganhou um sorteio.">
          Quando o primeiro resultado sair, ele aparece aqui com o código para conferir.
        </Vazio>
      </section>
    )
  }

  const mostrados = estado.itens.slice(0, visiveis)
  const temMais = visiveis < estado.itens.length || (estado.itens.length >= estado.limite && estado.limite < MAXIMO)
  return (
    <section aria-labelledby="gn-titulo" className="grid max-w-[760px] gap-3">
      {titulo}
      <ul className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {mostrados.map((r) => (
          <Linha key={r.id} r={r} aberto={abertos.has(r.id)} alternar={() => alternar(r.id)} anunciar={anunciar} />
        ))}
      </ul>
      {temMais && (
        <Button type="button" variant="secondary" size="sm" className="h-control w-fit" carregando={buscandoMais} onClick={() => void verMais()}>
          Ver mais
        </Button>
      )}
    </section>
  )
}
