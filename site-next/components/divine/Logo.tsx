// Logo DIVINE monocromática branca (emblema + nome). Proporção do arquivo: 1241 x 292.
// Decorativa (alt vazio): o nome fica no link que a envolve.
const LARGURA = 1241
const ALTURA = 292

export function Logo({ altura = 24, className }: { altura?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- site estático: <img> comum, sem o otimizador do Next
    <img
      src="/assets/marca/divine-mono-branco.png"
      width={Math.round((altura * LARGURA) / ALTURA)}
      height={altura}
      alt=""
      className={className}
      style={{ height: altura, width: "auto" }}
    />
  )
}
