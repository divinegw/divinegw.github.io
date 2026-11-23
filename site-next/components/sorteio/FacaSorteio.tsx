"use client"

import * as React from "react"
import { TrophyIcon } from "lucide-react"

import { Vazio } from "@/components/divine/Vazio"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormInscricao } from "@/components/sorteio/FormInscricao"
import { SeusSorteios } from "@/components/sorteio/SeusSorteios"
import { navegar, useParametros } from "@/components/sorteio/url"

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

// "Faça um sorteio": o card com as 5 abas. Nesta etapa só "Com inscrição" funciona; a aba escolhida fica em ?aba= para o link abrir no mesmo lugar.
export function FacaSorteio() {
  const parametros = useParametros()
  const pedida = parametros.get("aba")
  const aba: IdAba = ehAba(pedida) ? pedida : "inscricao"
  const [criados, setCriados] = React.useState(0)

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
          <TabsList
            aria-label="Tipos de sorteio"
            // no celular as 5 abas quebram em linhas, sem rolagem escondida: todas ficam à vista (stress de 23/11/2026)
            className="max-w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto"
          >
            {ABAS.map((a) => (
              <TabsTrigger key={a.id} value={a.id} className="h-control flex-none">
                {a.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* a aba do formulário fica montada (só escondida) para a troca de aba não apagar o que a pessoa preencheu */}
          <TabsContent value="inscricao" forceMount className="grid gap-5 data-[state=inactive]:hidden">
            <FormInscricao aoCriar={() => setCriados((n) => n + 1)} />
            <SeusSorteios key={criados} />
          </TabsContent>
          {ABAS.slice(1).map((a) => (
            <TabsContent key={a.id} value={a.id}>
              <Vazio titulo="Esta aba entra na próxima parte." />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
