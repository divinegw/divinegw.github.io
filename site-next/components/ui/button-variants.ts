import { cva } from "class-variance-authority"

// Variantes do botão, num arquivo sem "use client" para páginas de servidor poderem usar (ex.: link com cara de botão).
// Regras de interação do DESIGN.md: hover só com o botão ativo (not-disabled:), pressionado, desativado sem
// opacidade. O anel de foco vem do globals.css (:focus-visible), por isso não há ring-* aqui.
const caixaDesativada =
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-fill-1 disabled:text-disabled"
const semCaixaDesativada = "disabled:cursor-not-allowed disabled:text-disabled"

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-body font-semibold whitespace-nowrap select-none transition-[background-color,border-color,color,transform] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground not-disabled:hover:bg-primary-hover not-disabled:active:scale-[.98] not-disabled:active:bg-primary-pressed ${caixaDesativada}`,
        secondary: `border-border bg-fill-1 text-foreground not-disabled:hover:border-border-hover not-disabled:active:bg-fill-2 ${caixaDesativada}`,
        outline: `border-border bg-fill-1 text-foreground not-disabled:hover:border-border-hover not-disabled:active:bg-fill-2 ${caixaDesativada}`,
        ghost: `text-foreground not-disabled:hover:not-aria-pressed:bg-tint-hover not-disabled:active:bg-tint-pressed aria-pressed:bg-tint-selected ${semCaixaDesativada}`,
        destructive: `border-destructive-border bg-destructive-bg text-destructive not-disabled:hover:border-destructive not-disabled:active:bg-destructive/25 ${caixaDesativada}`,
        link: `text-primary-text underline-offset-4 not-disabled:hover:underline ${semCaixaDesativada}`,
      },
      size: {
        default: "h-control px-4 [&_svg:not([class*='size-'])]:size-5",
        sm: "h-control-sm gap-1.5 px-3 text-small [&_svg:not([class*='size-'])]:size-4",
        lg: "h-control-lg px-6",
        icon: "size-control px-0",
        "icon-sm": "size-control-sm px-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-control-lg px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
