"use client"

import * as React from "react"
import { CheckIcon, ClockIcon, UserXIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Detalhes } from "@/components/sorteio/Detalhes"
import type { Sorteio } from "@/lib/dados/firebase"

export interface AreaContaProps {
  s: Sorteio
  aberto: boolean
  organizador: boolean
  semInscritos: boolean
  /** A conta com que este aparelho já entrou, se entrou. */
  minhaConta: string | null
  /** Este aparelho tinha uma inscrição e quem organiza a tirou. */
  tirado: boolean
  /** Sorteio com conta Google e este aparelho ainda não ligou a sua. */
  pedeGoogle: boolean
  /** Devolve o erro (e se ele é do campo), ou `null` se entrou. */
  aoParticipar: (conta: string) => Promise<{ erro: string; campo: boolean } | null>
}

function Aviso({ icone, children, className }: { icone: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-start gap-2.5 rounded-md border border-border bg-fill-1 px-4 py-3 text-small text-muted-foreground ${className ?? ""}`}>
      <span className="mt-0.5 shrink-0 text-primary-text [&_svg]:size-4" aria-hidden="true">{icone}</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  )
}

const AVISO_ACEITE = "Se você ganhar, tem 1 minuto para confirmar que está aqui."

/** A área do ID: o campo para entrar, ou o que a pessoa precisa saber no lugar dele. Quem organiza não participa: não vê campo. */
export function AreaConta({ s, aberto, organizador, semInscritos, minhaConta, tirado, pedeGoogle, aoParticipar }: AreaContaProps) {
  if (organizador) {
    return aberto ? null : (
      <Aviso icone={<ClockIcon strokeWidth={1.75} />}>
        {semInscritos ? "Ninguém entrou. Para abrir de novo, clique em Reabrir inscrições." : "Inscrições fechadas. Quando quiser, clique em Sortear agora."}
      </Aviso>
    )
  }
  if (tirado) {
    return (
      <Aviso icone={<UserXIcon strokeWidth={1.75} />}>
        <b className="font-semibold text-foreground">Quem organiza tirou você deste sorteio.</b>
      </Aviso>
    )
  }
  if (minhaConta) return <Dentro conta={minhaConta} fechado={!aberto} aceite={Boolean(s.aceite)} />
  if (!aberto) {
    return <Aviso icone={<ClockIcon strokeWidth={1.75} />}>As inscrições fecharam antes de você entrar. O resultado aparece aqui.</Aviso>
  }
  return <Formulario aceite={Boolean(s.aceite)} pedeGoogle={pedeGoogle} aoParticipar={aoParticipar} />
}

function Dentro({ conta, fechado, aceite }: { conta: string; fechado: boolean; aceite: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-primary-border bg-primary-bg px-4 py-3 text-small motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden="true" />
      <div className="grid min-w-0 gap-1.5">
        {/* o foco vem para cá depois de entrar: o leitor de tela lê a confirmação */}
        <p tabIndex={-1} data-foco-painel className="font-semibold outline-none [overflow-wrap:anywhere]">Você está no sorteio como {conta}.</p>
        <p className="text-muted-foreground">
          {fechado ? "As inscrições fecharam. Deixe esta página aberta: o resultado aparece aqui." : "Deixe esta página aberta: o resultado aparece aqui."}
        </p>
        {aceite && !fechado ? <p>{AVISO_ACEITE}</p> : null}
        <p className="text-muted-foreground">Digitou o ID errado? Avise quem organiza.</p>
      </div>
    </div>
  )
}

function Formulario({ aceite, pedeGoogle, aoParticipar }: { aceite: boolean; pedeGoogle: boolean; aoParticipar: AreaContaProps["aoParticipar"] }) {
  const [valor, setValor] = React.useState("")
  const [erro, setErro] = React.useState<string | undefined>()
  const [ocupado, setOcupado] = React.useState(false)
  const campo = React.useRef<HTMLInputElement>(null)
  const vivo = React.useRef(true)
  React.useEffect(() => {
    vivo.current = true
    return () => { vivo.current = false }
  }, [])

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    setErro(undefined)
    setOcupado(true)
    const r = await aoParticipar(valor)
    if (!vivo.current) return
    setOcupado(false)
    if (!r) return // entrou: esta área vira "Você está no sorteio" e o foco vai para lá
    setErro(r.erro)
    if (r.campo) campo.current?.focus()
  }

  return (
    <form noValidate onSubmit={enviar} className="grid gap-3">
      <Campo rotulo="Seu ID do Guild Wars 2" ajuda={erro ? undefined : "Com o ponto e os 4 números, como Joana.1234."} erro={erro}>
        <Input
          ref={campo}
          name="conta"
          value={valor}
          onChange={(e) => { setValor(e.target.value); if (erro) setErro(undefined) }}
          placeholder="Nome.1234"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={40}
          readOnly={ocupado}
          className="dado max-w-form"
        />
      </Campo>
      <Button type="submit" size="lg" className="w-full min-[560px]:w-fit" carregando={ocupado}>
        {ocupado ? "Entrando…" : "Participar"}
      </Button>
      {pedeGoogle && <p className="text-small text-muted-foreground">Este sorteio pede a sua conta Google: vale uma inscrição por conta.</p>}
      {aceite && (
        <p className="flex items-start gap-2 text-small text-muted-foreground">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-primary-text" strokeWidth={1.75} aria-hidden="true" />
          {AVISO_ACEITE}
        </p>
      )}
      <Detalhes resumo="Onde acho meu ID?" className="max-w-form">
        <p className="text-small text-muted-foreground">
          No jogo, aperte <kbd className="dado rounded-sm border border-border-hover bg-fill-1 px-1.5">Y</kbd> para abrir o painel social: seu ID aparece lá, como Nome.1234. Fora do jogo, ele também está na sua conta ArenaNet, em{" "}
          <a className="text-primary-text underline underline-offset-4" href="https://account.arena.net" target="_blank" rel="noopener noreferrer">
            account.arena.net<span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </p>
      </Detalhes>
    </form>
  )
}
