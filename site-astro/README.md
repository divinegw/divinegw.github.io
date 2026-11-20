# Manual DIVINE em Astro

O site da guilda, gerado com Astro a partir de Markdown/MDX.
Mesmas URLs (`/`, `/guias/<guia>.html`, `/pdfs/<guia>.pdf`) e mesmas âncoras (`#secao-1`, `#spirit-vale`...).

## Rodar

```powershell
npm ci
npm run dev       # abre em http://localhost:4321/ e atualiza ao salvar
npm run build     # gera dist/ (site inteiro)
npm run pdf       # só sob demanda: gera os PDFs completos em dist/pdfs/<guia>.pdf (precisa do build antes)
npm run pdf-aviso # grava em dist/pdfs/ um aviso de uma página (link do guia) onde não houver PDF completo
npm run preview   # serve o dist/ em http://localhost:4321/
npm run qa        # testes: contraste, sumário, imagens, erros (e PDFs em branco, se houver PDFs completos)
```

Navegador dos testes e dos PDFs: Edge no Windows, Chrome no Linux e no macOS (`PDF_CHANNEL` troca). Quem publica é o GitHub Actions (`../.github/workflows/site.yml`); o `../publicar.ps1` testa aqui e faz o push.

## Onde fica cada coisa

| Quero mudar | Arquivo |
|---|---|
| Texto de um guia | `src/content/guias/<guia>.mdx` |
| Título, frase, arte, foco da arte (`foco: '50% 8%'`, onde está o personagem) e autor ou autores (`autor: 'Raishin'` ou `autor: ['Raishin', 'Zyanore']`, quem escreveu a base primeiro) do topo | frontmatter (entre os `---`) no início do `.mdx` |
| Página inicial (textos e tags dos cards) | `INICIO` em `src/site.ts` |
| Nome do site e data "Atualizado em" | `SITE` em `src/site.ts` |
| Fotos e prints | `src/assets/guias/<guia>/` |
| Ícones dos cards, linhas e boons | `src/assets/icones/` |
| Cores, fontes, espaçamentos, raios, movimento | `src/styles/tokens.css` (tokens do `DESIGN.md`; vitrine em `/design-system.html`) |
| Estilo dos blocos | `src/styles/divine.css`; página inicial em `src/styles/inicio.css` (só tokens, nada de valor solto) |
| Estrutura da página (topo, sumário, rodapé) | `src/layouts/Guia.astro` |

Guia novo: crie `src/content/guias/<slug>.mdx`. A página `/guias/<slug>.html` e o sumário saem sozinhos.

## Como escrever um guia

```mdx
## Título do capítulo

Uma frase sobre o capítulo (vira o subtítulo cinza).

<Card icone="agony">

### Título do card

Texto em **Markdown**. Links externos abrem em nova aba sozinhos.

![Descrição da imagem](../../assets/guias/fractals/arquivo.jpg)
![Arte decorativa em 2:1](../../assets/guias/fractals/arquivo.jpg "banner")

<Item icone="shield">**Termo**: explicação curta, numa linha só.</Item>
<Aviso tipo="atencao">Texto do aviso, numa linha só.</Aviso>
<Obs>Observação em letra menor.</Obs>

</Card>
```

- `##` vira capítulo numerado (01, 02...). Cada `<Card>` com `###` vira item do "Neste guia".
- `icone` é o nome de um arquivo em `src/assets/icones/` (sem extensão) ou de um ícone de [lucide.dev](https://lucide.dev/icons).
- Deixe uma linha em branco depois de `<Card ...>` e antes de `</Card>`.
- Não use `{` nem `<` soltos no texto (o MDX entende como código). Se precisar, escreva `\{` ou `&lt;`.

### Sumário "Neste guia"

- O texto do item é o título do card. Para mostrar outro texto: `<Card icone="x" sumario="Envoy Armor">`.
- Para manter um endereço antigo: `<Card icone="x" id="boon-table">` (o link `#boon-table` continua valendo).
- Card que não deve aparecer no sumário: `<Card icone="x" semSumario>`.
- Capítulo ou `####` com outro texto no sumário: no frontmatter, `sumario:` com `id: texto`
  (ex.: `secao-2: 'Raid Wings (1 a 8)'`). Um `####` só entra no sumário se estiver nessa lista.

### Blocos específicos

```mdx
**<Efeito nome="might" />**                 boon/condition no meio do texto (ícone + nome + balão)

<Wing nome="SPIRIT VALE" num="WING 1" arte="raids/spirit-vale.jpg" alt="Spirit Vale" sumario="Wing 1: Spirit Vale">
<Boss nome="Vale Guardian" video="https://www.youtube.com/..." guia="https://snowcrows.com/..." wiki="https://wiki.guildwars2.com/..."/>
</Wing>

<Boss nome="Samarog" video="..." cm="..." wiki="..." cmVida="30 → 40 mi" cmLimite="10 min">   resumo do CM (seta no fim da linha)

- Um tópico por mudança: o que acontece e o que fazer.
- cmVida e cmLimite são opcionais (etiquetas no topo do painel).

> **Dica:** vira o destaque dourado.

Parágrafo solto no fim vira nota (guia em texto, vídeo do Legendary Mode).

</Boss>

<Lista>                                      linhas soltas dentro de um card (ex.: todas as Fractals)
<Boss nome="Nightmare" video="..." cm="..." wiki="..."/>
</Lista>

<Dungeon nome="ASCALONIAN CATACOMBS" niveis="Story 30, Explo 35" arte="dungeons/ascalonian-catacombs.jpg" alt="Ascalonian Catacombs">
<Info>**Local:** Plains of Ashford</Info>
<Path nome="Path 1" video="https://www.youtube.com/..."/>
</Dungeon>

<Favoritos>
<Favorito nome="GW2 Wiki" url="https://wiki.guildwars2.com/"/>
</Favoritos>
<Recurso nome="GW2 Wiki" url="https://wiki.guildwars2.com/" novo>Descrição do site.</Recurso>
```

### Componentes do design system (Fase 2; exemplos e estados em `/design-system.html`)

```mdx
<Aviso tipo="dica">Texto.</Aviso>                       dica · atencao · importante
<Aviso tipo="atencao" titulo="Reset diário">Texto.</Aviso>

<Tabela legenda="Tiers das Fractals" legendaOculta>      deixe linhas em branco em volta da tabela

| Tier | Níveis | AR |
|---|---|--:|
| 1 (Initiate) | 1 a 25 | 17 |

</Tabela>

quem entra em <Termo def="Estado em que o personagem cai...">downed</Termo>   termo com balão de definição

<CardImagem imagem="fractals/ad-infinitum.jpg" alt="Ad Infinitum">   card com a arte 2:1 no topo

### Título do card

</CardImagem>

<Chip>4 Tiers</Chip>  <Selo tipo="novo" />  <Botao variante="primario" href="...">Abrir guia</Botao>
```

O botão "copiar link" aparece sozinho ao lado de cada `##` e de cada `###` de card.

### Componentes de guia (Fase 3; exemplos em `/design-system.html`, capítulos 20 a 28)

```mdx
<Encontro nome="Vale Guardian" arte="raids/spirit-vale.jpg" alt="Spirit Vale" onde={['Wing 1', 'Boss 1']}
  modos={['normal']} mecanicas={['Tank', 'Split em 3']} video="https://..." guia="https://..." wiki="https://...">

Resumo do encontro.

</Encontro>                                              card de boss (modos: normal · cm · lm)

<Abas rotulo="Modos de dificuldade">
<Aba rotulo="Normal Mode" icone="normal-mode">Texto.</Aba>
<Aba rotulo="Challenge Mode" icone="challenge-mode">Texto.</Aba>
</Abas>                                                  não ponha Abas dentro de Abas

<Funcao papel="healer" boon="quickness" classe="guardian" />   papel: dps · healer · tank · kiter
um provedor de <Efeito nome="quickness" />               boon/condition com ícone e balão (lista em src/lib/efeitos.ts)
<Efeito nome="might" soIcone semBalao />                 só o ícone, sem balão: sequências de ícones (nome no alt e no title)

<LinhaDoTempo rotulo="Raid Wings em ordem">              direcao="horizontal" para até 4 marcos
<Marco rotulo="Wing 1" nome="Spirit Vale" href="#spirit-vale" detalhes={['Heart of Thorns', '4 encontros']} />
</LinhaDoTempo>

<Banner imagem="raids/portal-de-raids-no-aerodrome.jpg" alt="..." legenda="..." />   2:1, revela na rolagem
<Mapa legenda="Boon Corrupt" de="Boon" para="Condition" pares={[['aegis', 'burning'], ['alacrity', 'chilled']]} />
```

`Recurso` e `Dungeon` continuam com o mesmo jeito de escrever; na Fase 3 o nome deles virou título (h3).

Listas numeradas (`<ol class="steps">`) ficam em HTML dentro do `.mdx` (exemplo no `endgame.mdx`). Tabela: `<Tabela>`; "A vira B": `<Mapa>`. Nota, Destaque, Emoji e `<table class="map">` saíram na Fase 5. Onde cada componente entra: `DESIGN.md` › Aplicação nos guias.
Em Recursos Úteis, `quebra: false` no frontmatter faz os capítulos seguirem na mesma página do PDF.

## Guia novo

1. Crie `src/content/guias/<slug>.mdx` (frontmatter: `title`, `description`, `arte`, `foco`, `autor`).
2. Acrescente o guia em `GUIAS` (`src/site.ts`), na posição da ordem de leitura. Com `slide: false` ele não entra no slide do topo da home (continua em "Mais guias", no rodapé, na busca e no "Próximo guia").
3. Acrescente o slug nas listas de `scripts/qa/qa_audit.cjs` e `scripts/qa/qa_toc.cjs`.
