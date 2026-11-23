"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconePremio } from "@/components/sorteio/IconePremio"
import { useAgora } from "@/components/sorteio/url"
import { tempoCurto } from "@/lib/sorteio/exibir"
import type { MeuSorteio } from "@/lib/dados/firebase"

// Este aparelho já abriu algum sorteio? Quem abre guarda a chave do organizador no navegador (lib/dados/firebase.ts, criarSorteio).
// Só nesse caso o SDK do Firebase é baixado e o login anônimo acontece: quem só visita a página não paga nenhum dos dois.
const temSorteioNesteAparelho = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i)?.startsWith("divine-org-")) return true
  } catch { /* sem armazenamento: não há como saber */ }
  return false
}

/** "Seus sorteios": os que este aparelho abriu e ainda não saíram do ar nem foram sorteados. Sem nenhum, não aparece. */
export function SeusSorteios() {
  const [meus, setMeus] = React.useState<MeuSorteio[]>([])
  const agora = useAgora()

  React.useEffect(() => {
    if (!temSorteioNesteAparelho()) return
    let parar = () => {}
    let vivo = true
    import("@/lib/dados/firebase")
      .then(({ ouvirMeusSorteios }) => {
        if (!vivo) return
        parar = ouvirMeusSorteios(setMeus, () => setMeus([]))
      })
      .catch(() => { /* sem conexão: a lista só não aparece */ })
    return () => { vivo = false; parar() }
  }, [])

  if (!meus.length) return null
  return (
    <section aria-labelledby="seus-titulo" className="grid gap-3 border-t border-border pt-4">
      <h3 id="seus-titulo" className="text-body font-semibold">Seus sorteios</h3>
      <ul className="grid gap-2">
        {meus.map(({ id, s }) => {
          const fechaEm = s.fechaEm ? s.fechaEm.toMillis() : null
          const aberto = s.aberto && (fechaEm === null || !agora || fechaEm > agora)
          return (
            <li key={id} className="flex items-center gap-3">
              <IconePremio premio={s.premioInfo} tipo={s.premioInfo?.tipo ?? "texto"} />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <b className="truncate font-semibold">{s.titulo}</b>
                <small className="flex flex-wrap items-center gap-x-2 text-small text-muted-foreground">
                  <Badge variant={aberto ? "aberto" : "default"}>{aberto ? "Aberto" : "Fechado"}</Badge>
                  <span>
                    {aberto && fechaEm !== null && agora ? <>fecha em <span className="dado">{tempoCurto(fechaEm - agora)}</span></> : aberto ? "sem prazo" : "inscrições encerradas"}
                  </span>
                </small>
              </span>
              <Button asChild variant="secondary" size="sm" className="h-control">
                <a href={`/sorteio.html?s=${encodeURIComponent(id)}`}>Abrir<span className="sr-only"> {s.titulo}</span></a>
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
