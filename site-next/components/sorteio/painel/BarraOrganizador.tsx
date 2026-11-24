"use client"

import * as React from "react"
import {
  ChevronDownIcon, CopyIcon, DicesIcon, KeyRoundIcon, LinkIcon, RotateCcwIcon, SendIcon, SquareIcon, TrashIcon, UserIcon, UsersIcon,
} from "lucide-react"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Confirma } from "@/components/sorteio/painel/Confirma"
import type { Sorteio } from "@/lib/dados/firebase"
import type { Fase } from "@/lib/sorteio/painel"
import { cn } from "@/lib/utils"

type Dialogo = "sortear" | "encerrar" | "refazer" | "apagar" | null

const MOTIVO_TRAVA = "Disponível quando a primeira pessoa entrar."
const vencedoresTexto = (n: number) => `${n} ${n === 1 ? "vencedor" : "vencedores"}`
// O texto do item do menu com a linha de apoio embaixo (a do protótipo).
function Rotulo({ apoio, children }: { apoio: string; children: React.ReactNode }) {
  return (
    <span className="grid gap-0.5">
      <span>{children}</span>
      <span className="text-caption font-normal text-muted-foreground">{apoio}</span>
    </span>
  )
}
const pessoasTexto = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "participante" : "participantes"}`

export interface BarraOrganizadorProps {
  fase: Fase
  s: Sorteio
  aberto: boolean
  /** Quantas pessoas vão entrar na conta (inscritos menos quem o filtro da guilda deixou de fora). */
  entram: number
  semInscritos: boolean
  filtroAtivo: boolean
  link: string
  aoSortear: () => Promise<string | null>
  aoRefazer: () => Promise<string | null>
  aoEncerrar: () => Promise<string | null>
  aoReabrir: () => Promise<string | null>
  aoApagar: () => Promise<string | null>
  aoAbrirFiltro: () => void
  /** O link de organizador (só na hora de copiar). */
  aoPegarLinkOrganizador: () => Promise<string | null>
  /** O texto de "Copiar resultado". */
  textoDoResultado: () => string
  textoDoConvite: (tipo: "curto" | "completo" | "prazo") => string
}

// A barra de quem organiza: presa embaixo no celular e no topo no computador. Um só botão principal por fase.
// Sem inscritos, "Sortear agora" e "Encerrar" ficam travados (aria-disabled), com o motivo ligado ao botão.
export function BarraOrganizador(p: BarraOrganizadorProps) {
  const { fase, s, aberto } = p
  const [dialogo, setDialogo] = React.useState<Dialogo>(null)
  const [ocupado, setOcupado] = React.useState(false)

  // Aviso flutuante (o Sonner já anuncia para o leitor de tela, então não há região viva aqui).
  const mostra = (texto: string, erro = false) => { if (erro) toast.error(texto); else toast(texto) }
  async function executa(f: () => Promise<string | null>) {
    setOcupado(true)
    const erro = await f()
    setOcupado(false)
    if (erro) mostra(erro, true)
  }
  async function copia(texto: string, ok: string, falha: string) {
    const deu = await navigator.clipboard.writeText(texto).then(() => true, () => false)
    mostra(deu ? ok : falha, !deu)
  }
  const copiarLink = () => copia(p.link, "Link copiado. Agora é só colar no Discord.", `Não deu para copiar. O link é ${p.link}`)
  const copiarConvite = (t: "curto" | "completo" | "prazo") => {
    const rotulo = { curto: "Convite curto", completo: "Convite completo", prazo: "Convite com prazo" }[t]
    return copia(p.textoDoConvite(t), `${rotulo} copiado. Cole no canal do Discord.`, `Não deu para copiar. O link é ${p.link}`)
  }
  const copiarResultado = () => copia(p.textoDoResultado(), "Resultado copiado. Agora é só colar no Discord.", "Não deu para copiar. Selecione o código e copie à mão.")
  async function copiarOrganizador() {
    const l = await p.aoPegarLinkOrganizador()
    if (!l) return mostra("Não deu para pegar o link de organizador. Recarregue a página e tente de novo.", true)
    await copia(l, "Link de organizador copiado. Não mande no chat.", "Não deu para copiar o link de organizador. Tente de novo.")
  }

  const travado = p.semInscritos
  const travaProps = travado ? { "aria-disabled": true as const, "aria-describedby": "trava-motivo", title: MOTIVO_TRAVA } : {}
  const semAceite = !s.resultado?.prazo
  const tituloRefazer = semAceite ? "Sortear de novo?" : "Refazer o sorteio inteiro?"
  const textoRefazer = semAceite
    ? "Sortear de novo, com um código novo? O resultado de agora vai para a lista pública de resultados anteriores, e a roleta gira outra vez para todo mundo."
    : "Refazer o sorteio inteiro, com um código novo? Todo mundo que ganhou perde o prêmio, inclusive quem já aceitou. Para trocar só quem não aceitou, use Sortear outra pessoa. O resultado de agora vai para a lista pública de resultados anteriores."

  const itensConvite = (
    <>
      <DropdownMenuItem onSelect={() => void copiarConvite("curto")}><SendIcon aria-hidden="true" /><Rotulo apoio="Prêmio e link">Copiar convite curto</Rotulo></DropdownMenuItem>
      <DropdownMenuItem onSelect={() => void copiarConvite("completo")}><SendIcon aria-hidden="true" /><Rotulo apoio="Título, prêmio, link e como digitar o ID">Copiar convite completo</Rotulo></DropdownMenuItem>
      {s.fechaEm && aberto ? <DropdownMenuItem onSelect={() => void copiarConvite("prazo")}><SendIcon aria-hidden="true" /><Rotulo apoio="Mostra quanto falta, no horário de cada um">Copiar convite com prazo</Rotulo></DropdownMenuItem> : null}
    </>
  )

  return (
    <div
      className={cn(
        "order-last sticky bottom-0 z-20 rounded-b-lg border-t border-border bg-fill-1 pb-[env(safe-area-inset-bottom)]",
        "min-[900px]:static min-[900px]:order-first min-[900px]:rounded-t-lg min-[900px]:rounded-b-none min-[900px]:border-t-0 min-[900px]:border-b min-[900px]:pb-0"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 p-3 min-[900px]:px-4">
        <span className="mr-auto flex items-center gap-1.5 text-small font-semibold text-muted-foreground max-[899px]:w-full">
          <UserIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Você organiza
        </span>

        {fase === "inscricoes" && (
          <>
            <Button type="button" className="h-control max-[899px]:flex-1" carregando={ocupado} onClick={() => { if (!travado) setDialogo("sortear") }} {...travaProps}>
              <DicesIcon />
              Sortear agora
            </Button>
            {aberto ? (
              <Button type="button" variant="secondary" className="h-control max-[899px]:hidden" onClick={() => { if (!travado) setDialogo("encerrar") }} {...travaProps}>
                <SquareIcon />
                Encerrar inscrições
              </Button>
            ) : (
              <Button type="button" variant="secondary" className="h-control max-[899px]:hidden" onClick={() => void executa(p.aoReabrir)}>
                <RotateCcwIcon />
                Reabrir inscrições
              </Button>
            )}
            <div className="inline-flex max-[899px]:hidden">
              <Button type="button" variant="secondary" className="h-control rounded-r-none border-r-0" onClick={() => void copiarLink()}>
                <LinkIcon />
                Copiar link
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="secondary" size="icon" className="rounded-l-none" aria-label="Outros jeitos de copiar">
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>{itensConvite}</DropdownMenuContent>
              </DropdownMenu>
            </div>
            {travado && <span id="trava-motivo" className="sr-only">{MOTIVO_TRAVA}</span>}
          </>
        )}

        {fase === "sorteando" && (
          <Button type="button" className="h-control max-[899px]:flex-1" aria-disabled="true" carregando>
            <DicesIcon />
            Sorteando…
          </Button>
        )}

        {(fase === "resultado" || fase === "confirmacao") && (
          <Button type="button" variant={fase === "resultado" ? "default" : "secondary"} className="h-control max-[899px]:flex-1" onClick={() => void copiarResultado()}>
            <CopyIcon />
            Copiar resultado
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="secondary" className="h-control">
              Mais opções
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fase === "inscricoes" ? (
              <div className="grid gap-1 min-[900px]:hidden">
                {aberto ? (
                  <DropdownMenuItem disabled={travado} onSelect={() => { if (!travado) setDialogo("encerrar") }}><SquareIcon aria-hidden="true" />Encerrar inscrições</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => void executa(p.aoReabrir)}><RotateCcwIcon aria-hidden="true" />Reabrir inscrições</DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => void copiarLink()}><LinkIcon aria-hidden="true" /><Rotulo apoio="Só o endereço">Copiar link</Rotulo></DropdownMenuItem>
                {itensConvite}
                <DropdownMenuSeparator />
              </div>
            ) : (
              <>
                <DropdownMenuItem onSelect={() => setDialogo("refazer")} disabled={fase === "sorteando"}>
                  <DicesIcon aria-hidden="true" />
                  {semAceite ? "Sortear de novo" : "Refazer o sorteio inteiro"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void copiarLink()}><LinkIcon aria-hidden="true" />Copiar link</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={() => void copiarOrganizador()}>
              <KeyRoundIcon aria-hidden="true" />
              Copiar link de organizador
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={p.aoAbrirFiltro}>
              <UsersIcon aria-hidden="true" />
              {p.filtroAtivo ? "Só membros da guilda (ligado)" : "Só membros da guilda"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem perigo onSelect={() => setDialogo("apagar")}>
              <TrashIcon aria-hidden="true" />
              Apagar sorteio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Confirma
        aberto={dialogo === "sortear"}
        aoFechar={() => setDialogo(null)}
        titulo="Sortear agora?"
        texto={`Vai sortear ${vencedoresTexto(s.vencedores)} entre ${pessoasTexto(p.entram)}. As inscrições fecham e o sorteio aparece na tela de todo mundo.`}
        acao="Sortear"
        aoConfirmar={() => void executa(p.aoSortear)}
      />
      <Confirma
        aberto={dialogo === "encerrar"}
        aoFechar={() => setDialogo(null)}
        titulo="Encerrar inscrições?"
        texto="Ninguém mais entra até você reabrir as inscrições."
        acao="Encerrar"
        aoConfirmar={() => void executa(p.aoEncerrar)}
      />
      <Confirma
        aberto={dialogo === "refazer"}
        aoFechar={() => setDialogo(null)}
        titulo={tituloRefazer}
        texto={textoRefazer}
        acao={semAceite ? "Sortear de novo" : "Refazer o sorteio inteiro"}
        aoConfirmar={() => void executa(p.aoRefazer)}
      />
      <Confirma
        aberto={dialogo === "apagar"}
        aoFechar={() => setDialogo(null)}
        titulo="Apagar sorteio?"
        texto="Apagar este sorteio e todas as inscrições? Não dá para desfazer."
        acao="Apagar sorteio"
        perigo
        aoConfirmar={() => void executa(p.aoApagar)}
      />
    </div>
  )
}
