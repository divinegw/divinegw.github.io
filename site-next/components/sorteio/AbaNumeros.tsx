"use client"

import * as React from "react"
import { HashIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConferirAntigo } from "@/components/sorteio/ConferirAntigo"
import { Opcao } from "@/components/sorteio/Opcao"
import { ResultadoCard, mostrarCard } from "@/components/sorteio/ResultadoCard"
import { useAnuncio } from "@/components/sorteio/useAnuncio"
import { formata } from "@/lib/sorteio/aleatorio"
import { salvarNoHistorico } from "@/lib/sorteio/historico"
import { sortearNumeros, validarNumeros, type SaidaNumeros } from "@/lib/sorteio/local"

type Erros = Partial<Record<"min" | "max" | "qtd", string>>
type Resultado = { s: SaidaNumeros; min: bigint; max: bigint; ordenar: boolean }

// A aba "Números": sorteia números numa faixa (sem limite de tamanho), com ou sem repetição.
// Campos, limites e conta são os do site de hoje; com um código em "Conferir um sorteio antigo", sai o mesmo resultado.
export function AbaNumeros() {
  const [min, setMin] = React.useState("1")
  const [max, setMax] = React.useState("100")
  const [qtd, setQtd] = React.useState("1")
  const [repetir, setRepetir] = React.useState(false)
  const [ordenar, setOrdenar] = React.useState(false)
  const [codigo, setCodigo] = React.useState("")
  const [erros, setErros] = React.useState<Erros>({})
  const [resultado, setResultado] = React.useState<Resultado | null>(null)
  const [ocupado, setOcupado] = React.useState(false)
  const [pedidoFoco, setPedidoFoco] = React.useState(0)
  const [pedidoTitulo, setPedidoTitulo] = React.useState(0)
  const form = React.useRef<HTMLFormElement>(null)
  const titulo = React.useRef<HTMLHeadingElement>(null)
  const { anunciar, regiao } = useAnuncio()

  // o foco vai ao primeiro campo com erro, ou ao título do resultado, depois de desenhados
  React.useEffect(() => {
    if (pedidoFoco) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedidoFoco])
  React.useEffect(() => {
    if (!pedidoTitulo) return
    titulo.current?.focus({ preventScroll: true })
    mostrarCard(titulo.current)
  }, [pedidoTitulo])

  const limpa = (campo: keyof Erros) => setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e))

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (ocupado) return
    const v = validarNumeros(min, max, qtd, repetir)
    if (v.erro) {
      setErros({ [v.erro.campo]: v.erro.texto })
      setResultado(null)
      setPedidoFoco((n) => n + 1)
      return
    }
    setErros({})
    setOcupado(true)
    try {
      const s = await sortearNumeros(v.min, v.max, v.qtd, repetir, ordenar, codigo)
      setResultado({ s, min: v.min, max: v.max, ordenar })
      salvarNoHistorico({ modo: "Números", resumo: s.resumo, codigo: s.codigo })
      anunciar(`Resultado: ${s.resumo}. Código ${s.codigo}.`)
      setPedidoTitulo((n) => n + 1)
    } catch {
      setResultado(null)
      setErros({ qtd: "Não consegui sortear agora. Aperte o botão de novo." })
      setPedidoFoco((n) => n + 1)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="grid gap-5">
      {regiao}
      <form ref={form} noValidate onSubmit={enviar} className="grid gap-5">
        <div className="grid grid-cols-2 items-start gap-4 min-[560px]:grid-cols-3">
          <Campo rotulo="De" erro={erros.min}>
            <Input name="min" inputMode="text" pattern="-?[0-9. _]*" className="dado" autoComplete="off" value={min} onChange={(e) => { setMin(e.target.value); limpa("min") }} />
          </Campo>
          <Campo rotulo="Até" erro={erros.max}>
            <Input name="max" inputMode="text" pattern="-?[0-9. _]*" className="dado" autoComplete="off" value={max} onChange={(e) => { setMax(e.target.value); limpa("max") }} />
          </Campo>
          <div className="col-span-2 min-[560px]:col-span-1">
            <Campo rotulo="Quantos números" erro={erros.qtd}>
              <Input name="qtd" type="number" inputMode="numeric" min={1} max={10000} className="dado" value={qtd} onChange={(e) => { setQtd(e.target.value); limpa("qtd") }} />
            </Campo>
          </div>
        </div>

        <div className="grid">
          <Opcao name="repetir" rotulo="Um número pode sair mais de uma vez" checked={repetir} onChange={(e) => { setRepetir(e.target.checked); limpa("qtd") }} />
          <Opcao name="ordenar" rotulo="Mostrar do menor para o maior" checked={ordenar} onChange={(e) => setOrdenar(e.target.checked)} />
        </div>

        <Button type="submit" size="lg" className="w-full" carregando={ocupado} aria-disabled={ocupado || undefined}>
          <HashIcon />
          Sortear números
        </Button>
        <ConferirAntigo valor={codigo} aoMudar={setCodigo} />
      </form>

      {resultado && <ResultadoNumeros r={resultado} refTitulo={titulo} aoAnunciar={anunciar} />}
    </div>
  )
}

function ResultadoNumeros({ r, refTitulo, aoAnunciar }: { r: Resultado; refTitulo: React.Ref<HTMLHeadingElement>; aoAnunciar: (t: string) => void }) {
  const { s } = r
  const um = s.qtd === 1
  const faixa = `Entre ${formata(r.min)} e ${formata(r.max)}`
  return (
    <ResultadoCard
      titulo={um ? "Número sorteado" : `${formata(BigInt(s.qtd))} números`}
      refTitulo={refTitulo}
      codigo={s.codigo}
      discord={s.discord}
      conferido={s.conferindo}
      aoAnunciar={aoAnunciar}
    >
      {um ? (
        <>
          <p className="dado text-display font-bold tracking-titulo [overflow-wrap:anywhere]">{formata(s.saiu[0])}</p>
          <p className="text-small text-muted-foreground">{faixa}.</p>
        </>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {s.saiu.map((n, i) => (
              <li key={i} className="dado grid h-10 min-w-11 place-items-center rounded-md border border-border-hover bg-fill-1 px-2.5 text-body font-bold">
                {formata(n)}
              </li>
            ))}
          </ul>
          <p className="text-small text-muted-foreground">
            {faixa}, {s.repetir ? "podendo repetir" : "sem repetir"}
            {r.ordenar ? ", do menor para o maior" : ""}.
          </p>
        </>
      )}
    </ResultadoCard>
  )
}
