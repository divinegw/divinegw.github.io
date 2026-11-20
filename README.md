<p align="center">
  <img src="site-astro/public/readme/banner.jpg" alt="Arte de Guild Wars 2: personagens descansando diante da lareira" width="100%">
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site-astro/public/readme/logo-escuro.png">
    <img src="site-astro/public/readme/logo-claro.png" alt="Brasão da guilda DIVINE" width="110">
  </picture>
</p>

<h1 align="center">Guild DIVINE</h1>

<p align="center">
  <b>O manual da guilda para o conteúdo em grupo de Guild Wars 2.</b><br>
  Raids, Fractals e Dungeons explicados em português, com vídeo de cada boss.
</p>

<p align="center">
  <a href="https://divinegw.github.io/"><img src="https://img.shields.io/badge/Abrir%20o%20site-0a7487?style=for-the-badge" alt="Abrir o site"></a>
  <a href="https://discord.gg/7fHMRW2xvt"><img src="https://img.shields.io/badge/Discord%20da%20guilda-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Entrar no Discord da guilda"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/Quero%20ajudar-8a5f0e?style=for-the-badge" alt="Como contribuir com o site"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white" alt="Astro 7">
  <img src="https://img.shields.io/badge/MDX-guias-1B1F24?logo=mdx&logoColor=white" alt="Guias em MDX">
  <img src="https://img.shields.io/badge/Playwright-testes-2EAD33?logo=playwright&logoColor=white" alt="Playwright para os testes">
  <img src="https://img.shields.io/badge/WCAG-contraste%20AA%20testado-44546a" alt="Contraste WCAG AA testado">
  <img src="https://img.shields.io/badge/idioma-PT--BR-44546a" alt="Português do Brasil">
</p>

---

## Por onde começar

Nunca fez conteúdo em grupo? Comece pelo **Endgame**. Ele ensina o que os outros guias já dão por sabido, como boons, roles e builds. Depois escolha o modo de jogo que você quer aprender.

| | Guia | O que você aprende |
|:-:|---|---|
| <img src="site-astro/public/readme/endgame.jpg" width="200" alt=""> | **[Endgame](https://divinegw.github.io/guias/endgame.html)**<br><sub>comece por aqui</sub> | Tipos de dano, boons e conditions, Defiance Bar, atributos, roles, onde achar builds, Golem de treino, ArcDPS e como entrar num squad. |
| <img src="site-astro/public/readme/raids.jpg" width="200" alt=""> | **[Raids](https://divinegw.github.io/guias/raids.html)** | As 8 wings e os Raid Encounters, recompensas, Emboldened, Challenge Mode e Legendary Mode, com vídeo de cada boss e um resumo do que muda no CM. |
| <img src="site-astro/public/readme/fractals.jpg" width="200" alt=""> | **[Fractals](https://divinegw.github.io/guias/fractals.html)** | Tiers e escalas, Agony Resistance, instabilidades, dailies, Ad Infinitum, títulos e o Challenge Mode das 7 Fractals que têm um. |
| <img src="site-astro/public/readme/dungeons.jpg" width="200" alt=""> | **[Dungeons](https://divinegw.github.io/guias/dungeons.html)** | As 8 dungeons clássicas de Tyria: onde fica a entrada, recompensas, achievements e vídeo de cada path. |
| <img src="site-astro/public/readme/recursos-uteis.jpg" width="200" alt=""> | **[Recursos Úteis](https://divinegw.github.io/guias/recursos-uteis.html)** | 58 sites e ferramentas da comunidade (builds, conta, logs, gold, crafting, mapas, WvW e homestead), cada um com o que faz. |
| <img src="site-astro/public/readme/cursores.jpg" width="200" alt=""> | **[Divine Prisma](https://divinegw.github.io/guias/cursores.html)** | Cursores prismáticos feitos pela guilda: 21 desenhos, 7 cores e 5 tamanhos, com instalador para o Nexus. |

## Para baixar

- **[Configuração do Zyanore para o ArcDPS](https://divinegw.github.io/downloads/arcdps-zyanore.zip)**: o perfil de janelas de DPS do Zyanore, com a fonte e um passo a passo. O guia de [Endgame](https://divinegw.github.io/guias/endgame.html#arcdps) explica como instalar.
- **[Divine Prisma](https://github.com/divinegw/divine-prisma)**: os cursores, com instalador para o Nexus e versão `.cur` para o YoloMouse.
- **[Wallpapers](https://divinegw.github.io/galeria.html)**: as artes dos nossos guias em alta resolução.

## Quer ajudar?

Achou um erro, um boss mudou ou falta um vídeo? Dá para corrigir direto aqui. O [guia de contribuição](CONTRIBUTING.md) mostra o caminho mais curto, do texto de um guia a um componente novo. Se preferir só avisar, [abra uma issue](https://github.com/divinegw/divinegw.github.io/issues/new) ou chame a gente no [Discord](https://discord.gg/7fHMRW2xvt).

## Como o site é feito

A gente escreve os guias em MDX, com componentes próprios para boss, wing, dungeon e avisos, e o Astro transforma tudo em HTML estático. Quando você abre um pull request, o GitHub Actions gera o site e roda os testes num navegador de verdade (Playwright com Chrome). Depois do merge na `main`, o mesmo fluxo roda de novo e publica no GitHub Pages. Se a build ou um teste falhar, nada vai para o ar.

```mermaid
flowchart LR
  A["Guias em MDX<br/>+ componentes Astro"] --> B["astro build<br/>HTML estático + imagens otimizadas"]
  B --> C["QA com Playwright<br/>contraste, layout, sumário"]
  C -->|pull request| D["Resultado no PR"]
  C -->|merge na main| E["GitHub Pages"]
```

### O que os testes conferem

Cada página é testada em **4 combinações**: tema claro e escuro, computador e celular.

| Teste | O que ele pega |
|---|---|
| Contraste | Todo texto da página medido contra o fundo real, pela regra WCAG. |
| Layout | Rolagem para o lado, botões pequenos demais para o toque, títulos fora de ordem. |
| Imagens e erros | Imagem quebrada, banner no tamanho errado, erro no console do navegador. |
| Sumário | Clica em cada item de cada guia, com a rolagem suave ligada, e confere se o título parou logo abaixo do cabeçalho. |
| Impressão | Página em branco ou quase vazia ao imprimir em A4. |

### Por baixo do capô

- O Astro gera cada arte em várias larguras, em WebP, e o navegador baixa só a que cabe na tela.
- As abas seguem o padrão WAI-ARIA e funcionam pelo teclado (setas, Home e End). Toda imagem tem uma descrição do que mostra.
- Os endereços dos guias (`/guias/<guia>.html`) e as âncoras das seções não mudam. A guilda compartilha esses links no Discord, e link quebrado lá ninguém conserta. Os links antigos de PDF (`/pdfs/<guia>.pdf`) abrem um PDF de uma página com o link do guia.

## Créditos

- **Texto dos guias:** membros da guilda DIVINE. O autor de cada guia aparece no topo dele.
- **Ilustrações:** feitas pela guilda a partir de artes, capturas e telas de carregamento de Guild Wars 2 e de prints tirados no jogo pela guilda e por jogadores da comunidade, mudando só o estilo.
- **Guild Wars 2:** nomes, artes e ícones do jogo pertencem à ArenaNet e são usados conforme os [Content Terms of Use](https://www.arena.net/en/legal/content-terms-of-use). Este é um site de fã, sem fins comerciais e sem vínculo com a ArenaNet.
- **Ícones e fontes:** [Lucide](https://lucide.dev) (ISC), Mona Sans e Geist Mono (SIL Open Font License, com as licenças em `site-astro/public/assets/fonts/`).

A lista completa, com cada imagem da Guild Wars 2 Wiki, cada canal de vídeo e cada licença, está na página de [Créditos](https://divinegw.github.io/creditos.html).
