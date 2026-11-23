import * as React from "react"
import { CoinsIcon, GemIcon, GiftIcon, MapIcon } from "lucide-react"

import { iconeSeguro } from "@/lib/sorteio/exibir"
import type { PremioInfo } from "@/lib/sorteio/premio"
import { cn } from "@/lib/utils"

// Cor da raridade só no contorno do ícone (o nome do prêmio vem sempre escrito ao lado). Classes inteiras, para o Tailwind achar.
const RARIDADE: Record<string, string> = {
  rare: "border-rare/70 bg-rare/16",
  exotic: "border-exotic/70 bg-exotic/16",
  ascended: "border-ascended/70 bg-ascended/16",
  legendary: "border-legendary/70 bg-legendary/16",
}
const NEUTRO = "border-border-hover bg-fill-1"

const TAMANHO = { p: "size-10 rounded-md", mini: "size-5 rounded-[5px] border", g: "size-14 rounded-md" } as const

// Ícone do prêmio. Item, gemas, ouro e expansão: a imagem do jogo (só de render.guildwars2.com).
// Sem imagem (texto livre, ou endereço que não passou na checagem): um ícone do site.
export function IconePremio({
  premio,
  tipo,
  tamanho = "p",
  className,
}: {
  premio?: Partial<PremioInfo> | null
  tipo?: PremioInfo["tipo"]
  tamanho?: keyof typeof TAMANHO
  className?: string
}) {
  const t = tipo ?? premio?.tipo ?? "texto"
  const src = iconeSeguro(premio?.icone)
  const Fallback = t === "gemas" ? GemIcon : t === "ouro" ? CoinsIcon : t === "expansao" ? MapIcon : GiftIcon
  const cor = RARIDADE[premio?.raridade ?? ""] ?? NEUTRO
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center overflow-hidden border-2", TAMANHO[tamanho], cor, className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- site estático: sem otimização de imagem; o ícone vem do render do jogo
        <img src={src} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" decoding="async" className="size-full object-cover" />
      ) : (
        <Fallback className="size-1/2 text-muted-foreground" strokeWidth={1.75} />
      )}
    </span>
  )
}
