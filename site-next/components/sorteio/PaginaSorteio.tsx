"use client"

import * as React from "react"
import { ChevronRightIcon, RadioIcon } from "lucide-react"

import { Vazio } from "@/components/divine/Vazio"
import { Button } from "@/components/ui/button"
import { BlocoAbertos, semAbertos } from "@/components/sorteio/BlocoAbertos"
import { FacaSorteio } from "@/components/sorteio/FacaSorteio"
import { useAbertos } from "@/components/sorteio/useAbertos"
import { Painel } from "@/components/sorteio/painel/Painel"
import { Skeleton } from "@/components/ui/skeleton"
import { navegar, useAgora, useParametros, useUrlLida } from "@/components/sorteio/url"
import type { GrupoConteudo } from "@/lib/sorteio/conteudo"
import { cn } from "@/lib/utils"

// `pai`: a tela é filha do Início, então a trilha leva de volta a ele (DIVINE › Sorteio › esta tela).
function Topo({ titulo, frase, migalha, pai = false, refTitulo }: { titulo: string; frase: string; migalha: string; pai?: boolean; refTitulo?: React.Ref<HTMLHeadingElement> }) {
  const sep = <ChevronRightIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
  const linkClasse = "-my-3 inline-flex h-control items-center rounded-sm hover:text-foreground"
  return (
    <header className="mb-8 grid gap-2">
      <nav aria-label="Você está em" className="flex items-center gap-1 text-small text-muted-foreground">
        <a href="/" className={linkClasse}>DIVINE</a>
        {sep}
        {pai ? (
          <>
            <a
              href="/sorteio.html"
              className={linkClasse}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                e.preventDefault()
                navegar({ ver: null, s: null, aba: null })
                window.scrollTo({ top: 0 })
              }}
            >
              Sorteio
            </a>
            {sep}
          </>
        ) : null}
        <span aria-current="page">{migalha}</span>
      </nav>
      <h1 ref={refTitulo} tabIndex={-1} className="text-page font-bold tracking-titulo outline-none">{titulo}</h1>
      <p className="max-w-[60ch] text-lead text-muted-foreground">{frase}</p>
    </header>
  )
}

const FRASE_INICIO = "Participe dos sorteios ativos ou organize um novo."

// Início: abertos à esquerda (320 px; no celular, em cima) e o "Faça um sorteio" à direita.
// Sem nenhum aberto, o bloco some e o formulário fica sozinho, com até 640 px.
function Inicio({ refTitulo, conteudo }: { refTitulo: React.Ref<HTMLHeadingElement>; conteudo: GrupoConteudo[] }) {
  const { estado, recarregar } = useAbertos()
  const agora = useAgora()
  // enquanto a lista carrega, a coluna da esquerda fica reservada (esqueleto no computador); só uma resposta vazia dá a largura toda ao formulário
  const sozinho = semAbertos(estado, agora)
  return (
    <>
      <Topo titulo="Sorteio" frase={FRASE_INICIO} migalha="Sorteio" refTitulo={refTitulo} />
      <div className={cn("grid items-start gap-8", sozinho ? "max-w-[640px]" : "min-[900px]:grid-cols-[320px_minmax(0,1fr)]")}>
        {!sozinho && <BlocoAbertos estado={estado} recarregar={recarregar} />}
        <FacaSorteio conteudo={conteudo} />
      </div>
    </>
  )
}

// ?ver=abertos: a lista inteira.
function TodosAbertos({ refTitulo }: { refTitulo: React.Ref<HTMLHeadingElement> }) {
  const { estado, recarregar } = useAbertos()
  const agora = useAgora()
  return (
    <>
      <Topo titulo="Sorteios abertos" frase="Todos os sorteios com inscrição aberta agora. Toque num para entrar." migalha="Sorteios abertos" pai refTitulo={refTitulo} />
      {semAbertos(estado, agora) ? (
        <Vazio
          icone={<RadioIcon strokeWidth={1.75} />}
          titulo="Nenhum sorteio aberto agora."
          acao={
            <Button asChild variant="secondary" size="sm" className="h-control">
              <a href="/sorteio.html">Fazer um sorteio</a>
            </Button>
          }
        >
          Quando alguém da guilda abrir um, ele aparece aqui.
        </Vazio>
      ) : (
        <BlocoAbertos estado={estado} recarregar={recarregar} completo />
      )}
    </>
  )
}

// ?s=<id>: o link de inscrição e o painel do sorteio. Quem muda de sorteio recebe um painel novo (a `key`).
function TelaPainel({ id, refTitulo }: { id: string; refTitulo: React.Ref<HTMLHeadingElement> }) {
  return <Painel key={id} id={id} refTitulo={refTitulo} />
}

// Neutro: aparece só na primeira pintura, até a URL poder ser lida (a página gerada não sabe se é ?s=, ?ver= ou o Início).
function Carregando() {
  return (
    <div aria-hidden="true" className="grid gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-full max-w-[60ch]" />
    </div>
  )
}

export function PaginaSorteio({ conteudo }: { conteudo: GrupoConteudo[] }) {
  const lida = useUrlLida()
  const parametros = useParametros()
  const tela = parametros.get("s") ? "painel" : parametros.get("ver") === "abertos" ? "abertos" : "inicio"
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const anterior = React.useRef<string | null>(null)

  // título da aba do navegador; e, quando a tela troca pela URL (não na primeira pintura), o foco vai para o h1
  React.useEffect(() => {
    if (!lida) return
    document.title = tela === "abertos" ? "Sorteios abertos · DIVINE" : "Sorteio · DIVINE"
    if (anterior.current !== null && anterior.current !== tela) titulo.current?.focus({ preventScroll: true })
    anterior.current = tela
  }, [lida, tela])

  if (!lida) return <Carregando />
  if (tela === "painel") return <TelaPainel id={parametros.get("s") ?? ""} refTitulo={titulo} />
  if (tela === "abertos") return <TodosAbertos refTitulo={titulo} />
  return <Inicio refTitulo={titulo} conteudo={conteudo} />
}
