"use client"

import * as React from "react"
import { CheckIcon, CircleAlertIcon, EyeIcon, EyeOffIcon, KeyRoundIcon, UsersIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { Detalhes } from "@/components/sorteio/Detalhes"
import { Opcao } from "@/components/sorteio/Opcao"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { guildasLideradas, membros, type Guilda, type Membro } from "@/lib/sorteio/gw2"
import { cn } from "@/lib/utils"

type Msg = { tipo: "info" | "erro" | "ok"; texto: string } | null

// "Puxar os membros da guilda pela API do jogo". A chave de API:
//  - fica só neste estado do React (memória desta aba). Nunca vai para localStorage, cookie, URL da página nem log;
//  - o campo não tem `name`, então nem um envio de formulário a leva;
//  - só vai para api.guildwars2.com, pelas chamadas de lib/sorteio/gw2.ts (igual ao site de hoje).
// Nome de guilda e de membro vêm da API: sempre texto (o React escapa), nunca HTML.
export function GuildaApi({ aoColocar, filtro = false }: { aoColocar: (nomes: string[]) => void; filtro?: boolean }) {
  const [chave, setChave] = React.useState("")
  const [mostrar, setMostrar] = React.useState(false)
  const [msg, setMsg] = React.useState<Msg>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const [guildas, setGuildas] = React.useState<Guilda[] | null>(null)
  const [guildaId, setGuildaId] = React.useState("")
  const [lista, setLista] = React.useState<Membro[]>([])
  const [ranks, setRanks] = React.useState<Record<string, boolean>>({})
  const [ate, setAte] = React.useState("")
  const pedido = React.useRef(0)

  // a região role="status" mais abaixo é quem anuncia
  const avisa = (tipo: "info" | "erro" | "ok", texto: string) => setMsg({ tipo, texto })

  async function carregaMembros(id: string) {
    const meu = ++pedido.current
    setOcupado(true)
    avisa("info", "Buscando os membros…")
    try {
      const l = await membros(chave, id)
      if (meu !== pedido.current) return
      setLista(l)
      setRanks(Object.fromEntries([...new Set(l.map((m) => m.rank))].map((r) => [r, true])))
      avisa("ok", `${l.length} ${l.length === 1 ? "membro encontrado" : "membros encontrados"}. Escolha os ranks e clique em "${filtro ? "Deixar só os membros da guilda" : "Colocar os membros na lista"}".`)
    } catch (e) {
      if (meu === pedido.current) avisa("erro", e instanceof Error ? e.message : "Não deu para falar com a API do jogo.")
    } finally {
      if (meu === pedido.current) setOcupado(false)
    }
  }

  async function buscar() {
    if (!chave.trim()) return avisa("erro", "Cole a chave de API primeiro.")
    const meu = ++pedido.current
    setOcupado(true)
    avisa("info", "Conferindo a chave…")
    try {
      const gs = await guildasLideradas(chave)
      if (meu !== pedido.current) return
      if (!gs.length) {
        setGuildas(null)
        setOcupado(false)
        return avisa("erro", "Essa conta não é líder de nenhuma guilda. A API do jogo só mostra os membros para quem é líder.")
      }
      setGuildas(gs)
      setGuildaId(gs[0].id)
      await carregaMembros(gs[0].id)
    } catch (e) {
      if (meu !== pedido.current) return
      setGuildas(null)
      setOcupado(false)
      avisa("erro", e instanceof Error ? e.message : "Não deu para falar com a API do jogo.")
    }
  }

  function colocar() {
    const limite = ate ? new Date(`${ate}T23:59:59`) : null
    const nomes = lista.filter((m) => ranks[m.rank] && (!limite || !m.entrou || new Date(m.entrou) <= limite)).map((m) => m.nome)
    if (!nomes.length) return avisa("erro", "Nenhum membro passou nos filtros. Marque mais ranks ou mude a data.")
    aoColocar(nomes)
    const g = guildas?.find((x) => x.id === guildaId)
    // a chave já cumpriu o papel: sai da memória. Sem ela não dá para buscar de novo, então o painel volta ao começo.
    pedido.current++
    setChave("")
    setMostrar(false)
    setGuildas(null)
    setLista([])
    setRanks({})
    avisa("ok", filtro
      ? `${nomes.length} ${nomes.length === 1 ? "membro carregado" : "membros carregados"}. Quem não é da guilda aparece riscado na lista de inscritos.${g ? ` Guilda ${g.nome} [${g.tag}].` : ""}`
      : `${nomes.length} ${nomes.length === 1 ? "membro entrou" : "membros entraram"} na lista.${g ? ` Guilda ${g.nome} [${g.tag}].` : ""}`)
  }

  const nomesRanks = Object.keys(ranks)
  const Icone = msg?.tipo === "erro" ? CircleAlertIcon : CheckIcon

  const conteudo = (
    <>
      <p className="text-small text-muted-foreground">
        Só quem é líder da guilda consegue puxar os membros. Crie uma chave em{" "}
        <a className="text-primary-text underline underline-offset-4" href="https://account.arena.net/applications" target="_blank" rel="noopener noreferrer">
          account.arena.net/applications<span className="sr-only"> (abre em nova aba)</span>
        </a>{" "}
        com as permissões &quot;account&quot; e &quot;guilds&quot;. A chave fica só nesta aba: o site não salva e não manda para ninguém além da API do jogo.
      </p>

      <Campo rotulo="Chave de API">
        <div className="flex gap-2">
          <Input
            type={mostrar ? "text" : "password"}
            className="dado"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            autoComplete="new-password"
            onKeyDown={(e) => {
              // Enter aqui busca as guildas; não pode enviar o sorteio (o campo está dentro do formulário da aba)
              if (e.key === "Enter") { e.preventDefault(); if (!ocupado) void buscar() }
            }}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
          />
          <Button type="button" variant="secondary" size="icon" aria-label="Mostrar a chave" aria-pressed={mostrar} onClick={() => setMostrar((v) => !v)}>
            {mostrar ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
      </Campo>

      <Button type="button" variant="secondary" className="w-full" carregando={ocupado && !guildas} onClick={buscar}>
        <KeyRoundIcon />
        Buscar minhas guildas
      </Button>

      <div role="status" className={cn(!msg && "sr-only")}>
        {msg && (
          <p className={cn("flex items-start gap-2 text-small", msg.tipo === "erro" ? "text-destructive" : msg.tipo === "ok" ? "text-primary-text" : "text-muted-foreground")}>
            {msg.tipo !== "info" && <Icone className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
            <span className="min-w-0 [overflow-wrap:anywhere]">{msg.texto}</span>
          </p>
        )}
      </div>

      {guildas && (
        <div className="grid gap-4">
          <Campo rotulo="Guilda">
            <Select value={guildaId} onChange={(e) => { setGuildaId(e.target.value); void carregaMembros(e.target.value) }} disabled={ocupado}>
              {guildas.map((g) => <option key={g.id} value={g.id}>{`${g.nome} [${g.tag}]`}</option>)}
            </Select>
          </Campo>
          {nomesRanks.length > 0 && (
            <fieldset className="grid min-w-0">
              <legend className="mb-1 text-small font-medium">Ranks que entram</legend>
              {nomesRanks.map((r) => (
                <Opcao
                  key={r}
                  rotulo={<>{r} <span className="dado text-caption text-muted-foreground">({lista.filter((m) => m.rank === r).length})</span></>}
                  checked={ranks[r]}
                  onChange={(e) => setRanks((x) => ({ ...x, [r]: e.target.checked }))}
                />
              ))}
            </fieldset>
          )}
          <Campo rotulo="Só quem entrou na guilda até" ajuda="Deixe vazio para incluir todo mundo.">
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </Campo>
          <Button type="button" variant="secondary" className="w-full" disabled={ocupado || !lista.length} onClick={colocar}>
            <UsersIcon />
            {filtro ? "Deixar só os membros da guilda" : "Colocar os membros na lista"}
          </Button>
        </div>
      )}
    </>
  )
  // No painel do sorteio (modo "filtro") o conteúdo vai dentro de uma caixa de diálogo, já aberto.
  if (filtro) return <div className="grid gap-4">{conteudo}</div>
  return <Detalhes resumo="Puxar os membros da guilda pela API do jogo" icone={<UsersIcon strokeWidth={1.75} />}>{conteudo}</Detalhes>
}
