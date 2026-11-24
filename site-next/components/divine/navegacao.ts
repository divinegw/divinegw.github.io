// Links da barra do topo (computador e menu do celular). São páginas do Astro ou da home: <a> comum, não next/link.
export type PaginaAtual = "guias" | "galeria" | "sorteio" | "novidades" | "creditos"

export const LINKS_BARRA: { id: PaginaAtual; rotulo: string; href: string }[] = [
  { id: "guias", rotulo: "Guias", href: "/#comece" },
  { id: "galeria", rotulo: "Galeria", href: "/galeria.html" },
  { id: "sorteio", rotulo: "Sorteio", href: "/sorteio.html" },
  { id: "novidades", rotulo: "Novidades", href: "/novidades.html" },
]

export const LINKS_SITE_CELULAR: { id: PaginaAtual; rotulo: string; href: string }[] = [
  { id: "galeria", rotulo: "Galeria", href: "/galeria.html" },
  { id: "sorteio", rotulo: "Sorteio", href: "/sorteio.html" },
  { id: "novidades", rotulo: "Novidades", href: "/novidades.html" },
  { id: "creditos", rotulo: "Créditos e licenças", href: "/creditos.html" },
]

export const ROTULO_DISCORD = "Discord da guilda DIVINE (abre em nova aba)"
