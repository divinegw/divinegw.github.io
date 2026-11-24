"use client"

import * as React from "react"
import { ChevronRightIcon, FileTextIcon, TrashIcon, TrophyIcon, Undo2Icon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioChip, RadioGroup } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ConferirAntigo } from "@/components/sorteio/ConferirAntigo"
import { Detalhes } from "@/components/sorteio/Detalhes"
import { GuildaApi } from "@/components/sorteio/GuildaApi"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { Opcao } from "@/components/sorteio/Opcao"
import { ResultadoCard, mostrarCard } from "@/components/sorteio/ResultadoCard"
import { useAnuncio } from "@/components/sorteio/useAnuncio"
import { lerItens, lerLista, textoDeArquivo, type Leitura } from "@/lib/sorteio/contas"
import { salvarNoHistorico } from "@/lib/sorteio/historico"
import {
  sortearLista, sortearPremios, validarLista, validarPremios, type SaidaLista, type SaidaPremios,
} from "@/lib/sorteio/local"
import { Roleta, corCss, type CoresRoleta } from "@/lib/sorteio/roleta"

type Modo = "vencedores" | "premios"
type Revelar = "hora" | "um" | "roleta"
type Erros = Partial<Record<"lista" | "vencedores" | "reservas" | "premios", string>>
type Resultado =
  | { tipo: "lista"; s: SaidaLista; venc: number; ordem: boolean; peso: boolean; revelar: Revelar }
  | { tipo: "premios"; s: SaidaPremios }

// Arquivo aberto: só .txt ou .csv. O site de hoje não limita o tamanho; aqui 1 MB (uns 50 mil nomes) evita travar a aba.
const LIMITE_ARQUIVO = 1024 * 1024
// O texto todo da lista (colado + arquivo) também tem teto, para uma colada gigante não travar a aba.
export const LIMITE_TEXTO = 2 * 1024 * 1024
export const AVISO_TEXTO ="A lista ficou grande demais (passa de 2 MB). Tire parte dos nomes e tente de novo."
const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const quadro = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

// Cores da roleta, lidas dos tokens do site (fundos que se alternam e a tinta que lê sobre cada um).
const cv = (v: string) => corCss(`var(${v})`)
const coresSite = (): CoresRoleta => ({
  fundos: ["--fill-2", "--primary", "--border-hover", "--primary-hover"].map(cv),
  tintas: ["--foreground", "--primary-foreground", "--foreground", "--primary-foreground"].map(cv),
  linha: cv("--surface"),
  fonte: getComputedStyle(document.body).fontFamily,
})

// Mesmo texto do site de hoje para linhas que não são conta do jogo (sorteio.ts, errosDaLista).
export function textoErrosDaLista(erros: Leitura["erros"]) {
  const ex = erros.slice(0, 3).map((e) => `linha ${e.linha} ("${e.texto}")`).join(", ")
  return `${erros.length === 1 ? "Esta linha não parece" : `${erros.length} linhas não parecem`} conta do jogo: ${ex}${erros.length > 3 ? "…" : ""}. Corrija para o formato Nome.1234 ou desmarque "Aceitar só contas do jogo" em "Mais opções".`
}

function textoContagem(l: Leitura, peso: boolean) {
  const n = l.validos.length
  if (!n && !l.erros.length) return "Nenhum participante ainda."
  const partes: string[] = []
  if (n) partes.push(`${n} ${n === 1 ? "conta" : "contas"}${peso ? ` e ${l.validos.reduce((s, p) => s + p.bilhetes, 0)} bilhetes` : ""}.`)
  if (l.repetidos.length) partes.push(`${l.repetidos.length} ${l.repetidos.length === 1 ? "repetida virou uma" : "repetidas viraram uma"}.`)
  if (l.erros.length) {
    const k = l.erros.length
    const linhas = l.erros.slice(0, 3).map((e) => e.linha).join(", ")
    partes.push(`${k} ${k === 1 ? "linha não é conta do jogo" : "linhas não são contas do jogo"} (linha ${linhas}${k > 3 ? "…" : ""}). Corrija antes de sortear.`)
  }
  return partes.join(" ")
}

// A aba "Lista de contas": sortear vencedores (com reservas, bilhetes, ordem de todo mundo) ou distribuir prêmios.
// As contas e os limites são os do site de hoje (lib/sorteio/local.ts); aqui só há tela.
// `aoMudarTexto` entrega o texto da lista a quem precisa dele (a aba Squads tem o botão "Usar a lista da aba Lista de contas").
export function AbaLista({ aoMudarTexto }: { aoMudarTexto?: (texto: string) => void }) {
  const [modo, setModo] = React.useState<Modo>("vencedores")
  const [texto, setTexto] = React.useState("")
  const [contado, setContado] = React.useState("")
  const [soGw2, setSoGw2] = React.useState(true)
  const [peso, setPeso] = React.useState(false)
  const [ordem, setOrdem] = React.useState(false)
  const [revelar, setRevelar] = React.useState<Revelar>("hora")
  const [venc, setVenc] = React.useState("1")
  const [res, setRes] = React.useState("0")
  const [premiosTxt, setPremiosTxt] = React.useState("")
  const [repetir, setRepetir] = React.useState(false)
  const [codigo, setCodigo] = React.useState("")
  const [erros, setErros] = React.useState<Erros>({})
  const [erroArquivo, setErroArquivo] = React.useState("")
  const [apagada, setApagada] = React.useState<{ texto: string; n: number; titulo: string; corpo: string } | null>(null)
  const [maisAberto, setMaisAberto] = React.useState(false)
  const [revelando, setRevelando] = React.useState(false)
  const [resultado, setResultado] = React.useState<Resultado | null>(null)
  const [visiveis, setVisiveis] = React.useState(0)
  const [girando, setGirando] = React.useState(false)
  const [ocupado, setOcupado] = React.useState(false)
  const [pedidoFoco, setPedidoFoco] = React.useState(0)
  const [pedidoTitulo, setPedidoTitulo] = React.useState(0)
  const form = React.useRef<HTMLFormElement>(null)
  const area = React.useRef<HTMLTextAreaElement>(null)
  const arquivo = React.useRef<HTMLInputElement>(null)
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const rodada = React.useRef(0)
  const { anunciar, regiao } = useAnuncio()

  const pesoAtivo = modo === "vencedores" && peso
  // a contagem espera a pessoa parar de digitar (como no site de hoje); as opções mudam na hora
  React.useEffect(() => {
    const t = window.setTimeout(() => setContado(texto), 400)
    return () => window.clearTimeout(t)
  }, [texto])
  const leitura = React.useMemo(() => lerLista(contado, { soGw2, peso: pesoAtivo }), [contado, soGw2, pesoAtivo])

  React.useEffect(() => {
    if (pedidoFoco) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedidoFoco])
  React.useEffect(() => {
    if (!pedidoTitulo) return
    titulo.current?.focus({ preventScroll: true })
    mostrarCard(titulo.current)
  }, [pedidoTitulo])
  React.useEffect(() => () => { rodada.current++ }, [])
  React.useEffect(() => { aoMudarTexto?.(texto) }, [texto, aoMudarTexto])

  const limpa = (campo: keyof Erros) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))
  // Devolve false se o texto passa do limite (e fica como estava, com o aviso).
  const mudaTexto = (v: string) => {
    if (v.length > LIMITE_TEXTO) { setErroArquivo(AVISO_TEXTO); return false }
    setErroArquivo("")
    setTexto(v)
    setApagada(null)
    limpa("lista")
    return true
  }

  // O aviso de cada erro é o role="alert" do próprio campo; aqui só se leva o foco. Se o campo está em "Mais opções", o bloco abre antes.
  function falhou(novos: Erros, abreMais = false) {
    setErros(novos)
    setResultado(null)
    if (abreMais || novos.reservas) setMaisAberto(true)
    setPedidoFoco((n) => n + 1)
  }

  function trocaModo(v: string) {
    setModo(v as Modo)
    setErros({})
    setResultado(null)
    rodada.current++
    setGirando(false)
    setRevelando(false)
    setOcupado(false)
  }

  function trocarPelaGuilda(nomes: string[]) {
    const anterior = texto
    const novo = nomes.join("\n")
    if (!mudaTexto(novo)) return
    setContado(novo)
    if (anterior.trim()) {
      const n = lerLista(anterior, { soGw2, peso: pesoAtivo }).validos.length
      setApagada({ texto: anterior, n, titulo: "Lista trocada.", corpo: `A lista de antes tinha ${n} ${n === 1 ? "conta" : "contas"}.` })
    }
    anunciar("Lista trocada pelos membros da guilda.")
  }

  function limparLista() {
    if (!texto.trim()) return
    const n = lerLista(texto, { soGw2, peso: pesoAtivo }).validos.length
    setApagada({ texto, n, titulo: "Lista apagada.", corpo: `${n} ${n === 1 ? "conta saiu" : "contas saíram"}.` })
    setTexto("")
    setContado("")
    setErros({})
    anunciar(`Lista apagada. ${n} ${n === 1 ? "conta saiu" : "contas saíram"}.`)
    area.current?.focus()
  }

  function desfazer() {
    if (!apagada) return
    setErroArquivo("")
    setTexto(apagada.texto)
    setContado(apagada.texto)
    setApagada(null)
    anunciar("Lista de volta.")
    area.current?.focus()
  }

  async function abrirArquivo(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0]
    ev.target.value = ""
    if (!f) return
    setErroArquivo("")
    if (!/\.(txt|csv)$/i.test(f.name)) return setErroArquivo("Esse arquivo não serve. Abra um .txt ou um .csv.")
    if (f.size > LIMITE_ARQUIVO) return setErroArquivo("Esse arquivo é grande demais (passa de 1 MB). Abra um .txt ou .csv só com a lista de contas.")
    try {
      const novo = textoDeArquivo(f.name, await f.text())
      if (/ x\d+$/m.test(novo)) setPeso(true)
      const total = texto.trim() ? `${texto.trim()}\n${novo}` : novo
      if (total.length > LIMITE_TEXTO) return setErroArquivo(AVISO_TEXTO)
      setTexto(total)
      setContado(total)
      setApagada(null)
      limpa("lista")
      anunciar(`Arquivo ${f.name} aberto.`)
    } catch {
      setErroArquivo("Não deu para ler esse arquivo. Tente de novo.")
    }
  }

  // mostra os resultados aos poucos (um por um ou na roleta). Uma rodada nova ou sair da tela cancela a anterior.
  async function revelaAos(s: SaidaLista, r: Revelar, pesoUsado: boolean, minha: number) {
    const total = s.saiu.length
    if (r === "hora" || reduzido()) { setVisiveis(total); return }
    setVisiveis(0)
    if (r === "um") {
      for (let i = 1; i <= total; i++) {
        if (rodada.current !== minha) return
        setVisiveis(i)
        await espera(900)
      }
      return
    }
    // roleta: gira uma vez por nome, tirando quem já saiu
    setGirando(true)
    await quadro()
    await quadro()
    if (!canvas.current || rodada.current !== minha) return
    const roleta = new Roleta(canvas.current, coresSite)
    const resto = [...s.ps]
    for (let i = 0; i < total; i++) {
      if (rodada.current !== minha) return
      roleta.itens = resto.map((p) => ({ nome: p.nome, peso: pesoUsado ? p.bilhetes : 1 }))
      roleta.desenha()
      const idx = resto.indexOf(s.saiu[i])
      await roleta.gira(idx, (s.g.u32() % 1000) / 1000, i === 0 ? 4200 : total > 5 ? 1400 : 2600)
      if (rodada.current !== minha) return
      setVisiveis(i + 1)
      resto.splice(idx, 1)
      await espera(500)
    }
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const l = lerLista(texto, { soGw2, peso: pesoAtivo })
    if (l.erros.length) return falhou({ lista: textoErrosDaLista(l.erros) }, true)
    const minha = ++rodada.current
    setErros({})
    setGirando(false)
    setOcupado(true)
    try {
      if (modo === "vencedores") {
        const v = validarLista(l.validos.length, { venc, res, ordem })
        if (v.erro) { setOcupado(false); return falhou({ [v.erro.campo]: v.erro.texto }) }
        const s = await sortearLista(l.validos, { venc: v.venc, res: v.res, ordem, peso }, codigo)
        const imediato = revelar === "hora" || reduzido()
        setResultado({ tipo: "lista", s, venc: v.venc, ordem, peso, revelar })
        salvarNoHistorico({ modo: "Lista de contas", resumo: s.resumo, codigo: s.codigo, impressao: s.impressao })
        setVisiveis(imediato ? s.saiu.length : 0)
        if (imediato) {
          anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
          setPedidoTitulo((n) => n + 1)
        }
        if (!imediato) setRevelando(true)
        await revelaAos(s, revelar, peso, minha)
        if (!imediato && rodada.current === minha) {
          setRevelando(false)
          anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
          setPedidoTitulo((n) => n + 1)
        }
      } else {
        const premios = lerItens(premiosTxt)
        const e = validarPremios(premios, l.validos.length, repetir)
        if (e) { setOcupado(false); return falhou({ [e.campo]: e.texto }) }
        const s = await sortearPremios(l.validos, premios, repetir, codigo)
        setResultado({ tipo: "premios", s })
        salvarNoHistorico({ modo: "Prêmios", resumo: s.resumo, codigo: s.codigo, impressao: s.impressao })
        anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
        setPedidoTitulo((n) => n + 1)
      }
    } catch {
      setRevelando(false)
      setGirando(false)
      falhou({ lista: "Não consegui sortear agora. Aperte o botão de novo." })
    } finally {
      if (rodada.current === minha) setOcupado(false)
    }
  }

  // Encerra a revelação aos poucos e mostra tudo (quem não quer esperar a animação, WCAG 2.2.2)
  function mostrarTudo() {
    if (resultado?.tipo !== "lista") return
    rodada.current++
    setGirando(false)
    setRevelando(false)
    setOcupado(false)
    setVisiveis(resultado.s.saiu.length)
    anunciar(`Resultado: ${resultado.s.resumo}. Código ${resultado.s.codigo}.`)
    setPedidoTitulo((n) => n + 1)
  }

  const premios = modo === "premios"
  const contagem = textoContagem(leitura, pesoAtivo)
  const temErroDeLinha = leitura.erros.length > 0

  const soContasDoJogo = (
    <Opcao name="soGw2" rotulo="Aceitar só contas do jogo (Nome.1234)" checked={soGw2} onChange={(e) => { setSoGw2(e.target.checked); limpa("lista") }} />
  )

  return (
    <div className="grid gap-5">
      {regiao}
      <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
        <div className="grid min-w-0 gap-2">
          <p id="lista-modo" className="text-small font-medium">O que fazer com a lista</p>
          <RadioGroup aria-labelledby="lista-modo" name="modo" value={modo} onValueChange={trocaModo}>
            <RadioChip value="vencedores">Sortear vencedores</RadioChip>
            <RadioChip value="premios">Distribuir prêmios</RadioChip>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Campo rotulo="Participantes" ajuda={contagem} ajudaViva erro={erros.lista}>
            <Textarea
              ref={area}
              name="lista"
              rows={7}
              className="dado max-h-80 min-h-40 overflow-auto text-small leading-relaxed"
              spellCheck={false}
              placeholder={"Joana.1234\nCarlos.5678\nMika.4321"}
              value={texto}
              aria-invalid={temErroDeLinha || undefined}
              onChange={(e) => mudaTexto(e.target.value)}
            />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" className="h-control" onClick={() => arquivo.current?.click()}>
              <FileTextIcon />
              Abrir arquivo .txt ou .csv
            </Button>
            <input ref={arquivo} type="file" accept=".txt,.csv,text/plain,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={abrirArquivo} />
            <Button type="button" variant="ghost" size="sm" className="h-control" disabled={!texto.trim()} onClick={limparLista}>
              <TrashIcon />
              Limpar lista
            </Button>
          </div>
          {erroArquivo && (
            <p role="alert" className="text-small text-destructive">{erroArquivo}</p>
          )}
          {apagada && (
            <div className="flex flex-wrap items-center gap-2">
              <FaixaAviso tom="ok" titulo={apagada.titulo} className="min-w-0 flex-1">
                {apagada.corpo}
              </FaixaAviso>
              <Button type="button" variant="secondary" size="sm" className="h-control" onClick={desfazer}>
                <Undo2Icon />
                Desfazer
              </Button>
            </div>
          )}
        </div>

        <GuildaApi aoColocar={trocarPelaGuilda} />

        {premios ? (
          <>
            <Campo rotulo="Prêmios" ajuda="Um por linha. Mais de uma unidade: Gift of Battle x3." erro={erros.premios}>
              <Textarea
                name="premios"
                rows={4}
                className="dado max-h-64 min-h-28 overflow-auto text-small leading-relaxed"
                spellCheck={false}
                placeholder={"Legendary Insight x2\n100 gold\nMini Llama"}
                value={premiosTxt}
                onChange={(e) => { setPremiosTxt(e.target.value); limpa("premios") }}
              />
            </Campo>
            <Opcao name="repetir" rotulo="Uma pessoa pode levar mais de um prêmio" checked={repetir} onChange={(e) => { setRepetir(e.target.checked); limpa("premios") }} />
            <Detalhes resumo="Mais opções" open={maisAberto} onOpenChange={setMaisAberto}>{soContasDoJogo}</Detalhes>
          </>
        ) : (
          <>
            <div className="max-w-44">
              <Campo rotulo="Vencedores" erro={erros.vencedores}>
                <Input name="vencedores" type="number" inputMode="numeric" min={1} className="dado" value={venc} onChange={(e) => { setVenc(e.target.value); limpa("vencedores") }} />
              </Campo>
            </div>
            <Detalhes resumo="Mais opções" open={maisAberto} onOpenChange={setMaisAberto}>
              <div className="max-w-44">
                <Campo rotulo="Reservas" ajuda="Entram no lugar de quem não aparecer, na ordem." erro={erros.reservas}>
                  <Input name="reservas" type="number" inputMode="numeric" min={0} className="dado" value={res} onChange={(e) => { setRes(e.target.value); limpa("reservas") }} />
                </Campo>
              </div>
              <div className="grid">
                <Opcao name="peso" rotulo="Usar bilhetes" ajuda="Mais bilhetes, mais chance: Joana.1234 x3" checked={peso} onChange={(e) => { setPeso(e.target.checked); limpa("lista") }} />
                <Opcao name="ordem" rotulo="Sortear a ordem de todo mundo, do 1º ao último" checked={ordem} onChange={(e) => { setOrdem(e.target.checked); limpa("vencedores"); limpa("reservas") }} />
              </div>
              <div className="grid min-w-0 gap-2">
                <p id="lista-mostrar" className="text-small font-medium">Como mostrar o resultado</p>
                <RadioGroup aria-labelledby="lista-mostrar" name="revelar" value={revelar} onValueChange={(v) => setRevelar(v as Revelar)}>
                  <RadioChip value="hora">Tudo de uma vez</RadioChip>
                  <RadioChip value="um">Um por um</RadioChip>
                  <RadioChip value="roleta">Na roleta</RadioChip>
                </RadioGroup>
              </div>
              {soContasDoJogo}
            </Detalhes>
          </>
        )}

        <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
          <TrophyIcon />
          {premios ? "Distribuir os prêmios" : "Sortear da lista"}
        </Button>
        <ConferirAntigo valor={codigo} aoMudar={setCodigo} />
      </form>

      {revelando && resultado?.tipo === "lista" && (
        <Button type="button" variant="secondary" className="w-full" onClick={mostrarTudo}>
          Mostrar tudo agora
        </Button>
      )}

      {girando && resultado?.tipo === "lista" && (
        <div className="relative mx-auto w-full max-w-[280px] pt-3" aria-hidden="true">
          <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 border-x-[10px] border-t-[16px] border-x-transparent border-t-primary" />
          <canvas ref={canvas} className="aspect-square w-full" />
        </div>
      )}

      {resultado && <VerResultado r={resultado} visiveis={visiveis} refTitulo={titulo} aoAnunciar={anunciar} />}
    </div>
  )
}

function VerResultado({ r, visiveis, refTitulo, aoAnunciar }: { r: Resultado; visiveis: number; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const [verTodos, setVerTodos] = React.useState(false)

  if (r.tipo === "premios") {
    const { s } = r
    return (
      <ResultadoCard titulo="Prêmios distribuídos" refTitulo={refTitulo} codigo={s.codigo} impressao={s.impressao} discord={s.discord} conferido={s.conferindo} aoAnunciar={aoAnunciar}>
        <ul className="grid gap-1.5">
          {s.premios.map((p, i) => (
            <li key={i} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="min-w-0 [overflow-wrap:anywhere]"><NomeConta nome={s.quem[i].nome} /></span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              <b className="min-w-0 font-semibold [overflow-wrap:anywhere]">{p}</b>
            </li>
          ))}
        </ul>
      </ResultadoCard>
    )
  }

  const { s, venc, ordem, peso } = r
  const mostradas = s.saiu.slice(0, visiveis)
  const venceram = ordem ? mostradas : mostradas.slice(0, venc)
  const reservas = ordem ? [] : mostradas.slice(venc)
  const lista = ordem && !verTodos ? venceram.slice(0, 10) : venceram
  const bilhetes = (n: number) => `${n} ${n === 1 ? "bilhete" : "bilhetes"}`
  return (
    <ResultadoCard
      titulo={ordem ? "Ordem de todo mundo" : `${venc} ${venc === 1 ? "vencedor" : "vencedores"}`}
      refTitulo={refTitulo}
      codigo={s.codigo}
      impressao={s.impressao}
      discord={s.discord}
      conferido={s.conferindo}
      aoAnunciar={aoAnunciar}
    >
      {ordem ? (
        <ol className="min-[480px]:columns-2 min-[480px]:gap-6 text-small">
          {lista.map((p, i) => (
            <li key={p.chave} className="flex gap-2 break-inside-avoid py-0.5">
              <span className="dado w-7 shrink-0 text-caption leading-5 text-primary-text">{i + 1}º</span>
              <span className="min-w-0 [overflow-wrap:anywhere]"><NomeConta nome={p.nome} />{peso && <span className="text-muted-foreground"> · {bilhetes(p.bilhetes)}</span>}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="grid gap-2">
          {venceram.map((p, i) => (
            <li key={p.chave} className="flex items-baseline gap-3 text-lead font-semibold">
              <span className="dado w-6 shrink-0 text-small font-bold text-primary-text">{i + 1}</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                <NomeConta nome={p.nome} />
                {peso && <span className="text-small font-normal text-muted-foreground"> · {bilhetes(p.bilhetes)}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {ordem && !verTodos && venceram.length > 10 && (
        <Button type="button" variant="secondary" size="sm" className="h-control w-fit" onClick={() => setVerTodos(true)}>
          Ver os {venceram.length}
        </Button>
      )}
      {reservas.length > 0 && (
        <p className="text-small text-muted-foreground">
          Reservas, na ordem:{" "}
          {reservas.map((p, i) => (
            <React.Fragment key={p.chave}>
              {i > 0 && ", "}
              <b className="font-semibold text-foreground [overflow-wrap:anywhere]"><NomeConta nome={p.nome} /></b>
            </React.Fragment>
          ))}
          .
        </p>
      )}
      <p className="text-small text-muted-foreground">{s.ps.length} participantes.</p>
    </ResultadoCard>
  )
}
