import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { PaginaSorteio } from "@/components/sorteio/PaginaSorteio"
import { conteudoSorteio } from "@/lib/sorteio/conteudo"

export const metadata: Metadata = {
  title: "Sorteio",
  description: "Os sorteios da guilda DIVINE: entre num que está aberto ou crie o seu.",
}

// /sorteio.html. A página é estática; o que depende da URL (?s=, ?ver=, ?aba=) é lido no navegador, dentro de PaginaSorteio.
// O conteúdo de "O que jogar" (aba Extras) é lido dos guias aqui, na build, e vai pronto para a aba.
export default function Page() {
  const conteudo = conteudoSorteio()
  return (
    <>
      <BarraTopo atual="sorteio" />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-page px-4 pt-8 pb-16 min-[900px]:px-8 min-[900px]:pt-12 focus-visible:outline-none">
        <PaginaSorteio conteudo={conteudo} />
      </main>
      <Rodape atual="sorteio" />
    </>
  )
}
