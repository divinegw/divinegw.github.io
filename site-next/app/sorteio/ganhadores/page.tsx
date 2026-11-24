import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { TopoArte } from "@/components/divine/TopoArte"
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
      <TopoArte arte="dungeons" />
      {/* o título da página sobe e fica sobre a parte de baixo da arte, como no site de hoje */}
      <main id="conteudo" tabIndex={-1} className="relative mx-auto -mt-28 max-w-page px-4 pb-16 min-[900px]:-mt-32 min-[900px]:px-8 focus-visible:outline-none">
        <PaginaGanhadores />
      </main>
      <Rodape atual="sorteio" />
    </>
  )
}
