"use client"

import * as React from "react"
import { CopyIcon, Undo2Icon, UsersRoundIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AVISO_TEXTO, LIMITE_TEXTO, textoErrosDaLista } from "@/components/sorteio/AbaLista"
import { ConferirAntigo } from "@/components/sorteio/ConferirAntigo"
import { Detalhes } from "@/components/sorteio/Detalhes"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { Opcao } from "@/components/sorteio/Opcao"
import { ResultadoCard, mostrarCard } from "@/components/sorteio/ResultadoCard"
import { useAnuncio } from "@/components/sorteio/useAnuncio"
import { lerLista } from "@/lib/sorteio/contas"
import { salvarNoHistorico } from "@/lib/sorteio/historico"
import { sortearSquads, validarSquads, type SaidaSquads } from "@/lib/sorteio/local"

type Erros = Partial<Record<"lista" | "n", string>>
type Resultado = { s: SaidaSquads; porGrupos: boolean; n: number }

const LISTA_VAZIA = "A aba Lista de contas está vazia. Cole os nomes lá primeiro, ou direto aqui."

// A aba "Squads": divide a lista em grupos, com a função de cada um (depois do traço) espalhada entre eles.
// As contas e os limites são os do site de hoje (lib/sorteio/local.ts, sortearSquads); aqui só há tela.
export function AbaSquads({ lerListaDaAba }: { lerListaDaAba: () => string }) {
  const [texto, setTexto] = React.useState("")
  const [porGrupos, setPorGrupos] = React.useState(false)
  const [n, setN] = React.useState("5")
  const [soGw2, setSoGw2] = React.useState(true)
  const [equilibrar, setEquilibrar] = React.useState(true)
  const [codigo, setCodigo] = React.useState("")
  const [erros, setErros] = React.useState<Erros>({})
  const [falha, setFalha] = React.useState(false)
  const [copiada, setCopiada] = React.useState<{ n: number; semFuncao: boolean } | null>(null)
  const [anterior, setAnterior] = React.useState<{ texto: string; n: number } | null>(null)
  const [maisAberto, setMaisAberto] = React.useState(false)
  const [resultado, setResultado] = React.useState<Resultado | null>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const [pedidoFoco, setPedidoFoco] = React.useState(0)
  const [pedidoTitulo, setPedidoTitulo] = React.useState(0)
  const form = React.useRef<HTMLFormElement>(null)
  const area = React.useRef<HTMLTextAreaElement>(null)
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const { anunciar, regiao } = useAnuncio()

  React.useEffect(() => {
    if (pedidoFoco) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedidoFoco])
  React.useEffect(() => {
    if (!pedidoTitulo) return
    titulo.current?.focus({ preventScroll: true })
    mostrarCard(titulo.current)
  }, [pedidoTitulo])

  const limpa = (campo: keyof Erros) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))

  function falhou(novos: Erros, abreMais = false) {
    setErros(novos)
    setFalha(false)
    setResultado(null)
    if (abreMais) setMaisAberto(true)
    setPedidoFoco((x) => x + 1)
  }

  function mudaTexto(v: string) {
    if (v.length > LIMITE_TEXTO) { setErros((e) => ({ ...e, lista: AVISO_TEXTO })); return }
    setTexto(v)
    setCopiada(null)
    setAnterior(null)
    limpa("lista")
  }

  function usarListaDaAba() {
    const daAba = lerListaDaAba()
    if (!daAba.trim()) { setErros((e) => ({ ...e, lista: LISTA_VAZIA })); return }
    // Se já havia outro texto aqui, ele fica guardado para o "Desfazer".
    if (texto.trim() && texto !== daAba) {
      setAnterior({ texto, n: lerLista(texto, { soGw2, funcao: true }).validos.length })
    } else setAnterior(null)
    const lidos = lerLista(daAba, { soGw2, funcao: true }).validos
    setTexto(daAba)
    setCopiada({ n: lidos.length, semFuncao: !lidos.some((p) => p.funcao) })
    setErros((e) => ({ ...e, lista: undefined }))
    anunciar(`${lidos.length} ${lidos.length === 1 ? "conta copiada" : "contas copiadas"} da aba Lista de contas.`)
    area.current?.focus()
  }

  function desfazer() {
    if (!anterior) return
    setTexto(anterior.texto)
    setAnterior(null)
    setCopiada(null)
    anunciar("Lista de volta.")
    area.current?.focus()
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const l = lerLista(texto, { soGw2, funcao: true })
    if (l.erros.length) return falhou({ lista: textoErrosDaLista(l.erros) }, true)
    const v = validarSquads(l.validos.length, n, porGrupos)
    if (v.erro) return falhou({ [v.erro.campo]: v.erro.texto })
    setErros({})
    setFalha(false)
    setOcupado(true)
    try {
      const s = singular(await sortearSquads(l.validos, { n: v.n, porGrupos, equilibrar }, codigo))
      setResultado({ s, porGrupos, n: v.n })
      salvarNoHistorico({ modo: "Squads", resumo: s.resumo, codigo: s.codigo, impressao: s.impressao })
      anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
      setPedidoTitulo((x) => x + 1)
    } catch {
      setResultado(null)
      setFalha(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="grid gap-5">
      {regiao}
      <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
        <div className="grid gap-2">
          <Campo rotulo="Participantes" ajuda="A função vai depois do traço: Joana.1234 - Heal." erro={erros.lista}>
            <Textarea
              ref={area}
              name="lista"
              rows={7}
              className="dado max-h-80 min-h-40 overflow-auto text-small leading-relaxed"
              spellCheck={false}
              placeholder={"Joana.1234 - Heal\nCarlos.5678 - DPS\nMika.4321 - Quickness"}
              value={texto}
              onChange={(e) => mudaTexto(e.target.value)}
            />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-control" onClick={usarListaDaAba}>
              <CopyIcon />
              Usar a lista da aba Lista de contas
            </Button>
          </div>
          {copiada !== null && (
            <FaixaAviso tom="ok" titulo={`${copiada.n} ${copiada.n === 1 ? "conta copiada" : "contas copiadas"} da aba Lista de contas.`}>
              {copiada.semFuncao ? "Coloque a função depois do traço para espalhar Heal e boons." : null}
            </FaixaAviso>
          )}
          {anterior && (
            <div className="flex flex-wrap items-center gap-2">
              <FaixaAviso tom="ok" titulo="Lista trocada." className="min-w-0 flex-1">
                A lista de antes tinha {anterior.n} {anterior.n === 1 ? "conta" : "contas"}.
              </FaixaAviso>
              <Button type="button" variant="secondary" size="sm" className="h-control" onClick={desfazer}>
                <Undo2Icon />
                Desfazer
              </Button>
            </div>
          )}
        </div>

        <div className="grid items-start gap-4 min-[480px]:grid-cols-2">
          <Campo rotulo="Dividir por">
            <Select name="por" value={porGrupos ? "grupos" : "tamanho"} onChange={(e) => { setPorGrupos(e.target.value === "grupos"); limpa("n") }}>
              <option value="tamanho">Pessoas por grupo</option>
              <option value="grupos">Número de grupos</option>
            </Select>
          </Campo>
          <Campo
            rotulo={porGrupos ? "Grupos" : "Pessoas por grupo"}
            ajuda={porGrupos ? "Quantos grupos montar." : "5 para fractal, 10 para raid."}
            erro={erros.n}
          >
            <Input name="n" type="number" inputMode="numeric" min={1} className="dado" value={n} onChange={(e) => { setN(e.target.value); limpa("n") }} />
          </Campo>
        </div>

        <Detalhes resumo="Mais opções" open={maisAberto} onOpenChange={setMaisAberto}>
          <div className="grid">
            <Opcao name="soGw2" rotulo="Aceitar só contas do jogo (Nome.1234)" checked={soGw2} onChange={(e) => { setSoGw2(e.target.checked); limpa("lista") }} />
            <Opcao name="equilibrar" rotulo="Espalhar cada função entre os grupos" ajuda="Assim cada grupo fica com um Heal, se houver Heal para todos." checked={equilibrar} onChange={(e) => setEquilibrar(e.target.checked)} />
          </div>
        </Detalhes>

        {falha && <FaixaAviso role="alert" titulo="Não consegui sortear agora.">Aperte Montar os grupos de novo.</FaixaAviso>}
        <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
          <UsersRoundIcon />
          Montar os grupos
        </Button>
        <ConferirAntigo valor={codigo} aoMudar={setCodigo} bloco="de Squads" />
      </form>

      {resultado && <ResultadoSquads r={resultado} refTitulo={titulo} aoAnunciar={anunciar} />}
    </div>
  )
}

// "1 grupos" vira "1 grupo" só no texto que a pessoa lê, copia e guarda no histórico; quem cai em qual grupo não muda.
// (lib/sorteio/local.ts fica como está: testes/local.json guarda o texto antigo desses casos.)
function singular(s: SaidaSquads): SaidaSquads {
  if (s.qtdGrupos !== 1) return s
  return { ...s, discord: s.discord.replace(" · 1 grupos" + String.fromCharCode(10), " · 1 grupo" + String.fromCharCode(10)), resumo: s.resumo.replace(/ em 1 grupos$/, " em 1 grupo") }
}

function ResultadoSquads({ r, refTitulo, aoAnunciar }: { r: Resultado; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const { s, porGrupos, n } = r
  const tamanhos = s.grupos.map((g) => g.length)
  const menor = tamanhos.reduce((a, b) => Math.min(a, b), Infinity)
  const maior = tamanhos.reduce((a, b) => Math.max(a, b), 0)
  const fecha = menor === maior
  const titulo = fecha
    ? `${s.qtdGrupos} ${s.qtdGrupos === 1 ? "grupo" : "grupos"} de ${menor}`
    : `${s.qtdGrupos} ${s.qtdGrupos === 1 ? "grupo" : "grupos"}`
  return (
    <ResultadoCard titulo={titulo} refTitulo={refTitulo} codigo={s.codigo} impressao={s.impressao} discord={s.discord} conferido={s.conferindo} aoAnunciar={aoAnunciar}>
      <div className="grid gap-3">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13.75rem),1fr))] gap-3">
          {s.grupos.map((g, i) => <GrupoCard key={i} numero={i + 1} pessoas={g} />)}
        </div>
        {!fecha && (
          <p className="text-small text-muted-foreground">
            Com {s.ps.length} {s.ps.length === 1 ? "pessoa" : "pessoas"}, a divisão não fecha: uns grupos ficam com {menor}, outros com {maior}.
          </p>
        )}
        {!porGrupos && n > s.ps.length && (
          <p className="text-small text-muted-foreground">
            Você pediu {n} por grupo, mas são só {s.ps.length} pessoas: ficou 1 grupo.
          </p>
        )}
      </div>
    </ResultadoCard>
  )
}

function GrupoCard({ numero, pessoas }: { numero: number; pessoas: SaidaSquads["grupos"][number] }) {
  const id = React.useId()
  return (
    <div role="group" aria-labelledby={id} className="grid min-w-0 content-start gap-2 rounded-md border border-border bg-surface p-3">
      <h4 id={id} className="text-small font-bold text-primary-text">
        Grupo {numero} <span className="font-normal text-muted-foreground">({pessoas.length} {pessoas.length === 1 ? "pessoa" : "pessoas"})</span>
      </h4>
      <ul className="grid gap-1.5">
        {pessoas.map((p) => (
          <li key={p.chave} className="flex min-w-0 items-center gap-2 text-small">
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]"><NomeConta nome={p.nome} /></span>
            {p.funcao && <Badge className="h-auto max-w-[45%] whitespace-normal py-0.5 text-left [overflow-wrap:anywhere]">{p.funcao}</Badge>}
          </li>
        ))}
      </ul>
    </div>
  )
}
