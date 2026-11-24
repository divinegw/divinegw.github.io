import * as React from "react"
import { ShieldCheckIcon } from "lucide-react"

import { Campo } from "@/components/divine/Campo"
import { Detalhes } from "@/components/sorteio/Detalhes"
import { Input } from "@/components/ui/input"

// "Conferir um sorteio antigo": fechado por padrão. Sem código, o site cria um novo; com ele, refaz o resultado de antes.
// Se tem código preenchido, ele aparece no resumo, para não ficar escondido com o bloco fechado.
const AJUDA = "Com o código e a mesma lista (ou a mesma faixa), sai o mesmo resultado. Deixe vazio para um sorteio novo."

// `ajuda` troca o texto padrão quando o sorteio não tem lista nem faixa (Extras); `bloco` completa o nome para o leitor de tela ("de dados").
export function ConferirAntigo({ valor, aoMudar, ajuda = AJUDA, bloco }: { valor: string; aoMudar: (v: string) => void; ajuda?: string; bloco?: string }) {
  return (
    <Detalhes
      resumo="Conferir um sorteio antigo"
      sufixoSr={bloco}
      icone={<ShieldCheckIcon strokeWidth={1.75} />}
      extra={valor.trim() ? <span className="dado min-w-0 truncate text-caption text-primary-text">{valor.trim()}</span> : null}
    >
      <Campo rotulo="Código do sorteio" ajuda={ajuda}>
        <Input
          name="codigo"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="dado"
          placeholder="K7PX-3QMA-9RTD"
          autoComplete="off"
          spellCheck={false}
        />
      </Campo>
    </Detalhes>
  )
}
