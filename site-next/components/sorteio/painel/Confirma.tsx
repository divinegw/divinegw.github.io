"use client"

import * as React from "react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Uma saída do diálogo com duas escolhas: o botão e a frase que diz o que ele faz. */
export interface Escolha {
  rotulo: string
  apoio: string
  perigo?: boolean
  aoEscolher: () => void
}

// Pergunta antes de uma ação que não dá para desfazer: o efeito por extenso e o botão nomeado pela ação.
// O foco começa em "Voltar" (o Radix cuida disso) e volta para o botão que abriu.
// Com `escolhas`, no lugar do botão único entram duas (ou mais) saídas, cada uma com a sua linha de apoio.
export function Confirma({
  aberto,
  aoFechar,
  titulo,
  texto,
  acao,
  perigo = false,
  aoConfirmar,
  escolhas,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  texto: string
  acao?: string
  perigo?: boolean
  aoConfirmar?: () => void
  escolhas?: Escolha[]
}) {
  const base = React.useId()
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => { if (!v) aoFechar() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">{titulo}</AlertDialogTitle>
          <AlertDialogDescription className="[overflow-wrap:anywhere]">{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        {escolhas ? (
          <>
            <div className="grid gap-4">
              {escolhas.map((e, i) => (
                <div key={e.rotulo} className="grid gap-1.5">
                  <AlertDialogAction
                    variant={e.perigo ? "destructive" : "secondary"}
                    className="h-control-lg w-full sm:h-control"
                    aria-describedby={`${base}-${i}`}
                    onClick={e.aoEscolher}
                  >
                    {e.rotulo}
                  </AlertDialogAction>
                  <p id={`${base}-${i}`} className="text-small text-muted-foreground">{e.apoio}</p>
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-control-lg sm:h-control">Voltar</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <AlertDialogFooter>
            <AlertDialogCancel className="h-control-lg sm:h-control">Voltar</AlertDialogCancel>
            <AlertDialogAction variant={perigo ? "destructive" : "default"} className="h-control-lg sm:h-control" onClick={aoConfirmar}>
              {acao}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
