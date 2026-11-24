import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { TopoArte } from "@/components/divine/TopoArte"
import { PaginaSorteio } from "@/components/sorteio/PaginaSorteio"
import { conteudoSorteio } from "@/lib/sorteio/conteudo"

const descricao = "Os sorteios da guilda DIVINE: participe dos sorteios ativos ou organize um novo."
const imagem = { url: "/assets/og/sorteio.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Arte da guilda DIVINE" }

export const metadata: Metadata = {
  title: "Sorteio",
  description: descricao,
  alternates: { canonical: "/sorteio.html" },
  openGraph: { type: "website", siteName: "Guilda DIVINE", locale: "pt_BR", url: "/sorteio.html", title: "Sorteio · DIVINE", description: descricao, images: [imagem] },
  twitter: { card: "summary_large_image", title: "Sorteio · DIVINE", description: descricao, images: [{ url: imagem.url, alt: imagem.alt }] },
}

// /sorteio.html. A página é estática; o que depende da URL (?s=, ?ver=, ?aba=) é lido no navegador, dentro de PaginaSorteio.
// O conteúdo de "O que jogar" (aba Extras) é lido dos guias aqui, na build, e vai pronto para a aba.
export default function Page() {
  const conteudo = conteudoSorteio()
  return (
    <>
      <BarraTopo atual="sorteio" />
      <TopoArte arte="dungeons" />
      {/* o título da página sobe e fica sobre a parte de baixo da arte, como no site de hoje */}
      <main id="conteudo" tabIndex={-1} className="relative mx-auto -mt-28 max-w-page px-4 pb-16 min-[900px]:-mt-32 min-[900px]:px-8 focus-visible:outline-none">
        <PaginaSorteio conteudo={conteudo} />
      </main>
      <Rodape atual="sorteio" />
    </>
  )
}
