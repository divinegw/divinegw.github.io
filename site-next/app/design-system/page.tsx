import type { Metadata } from "next";
import { CopyIcon, PlusIcon } from "lucide-react";

import { Campo } from "@/components/divine/Campo";
import { BarraTopo } from "@/components/divine/BarraTopo";
import { Rodape } from "@/components/divine/Rodape";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BotaoCopiar } from "./BotaoCopiar";

// Vitrine do sistema (só para quem mantém o site; o Actions apaga antes de publicar).
// Cada peça aparece com os estados do DESIGN.md. Hover, pressionado e foco só se veem ao vivo.
export const metadata: Metadata = {
  title: "Vitrine",
  robots: { index: false },
};

// [classe de fundo, nome, valor]. As classes ficam escritas por inteiro para o Tailwind achá-las.
const papeis: readonly (readonly [string, string, string])[] = [
  ["bg-background", "background", "#0B0B0C"],
  ["bg-surface", "surface (card)", "#121214"],
  ["bg-fill-1", "fill-1", "#18181B"],
  ["bg-fill-2", "fill-2", "#202024"],
  ["bg-border", "border", "#27272B"],
  ["bg-border-hover", "border-hover", "#3F3F46"],
  ["bg-border-field", "border-field (input)", "#62626C"],
  ["bg-border-field-hover", "border-field-hover", "#7A7A85"],
  ["bg-divider", "divider", "#1E1E22"],
  ["bg-foreground", "foreground", "#EDEDED"],
  ["bg-muted-foreground", "muted-foreground", "#A1A1AA"],
  ["bg-placeholder", "placeholder", "#82828B"],
  ["bg-disabled", "disabled", "#52525B"],
  ["bg-tint-hover", "tint-hover", "branco 5%"],
  ["bg-tint-selected", "tint-selected", "branco 8%"],
  ["bg-tint-pressed", "tint-pressed", "branco 11%"],
  ["bg-primary", "primary", "#E2B254"],
  ["bg-primary-hover", "primary-hover", "#EBC274"],
  ["bg-primary-pressed", "primary-pressed", "#C99A3C"],
  ["bg-primary-foreground", "primary-foreground", "#0B0B0C"],
  ["bg-primary-text", "primary-text", "#EEC066"],
  ["bg-primary-bg", "primary-bg", "ouro 10%"],
  ["bg-primary-border", "primary-border", "ouro 32%"],
  ["bg-ring", "ring", "#EEC066"],
  ["bg-urgente", "urgente", "#FF8A3D"],
  ["bg-urgente-bg", "urgente-bg", "laranja 12%"],
  ["bg-aberto", "aberto", "#4ADE80"],
  ["bg-aberto-bg", "aberto-bg", "verde 10%"],
  ["bg-destructive", "destructive", "#F87171"],
  ["bg-destructive-bg", "destructive-bg", "vermelho 10%"],
  ["bg-destructive-border", "destructive-border", "vermelho 40%"],
  ["bg-overlay", "overlay", "preto 70%"],
];

const profissoes: readonly (readonly [string, string, string])[] = [
  ["bg-prof-guardian", "Guardian", "#72C1D9"],
  ["bg-prof-revenant", "Revenant", "#E6806C"],
  ["bg-prof-warrior", "Warrior", "#FFD166"],
  ["bg-prof-engineer", "Engineer", "#D09C59"],
  ["bg-prof-ranger", "Ranger", "#8CDC82"],
  ["bg-prof-thief", "Thief", "#C39298"],
  ["bg-prof-elementalist", "Elementalist", "#F68A87"],
  ["bg-prof-mesmer", "Mesmer", "#C385E2"],
  ["bg-prof-necromancer", "Necromancer", "#5CB078"],
];

const raridades: readonly (readonly [string, string, string])[] = [
  ["bg-rare", "Rare", "#FCD00B"],
  ["bg-exotic", "Exotic", "#FFA405"],
  ["bg-ascended", "Ascended", "#FB3E8D"],
  ["bg-legendary", "Legendary", "#A855F7"],
];

const variantes = [
  { nome: "Principal", variant: "default" },
  { nome: "Secundário", variant: "secondary" },
  { nome: "Fantasma", variant: "ghost" },
  { nome: "Link", variant: "link" },
  { nome: "Perigo", variant: "destructive" },
] as const;

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-6 border-t border-divider py-12">
      <h2 id={id} className="text-heading font-semibold tracking-titulo">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Amostras({ titulo, itens }: { titulo: string; itens: readonly (readonly [string, string, string])[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-title font-semibold tracking-titulo">{titulo}</h3>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 min-[900px]:grid-cols-4">
        {itens.map(([classe, nome, valor]) => (
          <li key={nome} className="space-y-2">
            <div className={`h-12 rounded-md border border-border ${classe}`} aria-hidden="true" />
            <p className="text-small font-medium text-foreground">{nome}</p>
            <p className="dado text-caption text-muted-foreground">{valor}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const tamanhos = [
  { classe: "text-caption", nome: "caption", medida: "12 / 16", uso: "etiqueta", exemplo: "há 2 min" },
  { classe: "text-small", nome: "small", medida: "14 / 20", uso: "apoio, lista", exemplo: "Quem entrou na lista agora" },
  { classe: "text-body", nome: "body", medida: "16 / 24", uso: "interface, campo", exemplo: "Digite seu ID para participar" },
  { classe: "text-lead", nome: "lead", medida: "18 / 28", uso: "abertura de guia", exemplo: "Do primeiro squad ao Challenge Mode." },
  { classe: "text-title font-semibold tracking-titulo", nome: "title", medida: "22 / 28", uso: "título de card", exemplo: "Prêmio da noite" },
  { classe: "text-heading font-semibold tracking-titulo", nome: "heading", medida: "28 a 36", uso: "capítulo do guia", exemplo: "Antes de entrar na raid" },
  { classe: "text-page font-bold tracking-titulo", nome: "page", medida: "36 a 56", uso: "título de página", exemplo: "Raids" },
  { classe: "text-display font-bold tracking-titulo tabular-nums", nome: "display", medida: "40 a 72", uso: "relógio, vencedor", exemplo: "00:08" },
] as const;

export default function Vitrine() {
  return (
    <>
      <BarraTopo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-page px-4 pt-12 min-[900px]:px-8 focus-visible:outline-none">
        <header className="space-y-4 pb-12">
          <h1 className="text-page font-bold tracking-titulo">Vitrine do sistema</h1>
          <p className="max-w-prose text-lead text-muted-foreground">
            Cada peça do site com os estados dela. Passe o mouse e aperte Tab para ver o que não cabe numa foto.
          </p>
        </header>

        <Secao id="cores" titulo="Cores">
          <p className="max-w-prose text-body text-muted-foreground">
            Base quase preta, cinzas neutros e um destaque só: o ouro da DIVINE.
          </p>
          <Amostras titulo="Papéis do sistema" itens={papeis} />
          <Amostras titulo="Profissões" itens={profissoes} />
          <Amostras titulo="Raridades" itens={raridades} />
          <p className="max-w-prose text-small text-muted-foreground">
            Cor do jogo só em ícone, ponto e etiqueta, sempre com o nome escrito ao lado.
          </p>
        </Secao>

        <Secao id="tipo" titulo="Tipo">
          <ul className="divide-y divide-divider">
            {tamanhos.map((t) => (
              <li key={t.nome} className="grid gap-1 py-4 min-[900px]:grid-cols-[200px_1fr] min-[900px]:items-baseline min-[900px]:gap-6">
                <p className="text-small text-muted-foreground">
                  <span className="dado text-foreground">{t.nome}</span> · <span className="dado">{t.medida}</span> · {t.uso}
                </p>
                <p className={t.classe}>{t.exemplo}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <p className="text-small text-muted-foreground">
              Dado em <span className="dado text-foreground">JetBrains Mono</span>: <span className="dado text-primary-text">Nome.1234</span>
            </p>
            <div className="max-w-prose">
              <p className="text-prose">
                O Mursaat Overseer abre a primeira raid do jogo. A luta pede que o squad se divida em três grupos e
                responda rápido a cada marca no chão. Quem entra pela primeira vez costuma errar o tempo dos lasers, e
                tudo bem: o vídeo do guia mostra o caminho passo a passo.
              </p>
            </div>
          </div>
        </Secao>

        <Secao id="botoes" titulo="Botões">
          <p className="max-w-prose text-body text-muted-foreground">
            Hover, pressionado e foco aparecem passando o mouse e apertando Tab.
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Matriz de botões"
            className="overflow-x-auto rounded-lg border border-border bg-surface"
          >
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-divider">
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Variante</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Normal</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Desativado</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Carregando</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Pequeno</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Padrão</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Grande</th>
                  <th scope="col" className="px-4 py-3 text-small font-medium text-muted-foreground">Ícone</th>
                </tr>
              </thead>
              <tbody>
                {variantes.map(({ nome, variant }) => (
                  <tr key={variant} className="border-b border-divider last:border-b-0">
                    <th scope="row" className="px-4 py-3 text-small font-medium text-foreground">{nome}</th>
                    <td className="px-4 py-3"><Button variant={variant}>Participar</Button></td>
                    <td className="px-4 py-3"><Button variant={variant} disabled>Participar</Button></td>
                    <td className="px-4 py-3">
                      <Button variant={variant} carregando>
                        <PlusIcon strokeWidth={1.75} aria-hidden="true" />
                        Participar
                      </Button>
                    </td>
                    <td className="px-4 py-3"><Button variant={variant} size="sm">Participar</Button></td>
                    <td className="px-4 py-3"><Button variant={variant}>Participar</Button></td>
                    <td className="px-4 py-3"><Button variant={variant} size="lg">Participar</Button></td>
                    <td className="px-4 py-3">
                      <Button variant={variant} size="icon" aria-label={`Copiar link (${nome.toLowerCase()})`}>
                        <CopyIcon strokeWidth={1.75} aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="max-w-prose text-small text-muted-foreground">
            No máximo um botão principal por tela. Aqui ele aparece em todas as colunas só para mostrar os estados.
          </p>
        </Secao>

        <Secao id="campos" titulo="Campos">
          <div className="grid max-w-form gap-6">
            <Campo rotulo="ID da conta" ajuda="Seu nome na conta, com o ponto e os 4 números.">
              <Input placeholder="Nome.1234" className="dado" autoComplete="off" />
            </Campo>
            <Campo rotulo="ID da conta (com erro)" erro="Esse ID não existe. Confira o ponto e os 4 números.">
              <Input defaultValue="Nome.12" className="dado" autoComplete="off" />
            </Campo>
            <Campo rotulo="ID da conta (desativado)">
              <Input defaultValue="Nome.1234" disabled className="dado" />
            </Campo>
            <Campo rotulo="Recado">
              <Textarea placeholder="Conte o que você quer do prêmio." />
            </Campo>
            <Campo rotulo="Recado (com erro)" erro="O recado passou de 200 letras. Corte um pedaço.">
              <Textarea defaultValue="Quero muito esse prêmio." />
            </Campo>
            <Campo rotulo="Recado (desativado)">
              <Textarea defaultValue="Os recados fecharam." disabled />
            </Campo>
          </div>
        </Secao>

        <Secao id="etiquetas" titulo="Etiquetas">
          <ul className="flex flex-wrap gap-3">
            <li><Badge>Neutra</Badge></li>
            <li><Badge variant="ouro">Você</Badge></li>
            <li><Badge variant="aberto">Aberto</Badge></li>
            <li><Badge variant="urgente" className="dado">0:08</Badge></li>
            <li><Badge variant="perigo">Não confirmou</Badge></li>
          </ul>
        </Secao>

        <Secao id="abas" titulo="Abas">
          <Tabs defaultValue="inscricao" className="max-w-form">
            <TabsList aria-label="Exemplo de abas">
              <TabsTrigger value="inscricao">Com inscrição</TabsTrigger>
              <TabsTrigger value="contas">Lista de contas</TabsTrigger>
              <TabsTrigger value="numeros">Números</TabsTrigger>
            </TabsList>
            <TabsContent value="inscricao" className="text-body text-muted-foreground">
              Quem já entrou na lista e confirmou presença.
            </TabsContent>
            <TabsContent value="contas" className="text-body text-muted-foreground">
              Todas as contas, na ordem em que chegaram.
            </TabsContent>
            <TabsContent value="numeros" className="text-body text-muted-foreground">
              <span className="dado text-foreground">42</span> pessoas na lista, <span className="dado text-foreground">38</span> confirmadas.
            </TabsContent>
          </Tabs>
        </Secao>

        <Secao id="card" titulo="Card">
          <Card className="max-w-form">
            <CardHeader>
              <CardTitle>Prêmio da noite</CardTitle>
              <CardDescription>Sorteio de domingo, 21h30.</CardDescription>
            </CardHeader>
            <CardContent className="text-body text-muted-foreground">
              Card tem borda fina e nenhuma sombra. Só o que flutua tem sombra.
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">Ver detalhes</Button>
            </CardFooter>
          </Card>
        </Secao>

        <Secao id="dialogo" titulo="Diálogo e confirmação">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Abrir diálogo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrar na lista</DialogTitle>
                  <DialogDescription>Digite seu ID para participar do sorteio de hoje.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label htmlFor="dialogo-id">ID da conta</Label>
                  <Input id="dialogo-id" placeholder="Nome.1234" className="dado" autoComplete="off" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button>Participar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">Abrir confirmação</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sortear agora?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Depois de sortear, ninguém mais entra na lista.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction>Sortear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Secao>

        <Secao id="aviso" titulo="Aviso rápido">
          <BotaoCopiar />
        </Secao>

        <Secao id="esqueleto" titulo="Esqueleto">
          <div className="flex max-w-form items-center gap-4" aria-hidden="true">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </Secao>

        <Secao id="progresso" titulo="Progresso">
          <div className="grid max-w-form gap-6">
            <div className="grid gap-2">
              <p className="text-small text-muted-foreground">Tempo restante</p>
              <Progress value={70} aria-label="Tempo restante do sorteio" />
            </div>
            <div className="grid gap-2">
              <p className="text-small text-muted-foreground">Últimos segundos</p>
              <Progress value={20} tom="urgente" aria-label="Últimos segundos do sorteio" />
            </div>
          </div>
        </Secao>

        <Secao id="selecionado" titulo="Estado selecionado">
          <div className="grid max-w-form gap-6">
            <Tabs defaultValue="b">
              <TabsList aria-label="Aba ativa">
                <TabsTrigger value="a">Inativa</TabsTrigger>
                <TabsTrigger value="b">Ativa</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" aria-pressed="true">Selecionado</Button>
              <Button variant="ghost" aria-pressed="false">Não selecionado</Button>
            </div>
          </div>
        </Secao>

        <Secao id="rolagem" titulo="Rolagem e separador">
          <div className="grid max-w-form gap-6">
            <ScrollArea className="h-40 rounded-lg border border-border bg-surface">
              <ul className="p-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <li key={i}>
                    {i > 0 && <Separator />}
                    <p className="py-2 text-small text-foreground">
                      <span className="dado text-muted-foreground">{String(i + 1).padStart(2, "0")}</span> Participante {i + 1}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="flex h-6 items-center gap-4 text-small text-muted-foreground">
              Raids
              <Separator orientation="vertical" />
              Fractals
              <Separator orientation="vertical" />
              Dungeons
            </div>
          </div>
        </Secao>

        <Secao id="dica" titulo="Dica">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Copiar link">
                <CopyIcon strokeWidth={1.75} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar link</TooltipContent>
          </Tooltip>
        </Secao>
      </main>
      <Rodape />
    </>
  );
}
