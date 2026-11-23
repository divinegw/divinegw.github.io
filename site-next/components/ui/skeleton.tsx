import { cn } from "@/lib/utils"

// Esqueleto: dê a ele o tamanho do que vai entrar. Pulsa entre fill-1 e fill-2; com "reduzir movimento", fica parado.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-[pulso-esqueleto_1.6s_ease-in-out_infinite] rounded-md bg-fill-1 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
