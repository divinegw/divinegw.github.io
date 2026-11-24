import type { Metadata } from "next"

import { BarraTopo } from "@/components/divine/BarraTopo"
import { Rodape } from "@/components/divine/Rodape"
import { TopoArte } from "@/components/divine/TopoArte"
import { PaginaGanhadores } from "@/components/sorteio/ganhadores/PaginaGanhadores"

const descricao = "Confira os vencedores e valide qualquer resultado pelo código de verificação."
const imagem = { url: "/assets/og/sorteio.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Arte da guilda DIVINE" }

export const metadata: Metadata = {
  title: "Ganhadores",
  description: descricao,
  alternates: { canonical: "/sorteio/ganhadores.html" },
  openGraph: { type: "website", siteName: "Guilda DIVINE", locale: "pt_BR", url: "/sorteio/ganhadores.html", title: "Ganhadores · DIVINE", description: descricao, images: [imagem] },
  twitter: { card: "summary_large_image", title: "Ganhadores · DIVINE", description: descricao, images: [{ url: imagem.url, alt: imagem.alt }] },
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
