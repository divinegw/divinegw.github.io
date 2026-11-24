---
name: design-system-divine
description: Sistema de design do site novo da guilda DIVINE (Guild Wars 2), em site-next/ (Next.js + Tailwind v4 + shadcn/ui). Só tema escuro, Inter + JetBrains Mono, ouro como destaque único. Use ao criar ou alterar qualquer página, componente ou estilo do site-next/. O site em Astro (site-astro/), enquanto estiver no ar, segue o site-astro/DESIGN-codex.md.
---

# Sistema DIVINE

Aprovado em 23/11/2026 (Etapa 1 do site novo). Código: `site-next/app/globals.css`. Vitrine com cada peça e estado: `site-next/app/design-system/page.tsx` (`npm run dev`, depois `/design-system`). O site em Astro, enquanto convive com o novo, segue o Codex DIVINE em `site-astro/DESIGN-codex.md`.

## Produto

O Manual da Guilda DIVINE: guias de Raids, Fractals, Dungeons e Endgame para o jogador chegar sabendo o que fazer, e as ferramentas da guilda (sorteio, galeria, novidades). Muita gente chega por um link do Discord, direto numa seção, no celular, logo antes de uma run. O sorteio roda durante a live.

## Clima

**Limpo e moderno.** A energia vem do conteúdo (as artes da guilda, o vídeo do boss, o relógio do sorteio, os nomes entrando), não de enfeite.

Nunca parecer: **cassino** (roleta piscando, dourado brega), **template de IA** (gradiente roxo, card com brilho, ícone em tudo) ou **site antigo de jogo** (pergaminho, borda ornamentada, fonte medieval).

Referências: Linear (tipografia firme, cinzas bem escalonados, borda fina), Vercel e Raycast (fundo quase preto, um destaque só), Twitch Predições (número grande, barra que esvazia), Discord (lista de membros).

## Marca

- **Logo:** na barra do topo, a logo monocromática branca com o nome DIVINE. No rodapé, o emblema colorido com o nome DIVINE em Inter; o emblema também é o favicon.
- **Fontes** (OFL, servidas pelo site, só o subconjunto latino): **Inter** em tudo; **JetBrains Mono** só em ID (`Nome.1234`), código, número pequeno e dado (nível, horário). Número grande (relógio) em Inter com algarismos de largura fixa: o zero da mono tem um ponto e parece "Ø" em tamanho grande.
- **Títulos em caixa normal** e Inter firme, sem condensada.
- **Ícones:** Lucide (`lucide-react`), traço 1,75. Um conjunto só.
- **Redes sociais e serviços usam o logo oficial da marca** (Discord, GitHub, YouTube, Twitch...), nunca um ícone genérico parecido (balão de conversa, globo). Desenhos do Simple Icons (CC0) em `site-next/components/divine/icones-marca.tsx`, na cor do texto, ao lado do nome da rede.

## Cor

Base quase preta, cinzas neutros e **um destaque só: o ouro da DIVINE**. Contraste medido sobre o fundo / o card.

| Papel (classe) | Valor | Contraste | Uso |
|---|---|---|---|
| `background` | `#0B0B0C` | — | fundo da página |
| `surface` (= `card`) | `#121214` | — | cards, painéis, sumário |
| `fill-1` / `fill-2` | `#18181B` / `#202024` | — | campo, botão secundário / pressionado, linha ativa |
| `border` | `#27272B` | — | borda de card |
| `border-hover` | `#3F3F46` | — | borda no hover (decorativa) |
| `border-field` (= `input`) | `#62626C` | 3,1 | borda de campo: "aqui se digita" |
| `divider` | `#1E1E22` | — | linha entre itens |
| `foreground` | `#EDEDED` | 16,8 / 16,0 | texto |
| `muted-foreground` | `#A1A1AA` | 7,7 / 7,3 | apoio, legenda |
| `placeholder` | `#82828B` | 4,65 no campo · 4,9 no card | exemplo no campo vazio (mais apagado que o apoio, que dá 6,9) |
| `disabled` | `#52525B` | 2,5 | peça desativada (isenta) |
| `tint-hover` / `-selected` / `-pressed` | branco 5% / 8% / 11% | — | peças sem borda |
| **`primary`** | **`#E2B254`** | 10,1 | botão principal, item ativo, barra do relógio |
| `primary-hover` / `-pressed` | `#EBC274` / `#C99A3C` | — | estados do botão principal |
| `primary-foreground` | `#0B0B0C` | 10,1 | texto sobre o ouro |
| `primary-text` | `#EEC066` | 11,6 / 11,0 | ouro como texto: link, número do capítulo, "Você" |
| `primary-bg` / `-border` | ouro 10% / 32% | — | área tingida: selecionado, vencedor |
| `ring` | `#EEC066` | 11,6 | anel de foco do teclado |
| `urgente` + `-bg` | `#FF8A3D` | 8,4 / 8,0 | só relógio e prazo (últimos 10 s) |
| `aberto` + `-bg` | `#4ADE80` | 11,3 / 10,7 | só a etiqueta "Aberto" |
| `destructive` + `-bg` + `-border` | `#F87171` | 7,1 / 6,8 | erro, "não confirmou" |
| `overlay` | preto 70% | — | atrás de diálogo |

**Cores do jogo**, só em ícone, ponto e etiqueta, nunca em botão nem em texto corrido, e sempre com o nome escrito ao lado:
- Profissões (`prof-guardian` … `prof-necromancer`): 6,5 a 13,6 sobre o fundo; fundo da etiqueta com a cor a 16%.
- Raridades (`rare`, `exotic`, `ascended`, `legendary`): 5,0 a 13,3; só no ícone do prêmio.
- O Warrior e o Rare são amarelos perto do ouro: por isso o nome ao lado é obrigatório.

## Tipo

| Classe | Tamanho / entrelinha | Uso |
|---|---|---|
| `text-caption` | 12 / 16 | etiqueta, "há 2 min"; `.rotulo` = caixa alta +0,06em |
| `text-small` | 14 / 20 | apoio, lista, sumário |
| `text-body` | 16 / 24 | interface, campo (16: o iPhone não dá zoom) |
| `text-prose` | 17 / 28 | texto corrido dos guias, em `max-w-prose` (68 caracteres) |
| `text-lead` | 18 / 28 | abertura de guia e de capítulo |
| `text-title` | 22 / 28 | título de card (h3), nome do prêmio |
| `text-heading` | 28 → 36 / 1,1 | capítulo do guia (h2) |
| `text-page` | 36 → 56 / 1,05 | nome do guia, título de página (h1) |
| `text-display` | 40 → 72 / 1 | relógio, nome do vencedor |

Pesos: 400 texto, 500 rótulo, 600 título e botão, 700 h1 e display. A Inter usa as variantes `cv11` ("a" de um andar) e `ss01` (algarismos abertos), herdadas do protótipo aprovado. Títulos grandes com `tracking-titulo` (-0,02em). `.dado` liga a JetBrains Mono com algarismos de largura fixa.

## Espaço, cantos, sombra, tamanhos

- **Espaço:** base 4 (a escala do Tailwind). Usados: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Cantos:** `rounded-sm` 6 (etiqueta) · `rounded-md` 10 (botão, campo, linha) · `rounded-lg` 14 (card) · `rounded-xl` 20 (diálogo, folha) · `rounded-full`.
- **Sombra, só no que flutua:** `shadow-float` (menu, popover, aviso rápido) e `shadow-strong` (diálogo). Card não tem sombra, tem borda.
- **Controles:** `h-control-sm` 36 · **`h-control` 44** (toque mínimo) · `h-control-lg` 52. Ícone 16 / 20 / 28.

## Larguras

| Classe | Valor | Uso |
|---|---|---|
| margem lateral | 16 no celular · 32 a partir de 900 px | página |
| `max-w-page` | 1120 | home, sorteio, galeria |
| `max-w-prose` | 68ch | texto dos guias |
| `max-w-toc` | 240 | sumário "Neste guia" (computador) |
| `max-w-form` | 440 | formulário e resultado do sorteio |
| `max-w-list` | 360 | lista de participantes (computador) |

Celular primeiro: 390 px é a tela principal; computador a partir de 900 px.

## Movimento

120 ms (hover, pressionado; o padrão das transições) · 200 ms (nome novo entrando, troca de estado) · 360 ms (vencedor, diálogo abrindo). Uma curva só: `ease-divine`. Nada em loop além do giro de carregando. Com "reduzir movimento", tudo fica instantâneo e o vencedor aparece direto.

## Regras de interação (valem para todo componente)

| Estado | Com borda (card, campo, secundário) | Sem borda (fantasma, item de menu, linha) | Principal (ouro) |
|---|---|---|---|
| hover | só a borda muda de tom, ficando mais visível (`border-hover`; campo: `border-field-hover`) | véu `tint-hover` | clareia (`primary-hover`) |
| pressionado | fundo `fill-2` | véu `tint-pressed` | escurece (`primary-pressed`) e encolhe 2% |
| foco | só do teclado: anel de 2 px `ring`, afastado 2 px; campo: borda `ring` + 1 px | igual | igual |
| desativado | fundo `fill-1`, texto `disabled`, sem opacidade, cursor proibido | texto `disabled` | vira cinza como o com borda |
| carregando | troca o ícone por um giro; mesma largura e altura; clique bloqueado (também em link) | igual | igual |
| selecionado | `primary-bg` + borda `primary-border`; o peso da letra não muda | véu `tint-selected` | — |

E mais: no máximo um botão principal por tela (por isso o "Entrar no Discord" do rodapé é secundário); itens de lista e menu com 4 px entre si; o esqueleto tem o tamanho do que vai entrar; aviso que muda sozinho é anunciado ao leitor de tela só quando muda de estado (não o relógio a cada segundo).

## Como a gente escreve

Voz **direta e humana**, dentro da `VOZ.md` (Parceiro de guilda): frase curta, verbo na frente, "você", quase sem exclamação. Botão diz a ação ("Participar", "Copiar link"); erro diz o que fazer ("Confira o ponto e os 4 números."). Nomes do jogo em inglês; datas 23/11, horas 21h30.

## Componentes

Os do shadcn ficam em `site-next/components/ui/` e se ajustam no próprio arquivo; as peças próprias, em `site-next/components/divine/`. Cada um aparece na vitrine com a matriz de estados.

| Componente | Onde | Variantes | Situação |
|---|---|---|---|
| Botão | `ui/button.tsx` | principal, secundário, fantasma, link, perigo · sm, padrão, lg, ícone | Etapa 1 |
| Campo, rótulo, área de texto | `ui/input.tsx`, `ui/label.tsx`, `ui/textarea.tsx` | normal, erro, desativado | Etapa 1 |
| Abas | `ui/tabs.tsx` | trilho `fill-1` com 6 px de folga e cantos concêntricos (trilho 14, aba 8); ativa com véu `tint-selected`, sem borda; quando não cabem numa linha, dividem a largura por igual (nunca uma aba sozinha) | Etapa 1 |
| Card | `ui/card.tsx` | título em h3 (prop `as` para outro nível) | Etapa 1 |
| Campo com rótulo, ajuda e erro | `divine/Campo.tsx` | liga id, `aria-describedby` e `aria-invalid`; erro com `role="alert"` | Etapa 1 |
| Etiqueta | `ui/badge.tsx` | neutra, ouro, aberto, urgente, perigo | Etapa 1 |
| Diálogo, confirmação, folha | `ui/dialog.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx` | — | Etapa 1 |
| Aviso rápido | `ui/sonner.tsx` | — | Etapa 1 |
| Esqueleto, barra de progresso, separador, dica, rolagem | `ui/skeleton.tsx`, `ui/progress.tsx`, `ui/separator.tsx`, `ui/tooltip.tsx`, `ui/scroll-area.tsx` | progresso: `tom` ouro ou urgente (últimos 10 s) | Etapa 1 |
| Faixa de arte do topo (TopoArte) | `divine/TopoArte.tsx` | arte da guilda de ponta a ponta, 180 a 260 px, degradê até o fundo; o h1 da página fica sobre a parte de baixo (como no site de hoje). Artes em `public/assets/artes/<nome>-<640|1024|1600>.webp` | Etapa 3 |
| Barra do topo, rodapé, logo | `divine/` | no computador, "Guias" leva à lista na página inicial; os 6 guias ficam no menu do celular e no rodapé | Etapa 1 |
| Relógio, lista de pessoas, faixa de aviso, vazio, barra de quem organiza | `divine/` | — | Etapa 2 (sorteio) |
| Busca (Ctrl+K), tabela, accordion | `ui/` | — | Etapas 4 e 5 |
