# Relatório: site inteiro em Astro puro (mesmo design do site atual)

16/11/2026. Pasta `site-astro/`. Nada publicado; `divine-gw2-manual/`, `build_site.ps1`, `_build/` e `prototipo-starlight/` não foram alterados.
Versões fixas: astro 7.4.12, @astrojs/mdx 8.1.6, @astrojs/markdown-remark 7.3.9, sharp 0.35.5, lucide-static 0.460.0, playwright-core 1.48.2 (Edge).
Endereço: `site: 'https://divinegw.github.io'`, sem `base`.

Fase 1 (aprovada): guia de Fractals. Fase 2 (este relatório): Raids, Dungeons, Endgame, Recursos Úteis, página inicial e 404.

## Resultado

- **Visual**: igual ao atual nas 6 páginas, em desktop (1440 px) e celular (375 px), claro e escuro. As únicas diferenças são espaçamentos de 2 a 4 px dentro dos cards (o novo usa 12 px uniformes onde o atual tinha `margin-top` solto no HTML).
- **URLs e âncoras**: `/`, `/guias/<guia>.html` e `/pdfs/<guia>.pdf` iguais. Todas as âncoras do sumário atual existem no novo com o mesmo nome (`#spirit-vale`, `#caudecus-s-manor`, `#boon-table`, `#recomendados`...). Links do Discord continuam valendo.
- **Texto**: palavra por palavra igual em todas as páginas (topo, conteúdo, sumário e rodapé). A comparação só acusa os "01, 02..." dos capítulos, que agora vêm do CSS.
- **Sumário "Neste guia"**: mesmos itens e mesmos textos. Exceções: Fractals ganhou "Tiers e escalas" (fase 1) e, em Recursos Úteis, "Recomendados para favoritos" passou do fim para o começo da lista, na ordem da página (ver correções).
- **Como foi feita a conversão**: um conversor leu o HTML gerado hoje de cada guia e escreveu o `.mdx`, copiando imagens e ícones. Por isso o texto sai idêntico. Daqui em diante, o texto vive nos `.mdx`: editar no fluxo antigo (`Raids.html`, `fixes.ps1`...) não chega mais ao site novo.

| Página | Texto | Sumário | Arquivo |
|---|---|---|---|
| Página inicial | igual (30 + 150 + 9 palavras) | não tem | `src/pages/index.astro` + `INICIO` em `src/site.ts` |
| Raids | igual (1.254 palavras) | 22 itens, iguais | `src/content/guias/raids.mdx` |
| Fractals | igual (1.269) | 10 itens (+ Tiers e escalas) | `src/content/guias/fractals.mdx` |
| Dungeons | igual (861) | 13 itens, iguais | `src/content/guias/dungeons.mdx` |
| Endgame | igual (3.734) | 21 itens, iguais | `src/content/guias/endgame.mdx` |
| Recursos Úteis | igual (914) | 12 itens, ordem corrigida | `src/content/guias/recursos-uteis.mdx` |
| 404 | página nova (o atual não tem) | | `src/pages/404.astro` |

## Capturas (`comparacao/<página>/`)

Uma pasta por página (`index`, `raids`, `fractals`, `dungeons`, `endgame`, `recursos-uteis`), atual à esquerda e novo à direita:

| Arquivo | O que mostra |
|---|---|
| `lado-a-lado-desktop-claro.png`, `...-escuro.png` | topo, 1440 px |
| `lado-a-lado-celular-claro.png`, `...-escuro.png` | topo, 375 px |
| `lado-a-lado-*-pagina.webp` (ou `.jpg`, quando alta demais para WebP) | página inteira, reduzida |

Em `fractals/` também estão as capturas separadas de cada site, em tamanho real (fase 1).

## QA do `_build` contra o build novo

O Astro gera caminhos absolutos (`/assets/...`), que não abrem por `file://`. Rodei cópias dos scripts apontando para um servidor local, com todas as páginas, nos dois sites:

| Teste | Atual | Novo |
|---|---|---|
| `qa_audit.js` (contraste WCAG, rolagem horizontal, alvos de toque, saltos de título, imagens quebradas, erros, landmarks, proporção dos banners), 6 páginas × 4 combinações | tudo ok | tudo ok, mesmas proporções |
| `qa_toc.js` (clique em cada item, fim da página, volta ao topo) | 77 links, 0 falhas | 78 links, 0 falhas |
| `qa_pdf.js` | 73 págs, nenhuma vazia | 71 págs, nenhuma vazia |

PDFs (A4, mesmo script `npm run pdf`):

| Guia | Atual | Novo |
|---|---|---|
| Raids | 16 págs, 1.920 KB | 15 págs, 1.647 KB |
| Fractals | 9 págs, 906 KB | 9 págs, 746 KB |
| Dungeons | 14 págs, 1.204 KB | 14 págs, 1.056 KB |
| Endgame | 23 págs, 1.461 KB | 22 págs, 1.201 KB |
| Recursos Úteis | 11 págs, 318 KB | 11 págs, 284 KB |

Raids e Endgame ficaram com uma página a menos porque os cards ficaram alguns pixels mais baixos; o conteúdo é o mesmo.

## Medições (servidor local sem compressão)

| Página | Atual (tudo na abertura) | Novo, abertura | Novo, página inteira rolada |
|---|---|---|---|
| Página inicial | 14 req., 961 KB | 18 req., 569 KB | igual à abertura |
| Raids | 31 req., 1.581 KB | 15 req., 340 KB | 46 req., 874 KB |
| Fractals | 17 req., 718 KB | 14 req., 315 KB | 36 req., 503 KB |
| Dungeons | 21 req., 1.077 KB | 14 req., 332 KB | 28 req., 635 KB |
| Endgame | 16 req., 967 KB | 18 req., 404 KB | 58 req., 532 KB |
| Recursos Úteis | 10 req., 251 KB | 11 req., 205 KB | igual à abertura |

O atual baixa tudo na abertura. O novo baixa o que está na tela e o resto ao rolar; mesmo com a página inteira rolada, pesa menos. Há mais requisições porque os ícones viraram arquivos de 1 a 2 KB em vez de virem embutidos no HTML (o HTML do Endgame caiu de 243 KB para 128 KB, 27 KB com gzip).

Lighthouse 13.6 (Edge headless), atual → **novo**:

Celular:

| Página | Desempenho | Acessibilidade | LCP | CLS |
|---|---|---|---|---|
| Página inicial | 79 → **95** | 100 → **100** | 5,9 s → **2,9 s** | 0,008 → **0,001** |
| Raids | 77 → **97** | 96 → **100** | 6,3 s → **2,6 s** | 0,011 → **0,002** |
| Fractals | 84 → **97** | 96 → **100** | 4,5 s → **2,6 s** | 0,032 → **0,002** |
| Dungeons | 78 → **96** | 96 → **100** | 6,0 s → **2,6 s** | 0,034 → **0,003** |
| Endgame | 77 → **95** | 96 → **100** | 5,6 s → **2,9 s** | 0 → **0,003** |
| Recursos Úteis | 93 → **99** | 95 → **100** | 2,4 s → **2,1 s** | 0,011 → **0,002** |

Desktop:

| Página | Desempenho | Acessibilidade | LCP | CLS |
|---|---|---|---|---|
| Página inicial | 98 → **100** | 100 → **100** | 1,1 s → **0,8 s** | 0,005 → **0** |
| Raids | 98 → **100** | 100 → **100** | 1,1 s → **0,7 s** | 0,006 → **0,001** |
| Fractals | 99 → **100** | 100 → **100** | 0,9 s → **0,6 s** | 0,019 → **0** |
| Dungeons | 98 → **100** | 100 → **100** | 1,1 s → **0,6 s** | 0,008 → **0** |
| Endgame | 98 → **100** | 100 → **100** | 1,1 s → **0,8 s** | 0,008 → **0** |
| Recursos Úteis | 100 → **100** | 100 → **100** | 0,5 s → **0,5 s** | 0,007 → **0** |

## O que foi corrigido em relação ao site atual

Fase 1 (Fractals):
1. Sumário esquecia "Tiers e escalas". Agora o sumário sai dos próprios cards e capítulos.
2. Item "Agony e Agony Resistance" do sumário virou "Agony", o título real do card.
3. Celular: link do emblema e botão "Baixar PDF" sem nome acessível: ganharam `aria-label`.
4. Imagens sem carregamento preguiçoso: agora só as da tela baixam na abertura.
5. Fotos maiores que o necessário no celular: versões de 380, 760, 1140 e 1520 px.
6. Emblema do outro tema baixado à toa: não baixa mais.
7. "Pular para o conteúdo" adicionado (aparece só com Tab).
8. Meta description genérica: agora é a frase do guia, com `canonical`, `og:` e `theme-color`.
9. Script de fallback de imagem removido: todas as imagens são locais.

Fase 2:

10. **Recursos Úteis: "Recomendados para favoritos" era o último item do sumário, mas é o primeiro bloco da página.** Ao rolar até o fim, o sumário marcava "Recomendados" em vez de "Diretório geral" (`qa_toc.js` mostra isso no atual). Agora o item vem primeiro, na ordem da página.
11. **Endgame: 8 observações em letra menor usavam uma cor que não existe** (`var(--texto-soft)`; o token é `--text-soft`) e saíam na cor do texto normal. Agora saem no cinza suave previsto (`<Obs>`).
12. **Página inicial: os 5 botões "Baixar PDF" tinham o mesmo nome** para leitor de tela; agora dizem de qual guia é o PDF. Também ganhou "pular para o conteúdo".
13. **Página 404**: o atual não tem (cai na página padrão do GitHub). A nova segue o visual do site e leva de volta à página inicial.
14. **Cards fora do sumário ganharam âncora** (ex.: `#rotacao`, `#kill-proof-kp`): podem ser linkados no Discord, sem mudar o sumário.
15. O mapa de Dungeons (940 px, exibido a 520 px) baixa já no tamanho exibido.

## O que muda para quem edita

- Cada guia é um `src/content/guias/<guia>.mdx` em Markdown, com blocos `<Card>`, `<Item>`, `<Nota>`, `<Obs>`, `<Emoji>`, `<Wing>`/`<Boss>`, `<Dungeon>`/`<Info>`/`<Path>`, `<Destaque>`, `<Favoritos>`/`<Favorito>` e `<Recurso>`. Exemplos no `README.md`.
- Topo do guia no frontmatter; página inicial e data "Atualizado em" em `src/site.ts`.
- Acabam `fixes.ps1`, `adicoes.ps1`, `postprocess.mjs`, `site.json` e `icons.json`: as correções já estão no texto e as imagens e ícones ficam no repositório (`src/assets/`), sem baixar nada de imgur, Discord ou wiki na build.
- Build do site inteiro em ~4 s (`npm run build`) e dos 5 PDFs em ~40 s (`npm run pdf`), sem PowerShell.

## Publicação (fase 3, 16/11/2026)

- Banners novos na página inicial, em Raids e em Recursos Úteis (a arte de Raids também aparece no card da página inicial).
- `publicar.ps1` agora gera o site em `site-astro/`, os PDFs e publica `site-astro/dist/` (`npm run publicar`, que só reenvia arquivos que mudaram e espera quando o GitHub limita os envios). Publicado no commit `140c7cb` de `divinegw/divinegw.github.io`; o commit espelha a pasta, então os arquivos do site antigo saíram do repositório. O `README.md` do repositório vem de `public/README.md`.
- Os testes do `_build` foram trazidos para `scripts/qa/` (`npm run qa`).
- O site e o fluxo antigos (`divine-gw2-manual/`, `_build/`, `build_site.ps1`, os 5 HTMLs originais, `COMO_PUBLICAR.html`) e o `prototipo-starlight/` foram para a Lixeira do Windows. `COMO_EDITAR.md`, `CLAUDE.md`, `DESIGN.md` e os agentes em `.claude/agents/` descrevem o fluxo novo.
- O build continua precisando de servidor para abrir no computador (`npm run dev` ou `npm run preview`); o `.github/workflows/deploy.yml` segue só como exemplo, inativo.
