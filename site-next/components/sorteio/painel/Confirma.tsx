"use client"

import * as React from "react"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Pergunta antes de uma ação que não dá para desfazer: o efeito por extenso e o botão nomeado pela ação.
// O foco começa em "Voltar" (o Radix cuida disso) e volta para o botão que abriu.
export function Confirma({
  aberto,
  aoFechar,
  titulo,
  texto,
  acao,
  perigo = false,
  aoConfirmar,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  texto: string
  acao: string
  perigo?: boolean
  aoConfirmar: () => void
}) {
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => { if (!v) aoFechar() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription className="[overflow-wrap:anywhere]">{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-control-lg sm:h-control">Voltar</AlertDialogCancel>
          <AlertDialogAction variant={perigo ? "destructive" : "default"} className="h-control-lg sm:h-control" onClick={aoConfirmar}>
            {acao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
