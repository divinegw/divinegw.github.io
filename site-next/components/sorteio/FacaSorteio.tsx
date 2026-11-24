"use client"

import * as React from "react"
import { TrophyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AbaExtras } from "@/components/sorteio/AbaExtras"
import { AbaLista } from "@/components/sorteio/AbaLista"
import { AbaNumeros } from "@/components/sorteio/AbaNumeros"
import { AbaSquads } from "@/components/sorteio/AbaSquads"
import { Historico } from "@/components/sorteio/Historico"
import { FormInscricao } from "@/components/sorteio/FormInscricao"
import { SeusSorteios } from "@/components/sorteio/SeusSorteios"
import { navegar, useParametros } from "@/components/sorteio/url"
import type { GrupoConteudo } from "@/lib/sorteio/conteudo"

// O que vai em ?aba= (a primeira é a padrão e não aparece na URL).
const ABAS = [
  { id: "inscricao", rotulo: "Com inscrição" },
  { id: "lista", rotulo: "Lista de contas" },
  { id: "numeros", rotulo: "Números" },
  { id: "squads", rotulo: "Squads" },
  { id: "extras", rotulo: "Extras" },
] as const
type IdAba = (typeof ABAS)[number]["id"]
const ehAba = (v: string | null): v is IdAba => ABAS.some((a) => a.id === v)

// "Faça um sorteio": o card com as 5 abas; a aba escolhida fica em ?aba= para o link abrir no mesmo lugar.
// `conteudo` é o que a aba Extras sorteia em "O que jogar" (lido dos guias na build, em app/sorteio/page.tsx).
export function FacaSorteio({ conteudo }: { conteudo: GrupoConteudo[] }) {
  const parametros = useParametros()
  const pedida = parametros.get("aba")
  const aba: IdAba = ehAba(pedida) ? pedida : "inscricao"
  const [criados, setCriados] = React.useState(0)
  // o texto da aba Lista de contas, para o botão "Usar a lista da aba Lista de contas" da aba Squads.
  // Fica num ref (e não em estado) para digitar na aba Lista não redesenhar o card inteiro a cada tecla; a Squads lê no clique.
  const listaDaAba = React.useRef("")
  const guardarLista = React.useCallback((t: string) => { listaDaAba.current = t }, [])
  const lerListaDaAba = React.useCallback(() => listaDaAba.current, [])

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle as="h2">Faça um sorteio</CardTitle>
        <CardAction>
          <Button asChild variant="secondary" size="sm" className="h-control">
            <a href="/sorteio/ganhadores.html">
              <TrophyIcon />
              Ganhadores
            </a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs value={aba} onValueChange={(v) => navegar({ aba: v === "inscricao" ? null : v }, true)} className="gap-5">
          {/* 5 abas sem nenhuma sozinha na linha: com espaço, as 5 lado a lado; sem espaço, 2 em cima e 3 embaixo, cada linha dividida por igual (conferido em 360, 390, 450, 640, 900 e 1280 px) */}
          <div className="@container">
            <TabsList aria-label="Tipos de sorteio" className="grid w-full grid-cols-6 @min-[40rem]:grid-cols-5 group-data-horizontal/tabs:h-auto">
              {ABAS.map((a, i) => (
                <TabsTrigger key={a.id} value={a.id} className={`h-control w-full @min-[40rem]:col-span-1 ${i < 2 ? "col-span-3" : "col-span-2"}`}>
                  {a.rotulo}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* a aba do formulário fica montada (só escondida) para a troca de aba não apagar o que a pessoa preencheu */}
          <TabsContent value="inscricao" forceMount className="grid gap-5 data-[state=inactive]:hidden">
            <FormInscricao aoCriar={() => setCriados((n) => n + 1)} />
            <SeusSorteios key={criados} />
          </TabsContent>
          {/* as abas locais também ficam montadas: trocar de aba não apaga o que foi digitado */}
          <TabsContent value="lista" forceMount className="data-[state=inactive]:hidden">
            <AbaLista aoMudarTexto={guardarLista} />
          </TabsContent>
          <TabsContent value="numeros" forceMount className="data-[state=inactive]:hidden">
            <AbaNumeros />
          </TabsContent>
          <TabsContent value="squads" forceMount className="data-[state=inactive]:hidden">
            <AbaSquads lerListaDaAba={lerListaDaAba} />
          </TabsContent>
          <TabsContent value="extras" forceMount className="data-[state=inactive]:hidden">
            <AbaExtras grupos={conteudo} />
          </TabsContent>
        </Tabs>
        {aba !== "inscricao" && <Historico />}
      </CardContent>
    </Card>
  )
}
