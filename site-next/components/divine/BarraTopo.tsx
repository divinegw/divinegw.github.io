import { DiscordIcon } from "@/components/divine/icones-marca"

import { Button } from "@/components/ui/button"
import { SITE } from "@/conteudo/site"
import { Logo } from "./Logo"
import { MenuCelular } from "./MenuCelular"
import { LINKS_BARRA, ROTULO_DISCORD, type PaginaAtual } from "./navegacao"

// Barra presa no topo: 56 px no celular, 64 no computador (a partir de 900 px).
//   atual: página aberta (marca o item com aria-current="page")
//   guiaAtual: slug do guia aberto; marca "Guias" como página atual e vai para o menu do celular
export function BarraTopo({ atual, guiaAtual }: { atual?: PaginaAtual; guiaAtual?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-divider bg-background/88 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-page items-center gap-4 px-4 min-[900px]:h-16 min-[900px]:px-8">
        <a
          href="/"
          aria-label={`Manual da ${SITE.nome}: início`}
          className="inline-flex h-control items-center rounded-sm"
        >
          <Logo altura={24} />
        </a>

        <nav aria-label="Navegação do site" className="ml-4 hidden min-[900px]:block">
          <ul className="flex items-center gap-1">
            {LINKS_BARRA.map((l) => (
              <li key={l.id}>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="aria-[current=page]:bg-tint-selected aria-[current=page]:text-primary-text hover:aria-[current=page]:bg-tint-selected!"
                >
                  <a
                    href={l.href}
                    aria-current={l.id === atual || (l.id === "guias" && guiaAtual) ? "page" : undefined}
                  >
                    {l.rotulo}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden min-[900px]:inline-flex">
            <a href={SITE.discord} target="_blank" rel="noopener" aria-label={ROTULO_DISCORD}>
              <DiscordIcon />
              Discord
            </a>
          </Button>
          <MenuCelular atual={atual} guiaAtual={guiaAtual} />
        </div>
      </div>
    </header>
  )
}
