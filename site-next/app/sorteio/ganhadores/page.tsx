import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { PaginaGanhadores } from "@/components/sorteio/ganhadores/PaginaGanhadores"

export const metadata: Metadata = {
  title: "Ganhadores",
  description: "Quem ganhou os sorteios ao vivo da guilda DIVINE, com o código de cada sorteio para conferir.",
}

// /sorteio/ganhadores.html. A página é estática; a lista e a conferência são lidas no navegador (só leitura, sem login).
export default function Page() {
  return (
    <>
      <BarraTopo atual="sorteio" />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-page px-4 pt-8 pb-16 min-[900px]:px-8 min-[900px]:pt-12 focus-visible:outline-none">
        <PaginaGanhadores />
      </main>
      <Rodape atual="sorteio" />
    </>
  )
}
