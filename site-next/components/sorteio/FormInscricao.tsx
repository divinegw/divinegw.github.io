"use client"

import * as React from "react"
import { ChevronRightIcon, CoinsIcon, CopyIcon, GemIcon, GiftIcon, MapIcon, PackageIcon, RadioIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioChip, RadioGroup } from "@/components/ui/radio-group"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { BuscaItem, type EstadoBusca } from "@/components/sorteio/BuscaItem"
import {
  DURACOES, EXPANSOES_OPCOES, LIMITES, TIPOS_PREMIO, lerInteiro, msgFaixa, textoConvite,
} from "@/lib/sorteio/formulario"
import { buscarItem, premioSimples, textoPremio, type PremioInfo, type TipoPremio } from "@/lib/sorteio/premio"

type Erros = Partial<Record<"titulo" | "item" | "qtd" | "texto" | "vencedores", string>>
type Fase = "normal" | "abrindo" | "aberto" | "falha"

const ICONE_TIPO: Record<TipoPremio, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  item: PackageIcon, gemas: GemIcon, ouro: CoinsIcon, expansao: MapIcon, texto: GiftIcon,
}

const ANUNCIO: Partial<Record<Fase, string>> = {
  abrindo: "Abrindo o sorteio.",
  aberto: "Sorteio aberto. O link foi copiado.",
  falha: "Não deu para abrir o sorteio.",
}

// Linha do interruptor: o rótulo inteiro é o alvo (44 px de altura) e a ajuda fica ligada ao interruptor.
function LinhaInterruptor({ id, rotulo, ajuda, marcado, aoMudar }: { id: string; rotulo: string; ajuda: string; marcado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <Switch id={id} name={id} checked={marcado} onCheckedChange={aoMudar} aria-describedby={`${id}-ajuda`} className="mt-[9px]" />
      <div className="grid min-w-0 gap-0.5">
        <Label htmlFor={id} className="min-h-control items-center py-1 font-semibold">{rotulo}</Label>
        <p id={`${id}-ajuda`} className="-mt-2 text-small text-muted-foreground">{ajuda}</p>
      </div>
    </div>
  )
}

// A aba "Com inscrição": abre um sorteio que as pessoas entram pelo link. Campos, limites e textos de erro são os do site de hoje.
export function FormInscricao({ aoCriar }: { aoCriar?: () => void }) {
  const [titulo, setTitulo] = React.useState("")
  const [tipo, setTipo] = React.useState<TipoPremio>("item")
  const [itemTexto, setItemTexto] = React.useState("")
  const [item, setItem] = React.useState<PremioInfo | null>(null)
  const [estadoBusca, setEstadoBusca] = React.useState<EstadoBusca>("ocioso")
  const [qtdItem, setQtdItem] = React.useState("1")
  const [qtdGemas, setQtdGemas] = React.useState("")
  const [qtdOuro, setQtdOuro] = React.useState("")
  const [expansao, setExpansao] = React.useState(EXPANSOES_OPCOES[0].valor)
  const [textoLivre, setTextoLivre] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [vencedores, setVencedores] = React.useState("1")
  const [duracao, setDuracao] = React.useState("15")
  const [aceite, setAceite] = React.useState(true)
  const [google, setGoogle] = React.useState(false)

  const [erros, setErros] = React.useState<Erros>({})
  const [fase, setFase] = React.useState<Fase>("normal")
  const [anuncio, setAnuncio] = React.useState("")
  const [criado, setCriado] = React.useState<{ id: string; link: string; copiou: boolean } | null>(null)
  const [copiouLink, setCopiouLink] = React.useState(false)
  const [pedidoFoco, setPedidoFoco] = React.useState(0)
  const form = React.useRef<HTMLFormElement>(null)
  const temporizador = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // leva o foco ao primeiro campo com erro, depois que o erro já foi desenhado
  React.useEffect(() => {
    if (pedidoFoco) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedidoFoco])

  // limpa e preenche, para o leitor de tela ler de novo mesmo se o texto for igual ao anterior
  function anunciar(texto: string) {
    window.clearTimeout(temporizador.current)
    setAnuncio("")
    if (texto) temporizador.current = window.setTimeout(() => setAnuncio(texto), 60)
  }
  function falhou(novos: Erros) {
    setErros(novos)
    setFase("normal")
    anunciar("Há campos para corrigir.")
    setPedidoFoco((n) => n + 1)
  }
  const limpa = (campo: keyof Erros) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))

  function validar(): Erros {
    const e: Erros = {}
    if (!titulo.trim()) e.titulo = "Dê um nome ao sorteio."
    if (tipo === "item") {
      if (!item && !itemTexto.trim()) e.item = "Procure o item e escolha um da lista."
      if (!lerInteiro(qtdItem, LIMITES.qtdItem).ok) e.qtd = msgFaixa(LIMITES.qtdItem)
    } else if (tipo === "gemas" || tipo === "ouro") {
      const [txt, max, falta] = tipo === "gemas"
        ? [qtdGemas, LIMITES.gemas, "Diga quantas gemas vai sortear."] as const
        : [qtdOuro, LIMITES.ouro, "Diga quanto ouro vai sortear."] as const
      const r = lerInteiro(txt, max)
      if (!r.ok) e.qtd = r.motivo === "vazio" ? falta : msgFaixa(max)
    } else if (tipo === "texto" && !textoLivre.trim()) {
      e.texto = "Escreva qual é o prêmio."
    }
    if (!lerInteiro(vencedores, LIMITES.vencedores).ok) e.vencedores = msgFaixa(LIMITES.vencedores)
    return e
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (fase === "abrindo") return
    const novos = validar()
    if (Object.keys(novos).length) return falhou(novos)
    setErros({})
    setFase("abrindo")
    anunciar(ANUNCIO.abrindo!)

    // o prêmio, já no formato que o banco guarda
    let premio: PremioInfo
    if (tipo === "item") {
      const qtd = (lerInteiro(qtdItem, LIMITES.qtdItem) as { valor: number }).valor
      let achado = item
      if (!achado) {
        try { achado = await buscarItem(itemTexto) }
        catch (err) {
          // "Não achei..." = o nome não existe; qualquer outra falha = a wiki ou a internet
          const naoAchou = err instanceof Error && err.message.startsWith("Não achei")
          return falhou({ item: naoAchou ? "Escolha um item da lista." : "Não deu para buscar agora. Confira sua internet e tente de novo." })
        }
        setItem(achado)
        setItemTexto(achado.nome)
      }
      premio = { ...achado, quantidade: qtd }
    } else if (tipo === "gemas") premio = premioSimples("gemas", "", (lerInteiro(qtdGemas, LIMITES.gemas) as { valor: number }).valor)
    else if (tipo === "ouro") premio = premioSimples("ouro", "", (lerInteiro(qtdOuro, LIMITES.ouro) as { valor: number }).valor)
    else if (tipo === "expansao") premio = premioSimples("expansao", expansao, 1)
    else premio = premioSimples("texto", textoLivre.trim(), 1)

    try {
      // o SDK do Firebase só é baixado aqui, na hora de abrir o sorteio
      const { criarSorteio, linkDe } = await import("@/lib/dados/firebase")
      const { id } = await criarSorteio({
        titulo: titulo.trim(), descricao: descricao.trim(),
        vencedores: (lerInteiro(vencedores, LIMITES.vencedores) as { valor: number }).valor,
        duracaoMin: Number(duracao), premio: textoPremio(premio), premioInfo: premio, google, aceite,
      })
      const link = linkDe(id, window.location.origin)
      const copiou = await navigator.clipboard.writeText(textoConvite(titulo.trim(), premio, link)).then(() => true, () => false)
      setCriado({ id, link, copiou })
      setFase("aberto")
      aoCriar?.()
      anunciar(copiou ? ANUNCIO.aberto! : "Sorteio aberto. Copie o link.")
    } catch (err) {
      console.warn("sorteio: não abriu", err)
      setFase("falha")
      anunciar(ANUNCIO.falha!)
    }
  }

  async function copiarLink() {
    if (!criado) return
    const ok = await navigator.clipboard.writeText(criado.link).then(() => true, () => false)
    setCopiouLink(ok)
    if (ok) anunciar("Link copiado.")
  }

  const buscaComErro = estadoBusca === "nada" || estadoBusca === "offline"
  const trava = fase === "abrindo"

  return (
    <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
      <p role="status" className="sr-only">{anuncio}</p>

      <Campo rotulo="Nome do sorteio" erro={erros.titulo}>
        <Input
          name="titulo"
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); limpa("titulo") }}
          maxLength={LIMITES.titulo}
          placeholder="Sorteio da live de sexta"
          autoComplete="off"
        />
      </Campo>

      <div className="grid min-w-0 gap-3">
        <p id="premio-leg" className="mb-2 text-small font-medium">Prêmio</p>
        <RadioGroup
          aria-labelledby="premio-leg"
          name="tipo"
          value={tipo}
          onValueChange={(v) => {
            setTipo(v as TipoPremio)
            // a busca some com o campo: sem isto o erro dela ficaria escondido ao voltar para "Item do jogo"
            setEstadoBusca("ocioso")
            setErros((e) => ({ ...e, item: undefined, qtd: undefined, texto: undefined }))
          }}
        >
          {TIPOS_PREMIO.map(({ valor, rotulo }) => {
            const Icone = ICONE_TIPO[valor]
            return (
              <RadioChip key={valor} value={valor}>
                <Icone className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {rotulo}
              </RadioChip>
            )
          })}
        </RadioGroup>

        {tipo === "item" && (
          <div className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
            <Campo rotulo="Nome do item, em inglês" erro={buscaComErro ? undefined : erros.item}>
              <BuscaItem
                texto={itemTexto}
                onTexto={(t) => { setItemTexto(t); limpa("item") }}
                escolhido={item}
                onEscolher={setItem}
                onEstado={setEstadoBusca}
                maxLength={LIMITES.titulo}
                name="item"
              />
            </Campo>
            <div className="min-[900px]:w-44">
              <Campo rotulo="Quantidade" ajuda={erros.qtd ? undefined : `De 1 a ${LIMITES.qtdItem}.`} erro={erros.qtd}>
                <Input
                  name="quantidade" type="number" inputMode="numeric" min={1} max={LIMITES.qtdItem} className="dado"
                  value={qtdItem} onChange={(e) => { setQtdItem(e.target.value); limpa("qtd") }}
                />
              </Campo>
            </div>
          </div>
        )}
        {tipo === "gemas" && (
          <div className="max-w-44">
            <Campo rotulo="Quantas gemas" erro={erros.qtd}>
              <Input
                name="gemas" type="number" inputMode="numeric" min={1} max={LIMITES.gemas} step={1} placeholder="400" className="dado"
                value={qtdGemas} onChange={(e) => { setQtdGemas(e.target.value); limpa("qtd") }}
              />
            </Campo>
          </div>
        )}
        {tipo === "ouro" && (
          <div className="max-w-44">
            <Campo rotulo="Quanto ouro" erro={erros.qtd}>
              <Input
                name="ouro" type="number" inputMode="numeric" min={1} max={LIMITES.ouro} step={1} placeholder="100" className="dado"
                value={qtdOuro} onChange={(e) => { setQtdOuro(e.target.value); limpa("qtd") }}
              />
            </Campo>
          </div>
        )}
        {tipo === "expansao" && (
          <Campo rotulo="Qual expansão">
            <Select name="expansao" value={expansao} onChange={(e) => setExpansao(e.target.value)}>
              {EXPANSOES_OPCOES.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </Select>
          </Campo>
        )}
        {tipo === "texto" && (
          <Campo rotulo="Qual é o prêmio" erro={erros.texto}>
            <Input
              name="premio-texto" value={textoLivre} onChange={(e) => { setTextoLivre(e.target.value); limpa("texto") }}
              maxLength={LIMITES.textoPremio} autoComplete="off" placeholder="Lendária Gen 1 à escolha de quem ganhar"
            />
          </Campo>
        )}
      </div>

      <Campo rotulo="Sobre o prêmio (opcional)" ajuda={`Até ${LIMITES.descricao} letras. O card mostra as 3 primeiras linhas e a página mostra tudo.`}>
        <Textarea
          name="descricao" rows={2} maxLength={LIMITES.descricao} value={descricao} onChange={(e) => setDescricao(e.target.value)}
          placeholder="Em poucas palavras: o que é e por que vale a pena."
        />
      </Campo>

      <div className="grid items-start gap-4 grid-cols-[8rem_minmax(0,1fr)] min-[900px]:grid-cols-[11rem_minmax(0,1fr)]">
        <Campo rotulo="Vencedores" ajuda={erros.vencedores ? undefined : `De 1 a ${LIMITES.vencedores}.`} erro={erros.vencedores}>
          <Input
            name="vencedores" type="number" inputMode="numeric" min={1} max={LIMITES.vencedores} className="dado"
            value={vencedores} onChange={(e) => { setVencedores(e.target.value); limpa("vencedores") }}
          />
        </Campo>
        <Campo rotulo="Inscrições abertas por">
          <Select name="duracao" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
            {DURACOES.map((d) => <option key={d.min} value={d.min}>{d.rotulo}</option>)}
          </Select>
        </Campo>
      </div>

      <LinhaInterruptor
        id="aceite" rotulo="Pedir confirmação em 1 minuto" marcado={aceite} aoMudar={setAceite}
        ajuda="Se quem ganhou não confirmar a tempo, você sorteia outra pessoa."
      />
      <LinhaInterruptor
        id="google" rotulo="Exigir conta Google para se inscrever" marcado={google} aoMudar={setGoogle}
        ajuda="Vale uma inscrição por conta Google. Evita a mesma pessoa entrar duas vezes."
      />

      {fase === "aberto" && criado ? (
        <div className="grid gap-3">
          <FaixaAviso tom="ok" titulo={criado.copiou ? "Sorteio aberto. O link foi copiado." : "Sorteio aberto."}>
            {criado.copiou ? "Cole no Discord. As inscrições já estão valendo." : "Copie o link abaixo e cole no Discord. As inscrições já estão valendo."}
          </FaixaAviso>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-fill-1 p-3">
            <code className="dado min-w-0 flex-1 text-small break-all">{criado.link}</code>
            <Button type="button" variant="secondary" size="sm" className="h-control" onClick={copiarLink}>
              <CopyIcon />
              {copiouLink ? "Link copiado" : "Copiar link"}
            </Button>
          </div>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <a href={`/sorteio.html?s=${encodeURIComponent(criado.id)}`}>
              Ir para o painel do sorteio
              <ChevronRightIcon />
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {fase === "falha" && (
            <FaixaAviso titulo="Não deu para abrir o sorteio.">
              Confira sua internet e tente de novo. O que você preencheu continua aqui.
            </FaixaAviso>
          )}
          <Button type="submit" size="lg" className="w-full" carregando={trava} aria-disabled={trava || undefined}>
            <RadioIcon />
            {trava ? "Abrindo…" : "Abrir sorteio e copiar o link"}
          </Button>
        </div>
      )}
    </form>
  )
}
