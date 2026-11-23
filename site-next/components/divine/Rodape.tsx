import { ArrowUpRightIcon } from "lucide-react"
import { DiscordIcon } from "@/components/divine/icones-marca"

import { Button } from "@/components/ui/button"
import { AVISO, GUIAS, SITE } from "@/conteudo/site"
import type { PaginaAtual } from "./navegacao"

const linkRodape =
  "inline-flex min-h-control items-center min-[900px]:min-h-control-sm gap-1 text-small text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-primary-text"

const iconeExterno = "size-3.5 shrink-0"

// Rodapé: marca, guias, comunidade e, embaixo de um divider, direitos e avisos legais.
// O aviso da ArenaNet fica em inglês e sem alteração (Content Terms of Use, II.5).
// No celular, a marca vai em cima e as duas colunas ficam lado a lado.
export function Rodape({ atual, guiaAtual }: { atual?: PaginaAtual; guiaAtual?: string }) {
  const ano = new Date().getFullYear()
  return (
    <footer className="border-t border-divider bg-background">
      <div className="mx-auto max-w-page px-4 py-12 min-[900px]:px-8 min-[900px]:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 min-[900px]:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col items-start gap-4 min-[900px]:col-span-1">
            <a
              href="/"
              aria-label={`${SITE.nome}: início`}
              className="inline-flex items-center gap-3 rounded-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- site estático: <img> comum */}
              <img src="/assets/marca/emblema-oficial.png" width={40} height={40} alt="" />
              <span className="text-title font-semibold tracking-titulo text-foreground">{SITE.marca}</span>
            </a>
            <p className="max-w-sm text-small text-muted-foreground">{SITE.frase}</p>
            <Button asChild variant="secondary">
              <a
                href={SITE.discord}
                target="_blank"
                rel="noopener"
                aria-label="Entrar no Discord da guilda DIVINE (abre em nova aba)"
              >
                <DiscordIcon />
                Entrar no Discord
              </a>
            </Button>
          </div>

          <nav aria-label="Guias da guilda">
            <p className="rotulo pb-3 text-foreground" aria-hidden="true">
              Guias
            </p>
            <ul className="flex flex-col">
              {GUIAS.map((g) => (
                <li key={g.guia}>
                  <a
                    href={`/guias/${g.guia}.html`}
                    className={linkRodape}
                    aria-current={g.guia === guiaAtual ? "page" : undefined}
                  >
                    {g.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p id="rodape-comunidade" className="rotulo pb-3 text-foreground">
              Comunidade
            </p>
            <ul aria-labelledby="rodape-comunidade" className="flex flex-col">
              <li>
                <a href="/novidades.html" className={linkRodape} aria-current={atual === "novidades" ? "page" : undefined}>
                  Novidades do site
                </a>
              </li>
              <li>
                <a href="/galeria.html" className={linkRodape} aria-current={atual === "galeria" ? "page" : undefined}>
                  Galeria de artes
                </a>
              </li>
              <li>
                <a href="/sorteio.html" className={linkRodape} aria-current={atual === "sorteio" ? "page" : undefined}>
                  Sorteio
                </a>
              </li>
              <li>
                <a href="/creditos.html" className={linkRodape} aria-current={atual === "creditos" ? "page" : undefined}>
                  Créditos e licenças
                </a>
              </li>
              <li>
                <a href={SITE.discord} target="_blank" rel="noopener" className={linkRodape}>
                  Discord da guilda
                  <ArrowUpRightIcon className={iconeExterno} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
              <li>
                <a href={SITE.github} target="_blank" rel="noopener" className={linkRodape}>
                  DIVINE no GitHub
                  <ArrowUpRightIcon className={iconeExterno} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-divider pt-6 text-small text-muted-foreground">
          <p>
            © {ano} {SITE.nome}. {AVISO.direitos}
          </p>
          <p>{AVISO.fa}</p>
          <p lang="en">{AVISO.arenanet}</p>
        </div>
      </div>
    </footer>
  )
}
