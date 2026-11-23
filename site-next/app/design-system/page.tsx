import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

// Vitrine do sistema novo (só para quem mantém o site; o Actions apaga antes de publicar).
// Etapa 0: prova que fontes, tokens e shadcn funcionam. A Etapa 1 a completa.
export const metadata: Metadata = {
  title: "Vitrine",
  robots: { index: false },
};

const cores = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["muted", "bg-muted"],
  ["primary", "bg-primary"],
  ["urgente", "bg-urgente"],
  ["aberto", "bg-aberto"],
  ["destructive", "bg-destructive"],
] as const;

export default function Vitrine() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">Etapa 0 · tokens provisórios</p>
        <h1 className="text-4xl font-bold tracking-tight">Vitrine do site novo</h1>
        <p className="text-muted-foreground">
          Inter no texto, <span className="font-mono text-primary-text">JetBrains Mono em Nome.1234</span> e o ouro
          da DIVINE como destaque único.
        </p>
      </header>

      <section aria-labelledby="cores" className="space-y-3">
        <h2 id="cores" className="text-xl font-semibold">Cores</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cores.map(([nome, classe]) => (
            <li key={nome} className="space-y-1">
              <div className={`h-12 rounded-md border ${classe}`} />
              <span className="font-mono text-xs text-muted-foreground">{nome}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="botoes" className="space-y-3">
        <h2 id="botoes" className="text-xl font-semibold">Botões (shadcn, ainda sem adaptar)</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Participar</Button>
          <Button variant="secondary">Copiar link</Button>
          <Button variant="outline">Ver ganhadores</Button>
          <Button variant="ghost">Cancelar</Button>
        </div>
      </section>
    </main>
  );
}
