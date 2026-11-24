"use client"

import * as React from "react"

import { Premio } from "@/components/sorteio/painel/Cabecalho"
import { Button } from "@/components/ui/button"
import type { Resultado, Sorteio } from "@/lib/dados/firebase"
import type { Inscrito } from "@/lib/sorteio/ao-vivo"
import { gerador } from "@/lib/sorteio/aleatorio"
import { Roleta, corCss, type CoresRoleta } from "@/lib/sorteio/roleta"

// Cores da roleta, lidas dos tokens do site (fundos que se alternam e a tinta que lê sobre cada um).
const cv = (v: string) => corCss(`var(${v})`)
const coresSite = (): CoresRoleta => ({
  fundos: ["--fill-2", "--primary", "--border-hover", "--primary-hover"].map(cv),
  tintas: ["--foreground", "--primary-foreground", "--foreground", "--primary-foreground"].map(cv),
  linha: cv("--surface"),
  fonte: getComputedStyle(document.body).fontFamily,
})
const quadro = () => new Promise<void>((ok) => requestAnimationFrame(() => ok()))

// A roleta gira uma vez por vencedor novo, com o mesmo código do resultado, na tela de todo mundo; no fim, o painel
// passa para o resultado. O canvas é decoração (aria-hidden): quem ganhou sai em texto, na fase seguinte.
// Quem não quer esperar pode pular (WCAG 2.2.2). Com "reduzir movimento" esta fase nem aparece.
export function FaseSorteando({
  s,
  r,
  inscritos,
  refTitulo,
  aoTerminar,
}: {
  s: Sorteio
  r: Resultado
  inscritos: Inscrito[]
  refTitulo: React.Ref<HTMLHeadingElement>
  aoTerminar: () => void
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const girar = React.useEffectEvent(async (vivo: () => boolean) => {
    await quadro()
    await quadro()
    if (!vivo() || !canvas.current) return
    const roleta = new Roleta(canvas.current, coresSite)
    const g = await gerador(r.codigo, "roleta")
    const excluidos = new Set(r.excluidos)
    let resto = inscritos.filter((p) => !excluidos.has(p.chave)).map((p) => p.conta)
    const novos = r.ganhadores.slice((r.mantidos ?? []).length)
    for (let i = 0; i < novos.length && resto.length; i++) {
      if (!vivo()) return
      roleta.itens = resto.map((nome) => ({ nome, peso: 1 }))
      roleta.desenha()
      const idx = resto.indexOf(novos[i])
      if (idx < 0) break
      await roleta.gira(idx, (g.u32() % 1000) / 1000, i === 0 ? 4200 : novos.length > 5 ? 1400 : 2600)
      resto = resto.filter((n) => n !== novos[i])
    }
    if (vivo()) aoTerminar()
  })

  React.useEffect(() => {
    let ativo = true
    void girar(() => ativo).catch(() => { if (ativo) aoTerminar() })
    return () => { ativo = false }
    // um giro por código: o `girar` lê o resto na hora (useEffectEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.codigo])

  const total = r.total - (r.mantidos?.length ?? 0)
  return (
    <>
      <Premio s={s} estado="sorteando" curto />
      <div className="grid justify-items-center gap-4 text-center">
        <h2 ref={refTitulo} tabIndex={-1} className="rotulo text-primary-text outline-none">
          Sorteando entre {total.toLocaleString("pt-BR")} {total === 1 ? "pessoa" : "pessoas"}
        </h2>
        <div className="relative w-full max-w-[280px] pt-3" aria-hidden="true">
          <span className="absolute top-0 left-1/2 z-10 -translate-x-1/2 border-x-[10px] border-t-[16px] border-x-transparent border-t-primary" />
          <canvas ref={canvas} className="aspect-square w-full" />
        </div>
        <p className="text-small text-muted-foreground">Em alguns segundos o resultado aparece para todo mundo ao mesmo tempo.</p>
        <Button type="button" variant="ghost" className="h-control" onClick={aoTerminar}>
          Mostrar o resultado
        </Button>
      </div>
    </>
  )
}
