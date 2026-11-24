"use client"

import * as React from "react"
import { CheckIcon, ClockIcon, PencilIcon, TrophyIcon, UsersIcon, WifiOffIcon } from "lucide-react"

import { FaixaAviso } from "@/components/divine/FaixaAviso"
import { ListaPessoas, type ItemPessoa } from "@/components/divine/ListaPessoas"
import { Vazio } from "@/components/divine/Vazio"
import { NomeConta } from "@/components/sorteio/NomeConta"
import { GuildaApi } from "@/components/sorteio/GuildaApi"
import { BarraOrganizador } from "@/components/sorteio/painel/BarraOrganizador"
import { PrazoInscricoes, Premio, type EstadoSelo } from "@/components/sorteio/painel/Cabecalho"
import { Confirma } from "@/components/sorteio/painel/Confirma"
import { FaseConfirmacao } from "@/components/sorteio/painel/FaseConfirmacao"
import { FaseResultado } from "@/components/sorteio/painel/FaseResultado"
import { FaseSorteando } from "@/components/sorteio/painel/FaseSorteando"
import { NavSala } from "@/components/sorteio/painel/NavSala"
import { AreaConta } from "@/components/sorteio/painel/ParticipaForm"
import { Transparencia } from "@/components/sorteio/painel/Transparencia"
import { MSG, usePainel } from "@/components/sorteio/painel/usePainel"
import { useReduzirMovimento } from "@/components/sorteio/painel/useReduzirMovimento"
import { useAnuncio } from "@/components/sorteio/useAnuncio"
import { navegar, useParametros } from "@/components/sorteio/url"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ORIGEM_SITE } from "@/conteudo/site"
import { chaveDe } from "@/lib/sorteio/ao-vivo"
import { estadoDoAceite, formatarRelogio, textoConviteDiscord, textoResultado, type Fase } from "@/lib/sorteio/painel"

// Só estas chaves da URL passam para a camada falsa do desenvolvimento (ver lib/dados/falso.ts).
const CHAVES_FALSO = ["parado", "voce", "erro"]

// O painel do sorteio (?s=<id>): o mesmo card passa pelas inscrições, o sorteio, o resultado e a confirmação do prêmio, sem trocar
// de página. A coluna da esquerda muda de fase; a lista de participantes fica à direita (embaixo no celular).
export function Painel({ id, refTitulo }: { id: string; refTitulo: React.Ref<HTMLHeadingElement> }) {
  const parametros = useParametros()
  const cenario = parametros.get("falso")
  const papel = parametros.get("papel")
  const extras = React.useMemo(() => {
    const p = new URLSearchParams()
    for (const k of CHAVES_FALSO) { const v = parametros.get(k); if (v) p.set(k, v) }
    return p.toString()
  }, [parametros])
  const [tentativa, setTentativa] = React.useState(0)
  // outro sorteio, outro cenário ou "Tentar de novo": o painel começa do zero (sem estado velho)
  return (
    <PainelAberto
      key={`${id}|${cenario}|${papel}|${extras}|${tentativa}`}
      id={id}
      cenario={cenario}
      papel={papel}
      extras={extras}
      refTitulo={refTitulo}
      aoTentarDeNovo={() => setTentativa((n) => n + 1)}
    />
  )
}

function PainelAberto({ id, cenario, papel, extras, refTitulo, aoTentarDeNovo }: {
  id: string
  cenario: string | null
  papel: string | null
  extras: string
  refTitulo: React.Ref<HTMLHeadingElement>
  aoTentarDeNovo: () => void
}) {
  const { anunciar, regiao } = useAnuncio()
  const p = usePainel(id, cenario, papel, extras, anunciar)
  const reduzido = useReduzirMovimento()
  const { sorteio: s, inscritos, aceites, agora, organizador, minhaChave, minhaConta, tirado, aberto, dados } = p
  const r = s?.resultado ?? null

  // ---------------------------------------------------------------- a fase
  // O resultado novo gira a roleta na tela de todo mundo; quem chega depois (ou pediu menos movimento) vê direto o resultado.
  const [girando, setGirando] = React.useState<string | null>(null)
  // o último código já decidido; `undefined` = ainda não decidiu nada (a primeira leitura vale diferente das seguintes)
  const [decidido, setDecidido] = React.useState<string | null | undefined>(undefined)
  const codigo = r?.codigo ?? null
  const emMs = r?.em ? r.em.toMillis() : null
  const nInscritos = inscritos?.length ?? null
  if (s && nInscritos !== null && decidido !== codigo) {
    const primeiraLeitura = decidido === undefined
    const recente = !primeiraLeitura || (emMs ? agora - emMs < 90_000 : true)
    setDecidido(codigo)
    setGirando(codigo && recente && nInscritos > 1 && !reduzido ? codigo : null)
  }

  const fase: Fase = !r ? "inscricoes" : girando === r.codigo ? "sorteando" : r.prazo ? "confirmacao" : "resultado"
  const aceite = r?.prazo ? estadoDoAceite(r, aceites, agora) : null
  const euGanhei = Boolean(r && minhaChave && r.ganhadores.some((n) => chaveDe(n) === minhaChave))
  const jaConfirmei = Boolean(minhaChave && aceites.has(minhaChave))

  // ---------------------------------------------------------------- foco e avisos para o leitor de tela
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const faseAntes = React.useRef<Fase | null>(null)
  React.useEffect(() => {
    if (p.carga !== "pronto") return
    // quando a fase muda (não na primeira pintura), o foco vai para o título da fase nova
    if (faseAntes.current !== null && faseAntes.current !== fase) titulo.current?.focus({ preventScroll: true })
    faseAntes.current = fase
  }, [p.carga, fase])

  // quem acabou de entrar: o foco vai para a confirmação "Você está no sorteio como..."
  const antesConta = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!antesConta.current && minhaConta && p.carga === "pronto" && faseAntes.current === fase) {
      document.querySelector<HTMLElement>("[data-foco-painel]")?.focus({ preventScroll: true })
    }
    antesConta.current = minhaConta
  }, [minhaConta, p.carga, fase])

  const anterior = React.useRef<{ fase: Fase; codigo: string | null; aberto: boolean; aceite: string | null; ok: string[] } | null>(null)
  const okMask = aceite ? aceite.ganhadores.filter((g) => g.ok).map((g) => g.nome).join("|") : ""
  const avisarMudanca = React.useEffectEvent(() => {
    if (p.carga !== "pronto" || !s) return
    const agoraEstado = { fase, codigo, aberto, aceite: aceite?.fase ?? null, ok: okMask ? okMask.split("|") : [] }
    const antes = anterior.current
    anterior.current = agoraEstado
    if (!antes) return
    if (antes.fase !== fase) {
      if (fase === "sorteando") anunciar("Sorteando.")
      else if (r && (fase === "resultado" || fase === "confirmacao")) {
        if (fase === "resultado") {
          anunciar(euGanhei ? "Você ganhou." : r.ganhadores.length === 1 ? `${r.ganhadores[0]} ganhou.` : `${r.ganhadores.join(", ")} ganharam.`)
        } else {
          anunciar(euGanhei && !jaConfirmei ? "Você ganhou. Confirme que está aqui em 1 minuto." : r.ganhadores.length === 1 ? `${r.ganhadores[0]} ganhou. Esperando confirmar.` : "Esperando quem ganhou confirmar.")
        }
      }
      return
    }
    if (fase === "inscricoes" && antes.aberto !== aberto) {
      anunciar(aberto ? "As inscrições foram reabertas." : "As inscrições fecharam.")
      return
    }
    if (fase === "confirmacao" && aceite) {
      if (antes.codigo !== codigo) return anunciar("Quem não confirmou foi trocado. O minuto começou de novo.")
      const novos = aceite.ganhadores.filter((g) => g.ok && !antes.ok.includes(g.nome)).map((g) => g.nome)
      if (aceite.fase === "ok" && antes.aceite !== "ok") return anunciar(aceite.ganhadores.length === 1 ? `${aceite.ganhadores[0].nome} confirmou.` : "Todo mundo confirmou o prêmio.")
      if (novos.length) return anunciar(`${novos.join(", ")} confirmou.`)
      if (aceite.fase === "fim" && antes.aceite !== "fim") anunciar(organizador ? "O tempo acabou. Já dá para sortear outra pessoa." : "O tempo para confirmar acabou.")
    }
  })
  React.useEffect(() => { avisarMudanca() }, [fase, codigo, aberto, aceite?.fase, okMask, p.carga])

  // faltam 10 segundos: só para quem ganhou e ainda não confirmou
  const urgenteEu = Boolean(fase === "confirmacao" && aceite?.urgente && euGanhei && !jaConfirmei)
  React.useEffect(() => { if (urgenteEu) anunciar("Faltam 10 segundos para confirmar.") }, [urgenteEu, anunciar])

  // título da aba: quem ganhou vê o tempo, mesmo com a aba em segundo plano
  const tituloAba = !s ? null
    : fase === "confirmacao" && euGanhei && !jaConfirmei && aceite?.fase === "conta" ? `Você ganhou! Aceite em ${formatarRelogio(aceite.resta)}`
    : `${s.titulo} · DIVINE`
  React.useEffect(() => { if (tituloAba) document.title = tituloAba }, [tituloAba])

  // O que a lista de participantes mostra de quem ganhou. Durante a roleta nada aparece (spoiler), e a lista só se refaz
  // quando algo muda de verdade (outro resultado, alguém confirmou, a fase do aceite), não a cada tique do relógio.
  const fimAceite = fase === "sorteando" || !aceite ? null : aceite.fase
  const ganhadoresLista = React.useMemo(
    () => (fase === "sorteando" || !aceite ? null : aceite.ganhadores),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fase, fimAceite, okMask, codigo]
  )

  // ---------------------------------------------------------------- filtro da guilda, gerenciar a lista, diálogos
  const [membros, setMembros] = React.useState<Set<string> | null>(null)
  const [filtroAberto, setFiltroAberto] = React.useState(false)
  const [gerenciando, setGerenciando] = React.useState(false)
  const [tirando, setTirando] = React.useState<{ chave: string; conta: string } | null>(null)
  const botaoGerenciar = React.useRef<HTMLButtonElement>(null)
  const fora = React.useMemo(() => (membros && inscritos ? inscritos.filter((x) => !membros.has(x.chave)).map((x) => x.chave) : []), [membros, inscritos])
  const foraSet = React.useMemo(() => new Set(fora), [fora])
  const entram = (inscritos?.length ?? 0) - fora.length

  async function copiarLinkVazio() {
    if (!dados) return
    const ok = await navigator.clipboard.writeText(dados.linkDe(id, ORIGEM_SITE)).then(() => true, () => false)
    anunciar(ok ? "Link copiado." : "Não deu para copiar o link.")
  }

  // ---------------------------------------------------------------- a lista de participantes
  const novosRef = p.novos
  const itens = React.useMemo<ItemPessoa[]>(() => {
    if (!inscritos) return []
    const venc = new Map((ganhadoresLista ?? (r && (fase === "resultado" || fase === "confirmacao") ? r.ganhadores.map((n) => ({ nome: n, chave: chaveDe(n), ok: true })) : [])).map((g, i) => [g.chave, { g, i }]))
    const recentes = [...novosRef].reverse()
    const ordem = new Map(recentes.map((c, i) => [c, i]))
    const pesoDe = (chave: string) => (venc.has(chave) ? -1000 + venc.get(chave)!.i : chave === minhaChave && !organizador ? -500 : ordem.has(chave) ? -100 + ordem.get(chave)! : 0)
    const lista = [...inscritos].sort((a, b) => pesoDe(a.chave) - pesoDe(b.chave) || (a.chave < b.chave ? -1 : 1))
    return lista.map((x) => {
      const v = venc.get(x.chave)
      const riscado = foraSet.has(x.chave)
      let fim: React.ReactNode
      if (gerenciando && organizador && fase === "inscricoes") {
        fim = (
          <Button type="button" variant="ghost" size="sm" className="h-control" aria-label={`Tirar ${x.conta} do sorteio`} onClick={() => setTirando({ chave: x.chave, conta: x.conta })}>
            Tirar
          </Button>
        )
      } else if (v) {
        fim = !ganhadoresLista ? <Badge variant="ouro"><TrophyIcon aria-hidden="true" />Vencedor</Badge>
          : v.g.ok ? <Badge variant="ouro"><CheckIcon aria-hidden="true" />Confirmou</Badge>
          : fimAceite === "fim" ? <Badge variant="perigo">Não confirmou</Badge>
          : <Badge><ClockIcon aria-hidden="true" />Esperando<span className="sr-only"> confirmar</span></Badge>
      }
      return {
        chave: x.chave,
        texto: x.conta,
        nome: <><NomeConta nome={x.conta} />{riscado ? <span className="sr-only"> (não é da guilda)</span> : null}</>,
        voce: x.chave === minhaChave && !organizador,
        novo: novosRef.has(x.chave),
        riscado,
        vencedor: Boolean(v),
        fim,
      }
    })
  }, [inscritos, novosRef, minhaChave, organizador, foraSet, gerenciando, fase, ganhadoresLista, fimAceite, r])

  // ---------------------------------------------------------------- telas que não são o painel
  const cabecalho = (texto: string) => <h1 ref={refTitulo} tabIndex={-1} className="text-heading font-bold tracking-titulo outline-none [overflow-wrap:anywhere]">{texto}</h1>

  if (p.carga === "carregando") {
    return (
      <div className="grid gap-6" aria-busy="true">
        {regiao}
        {cabecalho("Sorteio")}
        <div aria-hidden="true" className="grid gap-px overflow-hidden rounded-lg border border-border min-[900px]:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid content-start gap-5 p-4 min-[560px]:p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full max-w-form" />
          </div>
          <div className="grid content-start gap-3 border-t border-border p-4 min-[900px]:border-t-0 min-[900px]:border-l min-[560px]:p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (p.carga === "erro") {
    return (
      <div className="grid gap-6">
        {regiao}
        {cabecalho("Não deu para abrir o sorteio")}
        <Vazio
          className="max-w-[640px]"
          titulo="Não deu para abrir o sorteio."
          acao={<Button type="button" variant="secondary" className="h-control" onClick={aoTentarDeNovo}>Tentar de novo</Button>}
        >
          Confira sua internet e tente de novo.
        </Vazio>
      </div>
    )
  }
  if (p.carga === "inexistente" || !s) {
    return (
      <div className="grid gap-6">
        {regiao}
        {cabecalho("Sorteio não encontrado")}
        <Vazio
          className="max-w-[640px]"
          titulo="Esse sorteio não está mais no ar."
          acao={
            <Button asChild variant="secondary" className="h-control">
              <a href="/sorteio.html?ver=abertos" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); navegar({ s: null, ver: "abertos" }) }}>Ver sorteios abertos</a>
            </Button>
          }
        >
          Confira se o link está completo. Se estiver, o sorteio já acabou e saiu do ar, ou foi apagado por quem organizou.
        </Vazio>
      </div>
    )
  }

  // ---------------------------------------------------------------- o painel
  const sorteioCerto = s
  const link = dados ? dados.linkDe(id, ORIGEM_SITE) : ""
  const estado: EstadoSelo = fase === "sorteando" ? "sorteando" : fase === "inscricoes" ? (aberto ? "aberto" : "encerrado") : "sorteado"
  const semInscritos = (inscritos?.length ?? 0) === 0
  const conhece = p.conexao !== null || p.avisos.conectar
  const total = (inscritos?.length ?? 0).toLocaleString("pt-BR")
  const textoTroca = (() => {
    if (!aceite) return ""
    const sem = aceite.ganhadores.filter((g) => !g.ok).map((g) => g.nome)
    const mant = aceite.ganhadores.filter((g) => g.ok).map((g) => g.nome)
    return `Sortear ${sem.length === 1 ? "outra pessoa" : `${sem.length} outras pessoas`} no lugar de ${sem.join(", ")}? ${mant.length ? `${mant.join(", ")} continua${mant.length > 1 ? "m" : ""} com o prêmio. ` : ""}A roleta gira de novo para todo mundo.`
  })()

  return (
    <div className="grid gap-4">
      {regiao}
      {cabecalho(sorteioCerto.titulo)}

      <div role="status" className="grid gap-2 empty:hidden">
        {!p.online && (
          <FaixaAviso titulo="Sem conexão." icone={<WifiOffIcon strokeWidth={1.75} />}>Tentando de novo…</FaixaAviso>
        )}
      </div>
      <div className="grid gap-2 empty:hidden">
        {p.avisos.conectar && <FaixaAviso role="alert" titulo="Não deu para conectar.">{MSG.semConexao}</FaixaAviso>}
        {p.avisos.inscritos && <FaixaAviso role="alert" titulo="A lista não atualizou.">{MSG.inscritos}</FaixaAviso>}
        {p.avisos.aceites && <FaixaAviso role="alert" titulo="Não deu para acompanhar.">{MSG.aceites}</FaixaAviso>}
        {p.conexao?.tokenRecusado && <FaixaAviso role="alert" titulo="Link de organizador recusado.">{MSG.tokenRecusado}</FaixaAviso>}
      </div>

      <section aria-label="Painel do sorteio" className="flex flex-col rounded-lg border border-border bg-surface">
        {organizador && dados && (
          <BarraOrganizador
            fase={fase}
            s={sorteioCerto}
            aberto={aberto}
            entram={entram}
            semInscritos={semInscritos}
            filtroAtivo={Boolean(membros)}
            link={link}
            aoSortear={() => p.acoes.sortear(fora)}
            aoRefazer={() => p.acoes.sortear(fora)}
            aoEncerrar={p.acoes.encerrar}
            aoReabrir={p.acoes.reabrir}
            aoApagar={async () => {
              const erro = await p.acoes.apagar()
              if (!erro) navegar({ s: null, ver: null })
              return erro
            }}
            aoAbrirFiltro={() => setFiltroAberto(true)}
            aoPegarLinkOrganizador={p.acoes.linkOrganizador}
            textoDoResultado={() => (r ? textoResultado(sorteioCerto, r, aceite?.fase === "fim" ? aceite.ganhadores.filter((g) => !g.ok).map((g) => g.nome) : [], ORIGEM_SITE) : "")}
            textoDoConvite={(t) => textoConviteDiscord(t, sorteioCerto, link)}
          />
        )}

        <div className="grid min-[900px]:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid content-start gap-5 p-4 min-[560px]:p-6">
            {fase === "inscricoes" && (
              <>
                <NavSala />
                <Premio s={sorteioCerto} estado={estado} refTitulo={titulo} />
                <PrazoInscricoes s={sorteioCerto} aberto={aberto} agora={agora} organizador={organizador} />
                {conhece ? (
                  <AreaConta
                    s={sorteioCerto}
                    aberto={aberto}
                    organizador={organizador}
                    semInscritos={semInscritos}
                    minhaConta={minhaConta}
                    tirado={tirado}
                    pedeGoogle={Boolean(sorteioCerto.google && !p.usuario?.google)}
                    aoParticipar={p.acoes.participar}
                  />
                ) : (
                  <Skeleton aria-hidden="true" className="h-40 w-full max-w-form" />
                )}
              </>
            )}
            {fase === "sorteando" && r && inscritos && (
              <>
                <NavSala />
                <FaseSorteando key={r.codigo} s={sorteioCerto} r={r} inscritos={inscritos} refTitulo={titulo} aoTerminar={() => setGirando(null)} />
              </>
            )}
            {fase === "resultado" && r && inscritos && (
              <>
                <NavSala />
                <FaseResultado s={sorteioCerto} r={r} inscritos={inscritos} euGanhei={euGanhei} organizador={organizador} refTitulo={titulo} />
              </>
            )}
            {fase === "confirmacao" && r && inscritos && aceite && (
              <>
                <NavSala />
                <FaseConfirmacao
                  s={sorteioCerto}
                  r={r}
                  inscritos={inscritos}
                  fase={aceite.fase}
                  resta={aceite.resta}
                  ganhadores={aceite.ganhadores}
                  euGanhei={euGanhei}
                  jaConfirmei={jaConfirmei}
                  organizador={organizador}
                  refTitulo={titulo}
                  aoConfirmar={p.acoes.confirmarPresenca}
                  aoTrocar={() => p.acoes.trocar(fora)}
                  textoDaTroca={textoTroca}
                />
              </>
            )}
          </div>

          <section aria-labelledby="part-tit" className="grid content-start gap-3 border-t border-border p-4 min-[900px]:border-t-0 min-[900px]:border-l min-[560px]:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 id="part-tit" className="flex items-center gap-2 text-body font-semibold">
                <UsersIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                Participantes
                <span className="dado text-small font-medium text-muted-foreground" aria-hidden="true">{total}</span>
                <span className="sr-only">: {total} {(inscritos?.length ?? 0) === 1 ? "pessoa" : "pessoas"}</span>
              </h2>
              {organizador && fase === "inscricoes" && !semInscritos && (
                <Button
                  ref={botaoGerenciar}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-control"
                  onClick={() => setGerenciando((v) => !v)}
                >
                  {gerenciando ? <CheckIcon /> : <PencilIcon />}
                  {gerenciando ? "Concluir" : "Gerenciar"}
                </Button>
              )}
            </div>
            {membros && organizador && (
              <p className="text-small text-muted-foreground">Quem aparece riscado não é da guilda e fica de fora do sorteio.</p>
            )}
            <ListaPessoas
              itens={itens}
              idTitulo="part-tit"
              vazio={
                aberto || !organizador ? (
                  <Vazio
                    icone={<UsersIcon strokeWidth={1.75} />}
                    titulo="Ninguém entrou ainda."
                    acao={organizador && aberto ? <Button type="button" variant="secondary" className="h-control" onClick={() => void copiarLinkVazio()}>Copiar link</Button> : undefined}
                  >
                    {organizador ? "Mande o link no Discord. Cada pessoa aparece aqui quando entrar." : "Digite seu ID e participe."}
                  </Vazio>
                ) : null
              }
            />
          </section>
        </div>
      </section>

      <Transparencia s={sorteioCerto} />

      <Confirma
        aberto={tirando !== null}
        aoFechar={() => setTirando(null)}
        titulo={tirando ? `Tirar ${tirando.conta}?` : "Tirar do sorteio?"}
        texto={tirando ? `Tirar ${tirando.conta} do sorteio? O nome fica na lista pública de inscrições tiradas, e essa pessoa não consegue se inscrever de novo pelo mesmo aparelho.` : ""}
        acao={tirando ? `Tirar ${tirando.conta}` : "Tirar"}
        perigo
        aoConfirmar={() => {
          const alvo = tirando
          setTirando(null)
          if (!alvo) return
          void p.acoes.tirar(alvo.chave, alvo.conta).then((erro) => {
            anunciar(erro ?? `Você tirou ${alvo.conta} do sorteio.`)
            botaoGerenciar.current?.focus()
          })
        }}
      />

      <Dialog open={filtroAberto} onOpenChange={setFiltroAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Só membros da guilda</DialogTitle>
            <DialogDescription>Quem não é da guilda fica de fora do sorteio e aparece riscado na lista de inscritos.</DialogDescription>
          </DialogHeader>
          <GuildaApi
            filtro
            aoColocar={(nomes) => {
              setMembros(new Set(nomes.map((n) => n.toLocaleLowerCase("pt-BR"))))
              setFiltroAberto(false)
              anunciar(`${nomes.length} membros carregados. Quem não é da guilda aparece riscado na lista.`)
            }}
          />
          {membros && (
            <Button type="button" variant="ghost" className="h-control" onClick={() => { setMembros(null); setFiltroAberto(false); anunciar("Filtro da guilda desligado.") }}>
              Tirar o filtro
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
