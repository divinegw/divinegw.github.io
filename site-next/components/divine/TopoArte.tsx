// Faixa de arte da guilda no topo da página, de ponta a ponta, como no site de hoje (topo do Sorteio e das Novidades):
// altura de 180 a 260 px, a arte some num degradê até o fundo, e o título da página (que vem no <main> logo abaixo,
// puxado para cima) fica sobre a parte de baixo. Decorativa: alt vazio e aria-hidden; o título é o h1 da página.
// As artes ficam em public/assets/artes/<nome>-<largura>.webp (geradas do original com sharp, em 640/1024/1600).
const LARGURAS = [640, 1024, 1600] as const

export function TopoArte({ arte, foco = "50% 18%" }: { arte: string; foco?: string }) {
  const src = (w: number) => `/assets/artes/${arte}-${w}.webp`
  return (
    <div aria-hidden="true" className="relative h-[clamp(180px,22vw,260px)] overflow-hidden">
      <img
        src={src(1600)}
        srcSet={LARGURAS.map((w) => `${src(w)} ${w}w`).join(", ")}
        sizes="100vw"
        width={1600}
        height={800}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: foco }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/10" />
    </div>
  )
}
