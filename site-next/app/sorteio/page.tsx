import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { PaginaSorteio } from "@/components/sorteio/PaginaSorteio"

export const metadata: Metadata = {
  title: "Sorteio",
  description: "Os sorteios da guilda DIVINE: entre num que está aberto ou crie o seu.",
}

// /sorteio.html. A página é estática; o que depende da URL (?s=, ?ver=, ?aba=) é lido no navegador, dentro de PaginaSorteio.
export default function Page() {
  return (
    <>
      <BarraTopo atual="sorteio" />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-page px-4 pt-8 pb-16 min-[900px]:px-8 min-[900px]:pt-12 focus-visible:outline-none">
        <PaginaSorteio />
      </main>
      <Rodape atual="sorteio" />
    </>
  )
}
