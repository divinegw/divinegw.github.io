"use client"

import { ArrowUpRightIcon, MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { GUIAS, SITE } from "@/conteudo/site"
import { LINKS_SITE_CELULAR, type PaginaAtual } from "./navegacao"

const linkMenu =
  "flex h-control items-center justify-between rounded-md px-3 text-body text-foreground transition-colors hover:bg-tint-hover active:bg-tint-pressed aria-[current=page]:bg-tint-selected aria-[current=page]:text-primary-text"

// Menu do celular: botão de ícone (44 px) que abre uma folha pela direita, com os guias e o resto do site.
export function MenuCelular({ atual, guiaAtual }: { atual?: PaginaAtual; guiaAtual?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="min-[900px]:hidden" aria-label="Abrir menu">
          <MenuIcon strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Guias e páginas do site.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <nav aria-label="Guias">
            <p className="rotulo px-3 pb-2 text-muted-foreground" aria-hidden="true">
              Guias
            </p>
            <ul className="flex flex-col gap-1">
              {GUIAS.map((g) => (
                <li key={g.guia}>
                  <a
                    href={`/guias/${g.guia}.html`}
                    className={linkMenu}
                    aria-current={g.guia === guiaAtual ? "page" : undefined}
                  >
                    {g.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Site">
            <p className="rotulo px-3 pb-2 text-muted-foreground" aria-hidden="true">
              Site
            </p>
            <ul className="flex flex-col gap-1">
              {LINKS_SITE_CELULAR.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.href}
                    className={linkMenu}
                    aria-current={l.id === atual ? "page" : undefined}
                  >
                    {l.rotulo}
                  </a>
                </li>
              ))}
              <li>
                <a href={SITE.discord} target="_blank" rel="noopener" className={linkMenu}>
                  <span>
                    Discord
                    <span className="sr-only"> (abre em nova aba)</span>
                  </span>
                  <ArrowUpRightIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
