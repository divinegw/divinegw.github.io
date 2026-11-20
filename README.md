<div align="center">

<a href="https://divinegw.github.io/"><img src="site-astro/public/readme/banner.jpg" alt="Arte de Guild Wars 2: personagens descansando diante da lareira" width="100%"></a>

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="site-astro/public/readme/logo-escuro.png">
  <img src="site-astro/public/readme/logo-claro.png" alt="Brasão da guilda DIVINE" width="88">
</picture>

# Guild DIVINE

**O manual da guilda para o conteúdo em grupo de Guild Wars 2.**<br>
Raids, Fractals e Dungeons explicados em português, com vídeo de cada boss.

<br>

<a href="https://divinegw.github.io/"><img src="https://img.shields.io/badge/Abrir_o_site-0a7487?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Abrir o site" height="36"></a>&nbsp;<a href="https://discord.gg/7fHMRW2xvt"><img src="https://img.shields.io/badge/Discord_da_guilda-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Entrar no Discord da guilda" height="36"></a>&nbsp;<a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/Quero_ajudar-8a5f0e?style=for-the-badge&logo=github&logoColor=white" alt="Como contribuir com o site" height="36"></a>

</div>

<br>

## Escolha seu guia

> [!TIP]
> Nunca entrou num squad? Comece pelo **Endgame**. Ele explica boons, roles e builds, que os outros guias já dão por sabidos.

<table>
<tr>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/endgame.html"><img src="site-astro/public/readme/endgame.jpg" width="100%" alt="Guia de Endgame"></a>
<p><a href="https://divinegw.github.io/guias/endgame.html"><b>Endgame</b></a>&nbsp;&nbsp;<sub>comece por aqui</sub></p>
<p>O básico antes do primeiro squad: boons, roles e builds.</p>
</td>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/raids.html"><img src="site-astro/public/readme/raids.jpg" width="100%" alt="Guia de Raids"></a>
<p><a href="https://divinegw.github.io/guias/raids.html"><b>Raids</b></a></p>
<p>Das 8 wings aos Raid Encounters, com vídeo de cada boss e o que muda no CM.</p>
</td>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/fractals.html"><img src="site-astro/public/readme/fractals.jpg" width="100%" alt="Guia de Fractals"></a>
<p><a href="https://divinegw.github.io/guias/fractals.html"><b>Fractals</b></a></p>
<p>Tiers, Agony Resistance e o Challenge Mode das 7 Fractals que têm um.</p>
</td>
</tr>
<tr>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/dungeons.html"><img src="site-astro/public/readme/dungeons.jpg" width="100%" alt="Guia de Dungeons"></a>
<p><a href="https://divinegw.github.io/guias/dungeons.html"><b>Dungeons</b></a></p>
<p>As 8 dungeons clássicas de Tyria, com a entrada e um vídeo de cada path.</p>
</td>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/recursos-uteis.html"><img src="site-astro/public/readme/recursos-uteis.jpg" width="100%" alt="Guia de Recursos Úteis"></a>
<p><a href="https://divinegw.github.io/guias/recursos-uteis.html"><b>Recursos Úteis</b></a></p>
<p>58 sites e ferramentas da comunidade, cada um com o que faz.</p>
</td>
<td width="33%" valign="top">
<a href="https://divinegw.github.io/guias/cursores.html"><img src="site-astro/public/readme/cursores.jpg" width="100%" alt="Guia do Divine Prisma"></a>
<p><a href="https://divinegw.github.io/guias/cursores.html"><b>Divine Prisma</b></a></p>
<p>Cursores feitos pela guilda, com instalador para o Nexus.</p>
</td>
</tr>
</table>

## Para baixar

| Download | O que vem |
|---|---|
| **[Wallpapers](https://divinegw.github.io/galeria.html)** | As artes dos nossos guias em alta resolução, 3200 px. |
| **[Perfil do Zyanore para o ArcDPS](https://divinegw.github.io/downloads/arcdps-zyanore.zip)** | As janelas de DPS do Zyanore, com a fonte e um passo a passo. O [Endgame](https://divinegw.github.io/guias/endgame.html#arcdps) mostra como instalar. |
| **[Divine Prisma](https://github.com/divinegw/divine-prisma)** | Os cursores, com instalador para o Nexus e versão `.cur` para o YoloMouse. |

## Quer ajudar?

Achou um erro, um boss mudou ou falta um vídeo? Você pode corrigir direto aqui, até pelo navegador. O [guia de contribuição](CONTRIBUTING.md) mostra o caminho mais curto. Prefere só avisar? [Abra uma issue](https://github.com/divinegw/divinegw.github.io/issues/new) ou chame a gente no [Discord](https://discord.gg/7fHMRW2xvt).

## Por dentro do site

<details>
<summary><b>Como o site é feito</b></summary>
<br>

A gente escreve os guias em MDX, com componentes próprios para boss, wing, dungeon e avisos, e o Astro transforma tudo em HTML estático. Quando você abre um pull request, o GitHub Actions gera o site e roda os testes num navegador de verdade (Playwright com Chrome). Depois do merge na `main`, o mesmo fluxo roda de novo e publica no GitHub Pages. Se a build ou um teste falhar, nada vai para o ar.

```mermaid
flowchart LR
  A["Guias em MDX<br/>+ componentes Astro"] --> B["astro build<br/>HTML estático + imagens otimizadas"]
  B --> C["QA com Playwright<br/>contraste, layout, sumário"]
  C -->|pull request| D["Resultado no PR"]
  C -->|merge na main| E["GitHub Pages"]
```

</details>

<details>
<summary><b>O que os testes conferem</b></summary>
<br>

Cada página é testada em 4 combinações: tema claro e escuro, computador e celular.

| Teste | O que ele pega |
|---|---|
| Contraste | Todo texto da página medido contra o fundo real, pela regra WCAG. |
| Layout | Rolagem para o lado, botões pequenos demais para o toque, títulos fora de ordem. |
| Imagens e erros | Imagem quebrada, banner no tamanho errado, erro no console do navegador. |
| Sumário | Clica em cada item de cada guia, com a rolagem suave ligada, e confere se o título parou logo abaixo do cabeçalho. |
| Impressão | Página em branco ou quase vazia ao imprimir em A4. |

</details>

<details>
<summary><b>Por baixo do capô</b></summary>
<br>

- O Astro gera cada arte em várias larguras, em WebP, e o navegador baixa só a que cabe na tela.
- As abas seguem o padrão WAI-ARIA e funcionam pelo teclado (setas, Home e End). Toda imagem tem uma descrição do que mostra.
- Os endereços dos guias (`/guias/<guia>.html`) e as âncoras das seções não mudam. A guilda compartilha esses links no Discord, e link quebrado lá ninguém conserta. Os links antigos de PDF (`/pdfs/<guia>.pdf`) abrem um PDF de uma página com o link do guia.

</details>

<details>
<summary><b>Créditos</b></summary>
<br>

- **Texto dos guias:** membros da guilda DIVINE. O autor de cada guia aparece no topo dele.
- **Ilustrações:** feitas pela guilda a partir de artes, capturas e telas de carregamento de Guild Wars 2 e de prints tirados no jogo pela guilda e por jogadores da comunidade, mudando só o estilo.
- **Ícones e fontes:** [Lucide](https://lucide.dev) (ISC), Mona Sans e Geist Mono (SIL Open Font License, com as licenças em `site-astro/public/assets/fonts/`).

A lista completa, com cada imagem da Guild Wars 2 Wiki, cada canal de vídeo e cada licença, está na página de [Créditos](https://divinegw.github.io/creditos.html).

</details>

<br>

<div align="center">

<img src="https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white" alt="Astro 7">
<img src="https://img.shields.io/badge/MDX-guias-1B1F24?logo=mdx&logoColor=white" alt="Guias em MDX">
<img src="https://img.shields.io/badge/Playwright-testes-2EAD33?logo=playwright&logoColor=white" alt="Playwright para os testes">
<img src="https://img.shields.io/badge/WCAG-contraste_AA_testado-44546a" alt="Contraste WCAG AA testado">
<img src="https://img.shields.io/badge/idioma-PT--BR-44546a" alt="Português do Brasil">

<sub>Guild Wars 2 e todos os nomes, artes e ícones do jogo pertencem à ArenaNet e são usados conforme os <a href="https://www.arena.net/en/legal/content-terms-of-use">Content Terms of Use</a>.<br>Este é um site de fã, sem fins comerciais e sem vínculo com a ArenaNet.</sub>

</div>
