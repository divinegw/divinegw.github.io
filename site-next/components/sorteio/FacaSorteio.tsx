"use client"

import * as React from "react"
import { TrophyIcon } from "lucide-react"

import { Vazio } from "@/components/divine/Vazio"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AbaLista } from "@/components/sorteio/AbaLista"
import { AbaNumeros } from "@/components/sorteio/AbaNumeros"
import { Historico } from "@/components/sorteio/Historico"
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

// "Faça um sorteio": o card com as 5 abas. Funcionam "Com inscrição", "Lista de contas" e "Números"; a aba escolhida fica em ?aba= para o link abrir no mesmo lugar.
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
            <AbaLista />
          </TabsContent>
          <TabsContent value="numeros" forceMount className="data-[state=inactive]:hidden">
            <AbaNumeros />
          </TabsContent>
          {ABAS.slice(3).map((a) => (
            <TabsContent key={a.id} value={a.id}>
              <Vazio titulo="Esta aba entra na próxima parte." />
            </TabsContent>
          ))}
        </Tabs>
        {(aba === "lista" || aba === "numeros") && <Historico />}
      </CardContent>
    </Card>
  )
}
