"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { Slot } from "radix-ui"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

// Cliente por causa do `carregando` (ele bloqueia o clique). As variantes ficam em button-variants.ts:
// um link com cara de botão numa página de servidor usa `buttonVariants` de lá.
// Um filho é "ícone" se for um <svg> ou um componente (ex.: um ícone do Lucide). <span> e texto não são.
function ehIcone(filho: React.ReactNode) {
  return React.isValidElement(filho) && (filho.type === "svg" || typeof filho.type !== "string")
}

// Troca o ícone do botão por um giro. Sem ícone, o rótulo fica invisível (ocupa o mesmo espaço)
// e o giro assume o centro.
function comGiro(children: React.ReactNode) {
  const giro = <Loader2Icon key="giro" data-giro aria-hidden="true" className="animate-spin" />
  const filhos = React.Children.toArray(children)
  const posicao = filhos.findIndex(ehIcone)
  if (posicao >= 0) return filhos.map((filho, i) => (i === posicao ? giro : filho))
  return (
    <>
      <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
      <Loader2Icon data-giro aria-hidden="true" className="absolute inset-0 m-auto animate-spin" />
    </>
  )
}

// Com `asChild` + `carregando`, o giro entra dentro do filho (o <a>): o botão clona o filho com o
// conteúdo trocado. Se o filho não for um único elemento, só o clique fica bloqueado.
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  carregando = false,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Troca o ícone por um giro, mantém o tamanho e ignora o clique. */
    carregando?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  let conteudo = children
  if (carregando) {
    if (!asChild) {
      conteudo = comGiro(children)
    } else if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
      conteudo = React.cloneElement(children, undefined, comGiro(children.props.children))
    }
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-carregando={carregando || undefined}
      aria-busy={carregando || undefined}
      aria-disabled={carregando && asChild ? "true" : undefined}
      className={cn(
        buttonVariants({ variant, size }),
        carregando && asChild && "pointer-events-none",
        className
      )}
      onClick={(evento: React.MouseEvent<HTMLButtonElement>) => {
        if (carregando) {
          evento.preventDefault()
          return
        }
        onClick?.(evento)
      }}
      {...props}
    >
      {conteudo}
    </Comp>
  )
}

export { Button }
