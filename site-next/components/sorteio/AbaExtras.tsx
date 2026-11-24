"use client"

import * as React from "react"
import { CircleAlertIcon, CoinsIcon, DicesIcon, SwordsIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { Vazio } from "@/components/divine/Vazio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ConferirAntigo } from "@/components/sorteio/ConferirAntigo"
import { Opcao } from "@/components/sorteio/Opcao"
import { ResultadoCard, mostrarCard } from "@/components/sorteio/ResultadoCard"
import { useAnuncio } from "@/components/sorteio/useAnuncio"
import type { GrupoConteudo } from "@/lib/sorteio/conteudo"
import { salvarNoHistorico } from "@/lib/sorteio/historico"
import {
  itensDe, sortearConteudo, sortearDados, sortearMoeda, validarConteudo, validarDados, validarMoeda,
  type SaidaConteudo, type SaidaDados, type SaidaMoeda,
} from "@/lib/sorteio/local"

const LADOS = [4, 6, 8, 10, 12, 20, 100]
const falha = (botao: string) => `Não consegui sortear agora. Aperte ${botao} de novo.`
const MSG_GRUPO = "Marque pelo menos um tipo, como Fractals ou Dungeons."
const MSG_MOD = "Em Somar ao total, use um inteiro de -1.000.000 a 1.000.000."
const numero = (n: number) => n.toLocaleString("pt-BR")

// O foco depois do clique: vai ao primeiro campo com erro, ou ao título do resultado, já desenhados.
function useFoco(form: React.RefObject<HTMLFormElement | null>) {
  const [pedidoFoco, setPedidoFoco] = React.useState(0)
  const [pedidoTitulo, setPedidoTitulo] = React.useState(0)
  const titulo = React.useRef<HTMLHeadingElement>(null)
  React.useEffect(() => {
    if (pedidoFoco) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedidoFoco, form])
  React.useEffect(() => {
    if (!pedidoTitulo) return
    titulo.current?.focus({ preventScroll: true })
    mostrarCard(titulo.current)
  }, [pedidoTitulo])
  return {
    titulo,
    focarErro: React.useCallback(() => setPedidoFoco((n) => n + 1), []),
    focarTitulo: React.useCallback(() => setPedidoTitulo((n) => n + 1), []),
  }
}

// Cada bloco é um quadro com o próprio título; a largura dele (e não a da tela) decide quantos campos ficam lado a lado.
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const id = React.useId()
  return (
    <section aria-labelledby={id} className="@container grid min-w-0 content-start gap-4 rounded-lg border border-border p-4">
      <h3 id={id} className="text-body font-semibold">{titulo}</h3>
      {children}
    </section>
  )
}

// A aba "Extras": três sorteios pequenos, cada um com o seu formulário, o seu "Conferir um sorteio antigo" e o seu resultado.
// `grupos` é o conteúdo do jogo, lido dos guias na build (lib/sorteio/conteudo.ts).
export function AbaExtras({ grupos }: { grupos: GrupoConteudo[] }) {
  return (
    <div className="@container grid gap-5">
      <BlocoConteudo grupos={grupos} />
      <div className="grid items-start gap-5 @min-[44rem]:grid-cols-2">
        <BlocoDados />
        <BlocoMoeda />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- O que jogar
type ErrosConteudo = Partial<Record<"grupo" | "qtd", string>>

function BlocoConteudo({ grupos }: { grupos: GrupoConteudo[] }) {
  const [ids, setIds] = React.useState<string[]>(() => (grupos[0] ? [grupos[0].id] : []))
  const [qtd, setQtd] = React.useState("1")
  const [codigo, setCodigo] = React.useState("")
  const [erros, setErros] = React.useState<ErrosConteudo>({})
  const [resultado, setResultado] = React.useState<SaidaConteudo | null>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const form = React.useRef<HTMLFormElement>(null)
  const { titulo, focarErro, focarTitulo } = useFoco(form)
  const { anunciar, regiao } = useAnuncio()

  const limpa = (campo: keyof ErrosConteudo) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))

  function marcar(id: string, marcado: boolean) {
    setIds((atual) => (marcado ? [...atual, id] : atual.filter((x) => x !== id)))
    limpa("grupo")
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const pool = itensDe(grupos, ids).length
    const v = validarConteudo(pool, ids.length, qtd)
    if (v.erro) {
      setErros({ [v.erro.campo]: v.erro.campo === "grupo" ? MSG_GRUPO : v.erro.texto })
      setResultado(null)
      focarErro()
      return
    }
    setErros({})
    setOcupado(true)
    try {
      const s = await sortearConteudo(grupos, ids, v.qtd, codigo)
      setResultado(s)
      salvarNoHistorico({ modo: "O que jogar", resumo: s.resumo, codigo: s.codigo })
      anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
      focarTitulo()
    } catch {
      setResultado(null)
      setErros({ qtd: falha("Sortear o que jogar") })
      focarErro()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Bloco titulo="O que jogar">
      {regiao}
      {grupos.length === 0 ? (
        <Vazio titulo="Ainda não há o que sortear aqui." />
      ) : (
        <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
          <fieldset className="grid min-w-0 gap-1">
            <legend className="mb-1 text-small font-medium">Sortear entre</legend>
            <div className="grid @min-[30rem]:grid-cols-2">
              {grupos.map((g, i) => (
                <Opcao
                  key={g.id}
                  name="grupo"
                  value={g.id}
                  rotulo={<>{g.nome} <span className="dado font-normal text-muted-foreground">({g.itens.length}<span className="sr-only"> opções</span>)</span></>}
                  checked={ids.includes(g.id)}
                  aria-invalid={i === 0 && erros.grupo ? true : undefined}
                  onChange={(e) => marcar(g.id, e.target.checked)}
                />
              ))}
            </div>
            {erros.grupo && (
              <p role="alert" className="flex items-start gap-1.5 text-small text-destructive">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {erros.grupo}
              </p>
            )}
          </fieldset>
          <div className="max-w-44">
            <Campo rotulo="Quantos" erro={erros.qtd}>
              <Input name="qtd" type="number" inputMode="numeric" min={1} className="dado" value={qtd} onChange={(e) => { setQtd(e.target.value); limpa("qtd") }} />
            </Campo>
          </div>
          <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
            <SwordsIcon />
            Sortear o que jogar
          </Button>
          <ConferirAntigo valor={codigo} aoMudar={setCodigo} bloco="de O que jogar" ajuda="Com o código e os mesmos tipos marcados, sai o mesmo resultado." />
        </form>
      )}
      {resultado && <ResultadoConteudo s={resultado} refTitulo={titulo} aoAnunciar={anunciar} />}
    </Bloco>
  )
}

const linkClasse = "inline-flex min-h-8 w-fit items-center rounded-sm text-small text-primary-text underline underline-offset-4 hover:text-foreground"

function ResultadoConteudo({ s, refTitulo, aoAnunciar }: { s: SaidaConteudo; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const um = s.saiu.length === 1
  return (
    <ResultadoCard titulo="Vamos jogar" nivel={4} refTitulo={refTitulo} codigo={s.codigo} discord={s.discord} conferido={s.conferindo} aoAnunciar={aoAnunciar}>
      {um ? (
        <div className="grid justify-items-start gap-1">
          <p className="text-title font-bold [overflow-wrap:anywhere]">{s.saiu[0].t}</p>
          <p className="text-small text-muted-foreground">{s.saiu[0].onde}</p>
          <a href={s.saiu[0].h} className={linkClasse}>Ver no guia<span className="sr-only">: {s.saiu[0].t}</span></a>
        </div>
      ) : (
        <ol className="grid gap-3">
          {s.saiu.map((x, i) => (
            <li key={i} className="flex gap-3">
              <span className="dado w-6 shrink-0 text-small font-bold text-primary-text">{i + 1}</span>
              <span className="grid min-w-0 justify-items-start gap-0.5">
                <strong className="font-semibold [overflow-wrap:anywhere]">{x.t}</strong>
                <span className="text-small text-muted-foreground">{x.onde}</span>
                <a href={x.h} className={linkClasse}>Ver no guia<span className="sr-only">: {x.t}</span></a>
              </span>
            </li>
          ))}
        </ol>
      )}
    </ResultadoCard>
  )
}

// ---------------------------------------------------------------- Dados
type ErrosDados = Partial<Record<"qtd" | "mod", string>>

function BlocoDados() {
  const [qtd, setQtd] = React.useState("1")
  const [lados, setLados] = React.useState("20")
  const [mod, setMod] = React.useState("0")
  const [codigo, setCodigo] = React.useState("")
  const [erros, setErros] = React.useState<ErrosDados>({})
  const [resultado, setResultado] = React.useState<SaidaDados | null>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const form = React.useRef<HTMLFormElement>(null)
  const { titulo, focarErro, focarTitulo } = useFoco(form)
  const { anunciar, regiao } = useAnuncio()

  const limpa = (campo: keyof ErrosDados) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const v = validarDados(qtd, lados, mod)
    if (v.erro) {
      setErros({ [v.erro.campo]: v.erro.campo === "mod" ? MSG_MOD : v.erro.texto })
      setResultado(null)
      focarErro()
      return
    }
    setErros({})
    setOcupado(true)
    try {
      const s = await sortearDados(v.qtd, v.lados, v.mod, codigo)
      setResultado(s)
      salvarNoHistorico({ modo: "Dados", resumo: s.resumo, codigo: s.codigo })
      anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
      focarTitulo()
    } catch {
      setResultado(null)
      setErros({ qtd: falha("Rolar os dados") })
      focarErro()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Bloco titulo="Dados">
      {regiao}
      <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
        <div className="grid grid-cols-2 items-start gap-4 @min-[26rem]:grid-cols-3">
          <Campo rotulo="Quantos dados" erro={erros.qtd}>
            <Input name="qtd" type="number" inputMode="numeric" min={1} max={100} className="dado" value={qtd} onChange={(e) => { setQtd(e.target.value); limpa("qtd") }} />
          </Campo>
          <Campo rotulo="Lados">
            <Select name="lados" className="dado" value={lados} onChange={(e) => setLados(e.target.value)}>
              {LADOS.map((l) => <option key={l} value={l}>d{l}</option>)}
            </Select>
          </Campo>
          <div className="col-span-2 @min-[26rem]:col-span-1">
            <Campo rotulo="Somar ao total" erro={erros.mod}>
              <Input name="mod" type="number" inputMode="numeric" className="dado" value={mod} onChange={(e) => { setMod(e.target.value); limpa("mod") }} />
            </Campo>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
          <DicesIcon />
          Rolar os dados
        </Button>
        <ConferirAntigo valor={codigo} aoMudar={setCodigo} bloco="de dados" ajuda="Com o código e os mesmos dados, sai o mesmo resultado." />
      </form>
      {resultado && <ResultadoDados s={resultado} refTitulo={titulo} aoAnunciar={anunciar} />}
    </Bloco>
  )
}

function ResultadoDados({ s, refTitulo, aoAnunciar }: { s: SaidaDados; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const soma = s.rol.reduce((a, b) => a + b, 0)
  return (
    <ResultadoCard titulo={s.nome} nivel={4} refTitulo={refTitulo} codigo={s.codigo} discord={s.discord} conferido={s.conferindo} aoAnunciar={aoAnunciar}>
      <div className="grid gap-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Cada dado">
          {s.rol.map((n, i) => {
            const maximo = n === s.lados
            return (
              <li
                key={i}
                className={`dado grid h-10 min-w-11 place-items-center rounded-md border bg-fill-1 px-2.5 text-body font-bold ${maximo ? "border-primary text-primary-text" : "border-border-hover"}`}
              >
                <span>
                  {n}
                  {maximo && <span className="sr-only"> (máximo)</span>}
                  {maximo && <span aria-hidden="true" className="ml-1.5 text-caption font-semibold">máx.</span>}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="rotulo text-muted-foreground">Total</span>
          <span className="dado text-display font-bold tracking-titulo [overflow-wrap:anywhere]">{s.total}</span>
        </p>
        {s.mod !== 0 && (
          <p className="text-small text-muted-foreground">
            Os dados somam {soma}, {s.mod > 0 ? "mais" : "menos"} {Math.abs(s.mod)}.
          </p>
        )}
      </div>
    </ResultadoCard>
  )
}

// ---------------------------------------------------------------- Cara ou coroa
function BlocoMoeda() {
  const [qtd, setQtd] = React.useState("1")
  const [codigo, setCodigo] = React.useState("")
  const [erro, setErro] = React.useState("")
  const [resultado, setResultado] = React.useState<SaidaMoeda | null>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const form = React.useRef<HTMLFormElement>(null)
  const { titulo, focarErro, focarTitulo } = useFoco(form)
  const { anunciar, regiao } = useAnuncio()

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const v = validarMoeda(qtd)
    if (v.erro) {
      setErro(v.erro.texto)
      setResultado(null)
      focarErro()
      return
    }
    setErro("")
    setOcupado(true)
    try {
      const s = await sortearMoeda(v.qtd, codigo)
      setResultado(s)
      salvarNoHistorico({ modo: "Cara ou coroa", resumo: s.resumo, codigo: s.codigo })
      anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
      focarTitulo()
    } catch {
      setResultado(null)
      setErro(falha("Jogar a moeda"))
      focarErro()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Bloco titulo="Cara ou coroa">
      {regiao}
      <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
        <div className="max-w-44">
          <Campo rotulo="Quantas vezes" erro={erro}>
            <Input name="qtd" type="number" inputMode="numeric" min={1} max={1000} className="dado" value={qtd} onChange={(e) => { setQtd(e.target.value); setErro("") }} />
          </Campo>
        </div>
        <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
          <CoinsIcon />
          Jogar a moeda
        </Button>
        <ConferirAntigo valor={codigo} aoMudar={setCodigo} bloco="de cara ou coroa" ajuda="Com o código e o mesmo número de jogadas, sai o mesmo resultado." />
      </form>
      {resultado && <ResultadoMoeda s={resultado} refTitulo={titulo} aoAnunciar={anunciar} />}
    </Bloco>
  )
}

function ResultadoMoeda({ s, refTitulo, aoAnunciar }: { s: SaidaMoeda; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const um = s.qtd === 1
  const coroas = s.qtd - s.caras
  return (
    <ResultadoCard titulo={um ? "Uma jogada" : `${numero(s.qtd)} jogadas`} nivel={4} refTitulo={refTitulo} codigo={s.codigo} discord={s.discord} conferido={s.conferindo} aoAnunciar={aoAnunciar}>
      {um ? (
        <p className="text-display font-bold tracking-titulo">{s.lados[0]}</p>
      ) : (
        <div className="grid gap-3">
          <p className="text-title font-bold">
            <span className="dado">{numero(s.caras)}</span> {s.caras === 1 ? "cara" : "caras"}, <span className="dado">{numero(coroas)}</span> {coroas === 1 ? "coroa" : "coroas"}
          </p>
          {s.qtd <= 60 && (
            <>
              <ol className="flex flex-wrap gap-1.5" aria-label="Ordem das jogadas">
                {s.lados.map((x, i) => (
                  <li key={i} className={`size-[22px] rounded-full ${x === "Cara" ? "bg-primary" : "border-2 border-border-field-hover"}`}>
                    <span className="sr-only">{x}</span>
                  </li>
                ))}
              </ol>
              <p className="flex items-center gap-1.5 text-small text-muted-foreground" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-primary" />cara
                <span className="ml-2 size-2.5 rounded-full border-2 border-border-field-hover" />coroa
              </p>
            </>
          )}
        </div>
      )}
    </ResultadoCard>
  )
}
