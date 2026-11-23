# Como editar o site da Guild DIVINE

Guia prático para mudar textos, imagens e visual, testar e publicar no GitHub Pages.
O site é feito com [Astro](https://astro.build) e fica todo na pasta `site-astro/`. Veio de fora da guilda e quer mandar uma correção? Comece pelo [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## 1. Como a pasta está organizada

```
divinegw.github.io/
├── .github/workflows/site.yml  ← o GitHub gera, testa e publica o site sozinho
├── publicar.ps1                ← testa aqui e envia para o GitHub (-ComPdf pede os PDFs completos)
├── COMO_EDITAR.md              ← este guia
├── CONTRIBUTING.md             ← como alguém de fora manda uma correção
├── DESIGN.md                   ← visual do site novo (site-next/); o do Astro está em site-astro/DESIGN-codex.md
├── VOZ.md                      ← como a guilda escreve
└── site-astro/
    ├── src/content/guias/      ← TEXTO DOS GUIAS (um .mdx por guia: você edita aqui)
    ├── src/site.ts             ← nome do site, data "Atualizado em" e textos da página inicial
    ├── src/assets/guias/       ← fotos e artes de cada guia (uma pasta por guia)
    ├── src/assets/home/        ← arte do topo da página inicial
    ├── src/assets/icones/      ← ícones dos cards, das linhas e dos boons
    ├── src/styles/tokens.css   ← cores, fontes, espaçamentos (os tokens do DESIGN-codex.md)
    ├── src/styles/divine.css   ← estilo dos blocos; inicio.css = página inicial
    ├── src/components/         ← blocos usados nos guias (Card, Item, Wing...)
    ├── src/layouts/Guia.astro  ← estrutura de um guia (topo, sumário, rodapé)
    ├── scripts/                ← PDFs e testes (qa/)
    ├── README.md               ← como escrever um guia, com exemplos de cada bloco
    └── dist/                   ← O SITE PRONTO (gerado; fica fora do git)
```

> **Regra de ouro:** nunca edite `site-astro/dist/`. É gerado e sobrescrito a cada build.

> **Site novo em construção:** a próxima versão do site (Next.js + shadcn/ui, só tema escuro) está sendo feita na pasta `site-next/`, em etapas. Enquanto isso, o site publicado continua vindo do `site-astro/`, e só as páginas já prontas no site novo entram por cima dele (lista `ROTAS` em `site-next/scripts/juntar.mjs`). **Quem edita guias não precisa mexer em nada:** continue pelo `site-astro/`. Só quem mexe no `site-next/` precisa ler o `site-next/README.md`.

---

## 2. O ciclo de edição

No terminal, dentro de `site-astro/`:

1. **Editar** o arquivo certo (tabela da seção 3).
2. **Ver enquanto edita**: rode `npm run dev` e abra <http://localhost:4321/>. A página atualiza sozinha ao salvar.
3. **Gerar e testar** (a mesma sequência que o GitHub roda):
   ```powershell
   npm run build      # gera dist/
   # site novo: confere, gera e junta as páginas já migradas ao dist/ (um comando por vez)
   cd ..\site-next
   npm run lint
   npm run build
   node scripts/juntar.mjs
   cd ..\site-astro
   npm run pdf-aviso  # põe em dist/pdfs/ o aviso com o link de cada guia
   npm run qa         # testes: links do Discord (contrato), contraste, layout, sumário, imagens, impressão
   ```
   `npm run pdf` gera os PDFs completos. Rode só quando alguém pedir: o site não oferece mais PDF.
4. **Publicar** (na pasta do projeto):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\publicar.ps1 -Mensagem "O que mudou"
   ```
   O script testa tudo de novo, faz o commit e envia para <https://github.com/divinegw/divinegw.github.io>. O GitHub Actions testa mais uma vez e publica em <https://divinegw.github.io/> em 2 a 5 minutos. Acompanhe na aba **Actions** do repositório.

   Pull request de outra pessoa: o Actions testa sozinho. Com o ✓ verde e a revisão feita, clique em **Merge pull request** e o site atualiza.

**Primeira vez neste computador?** Instale o Node.js 24, o Git e o GitHub CLI. Os testes usam o Microsoft Edge no Windows (já vem instalado) e o Google Chrome no Linux e no macOS. Depois rode uma vez:
```powershell
gh auth login --web
cd site-astro
npm ci
```

---

## 3. Quero mudar… → onde

| Quero mudar | Arquivo |
|---|---|
| Texto de um guia | `site-astro/src/content/guias/<guia>.mdx` |
| Título, frase, arte e chips do topo de um guia | frontmatter (entre os `---`) no início do `.mdx` |
| Arte do topo de um guia (e do card na página inicial) | troque `src/assets/guias/<guia>/arte.jpg` (wallpaper largo, sem faixas pretas) |
| Arte do topo da página inicial | troque `src/assets/home/arte.jpg` |
| Nome do site e data "Atualizado em…" | `SITE` em `src/site.ts` |
| Textos e tags dos cards da página inicial | `INICIO` em `src/site.ts` |
| Logo (brasão) | `src/assets/emblema-claro.png` e `emblema-escuro.png` |
| Cores, fontes, espaçamentos | `src/styles/tokens.css` (leia o `site-astro/DESIGN-codex.md` antes); estilo dos blocos em `src/styles/divine.css` |
| Guia novo | crie `src/content/guias/<nome>.mdx`; a página `/guias/<nome>.html` e o sumário saem sozinhos |
| Anunciar uma atualização (página Novidades, ponto em "Novidades" na barra, aviso e faixa da home) | acrescente uma entrada **no topo** de `NOVIDADES` em `src/novidades.ts`, com um `id` novo (explicação no próprio arquivo). O id novo é o que faz o aviso aparecer de novo para quem já viu o anterior |
| Imagem e texto da prévia do link (Discord, WhatsApp) | `src/components/Cabeca.astro`: a home usa a arte do Endgame; cada guia usa a própria arte, o título e a `description` do frontmatter |

Imagens podem ser `.jpg`, `.png` ou `.webp`, de qualquer tamanho: a build gera as versões menores para celular.

---

## 4. Como escrever um guia

Tudo está no `site-astro/README.md`, com exemplos de cada bloco: capítulos (`##`), cards (`<Card>`), linhas com ícone (`<Item>`), avisos (`<Aviso>`), imagens e banners, Wings e bosses, Dungeons e paths, recursos e o sumário "Neste guia".

Três cuidados no `.mdx`:
- Deixe uma linha em branco depois de `<Card ...>` e antes de `</Card>`.
- `<Item>`, `<Aviso>` e `<Recurso>` ficam numa linha só (use `<br/>` para quebrar).
- Não use `{` nem `<` soltos no texto. Se precisar, escreva `\{` ou `&lt;`.

---

## 5. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build para com `Could not parse expression` ou `Unexpected character` | `{` ou `<` solto no texto do `.mdx` | Escreva `\{` ou `&lt;`. A mensagem diz a linha. |
| `Imagem não encontrada` / `ImageNotFound` | Caminho ou nome do arquivo errado | Confira a pasta em `src/assets/guias/<guia>/`. |
| Ícone aparece vazio | Nome em `icone="..."` não existe | Use o nome de um arquivo de `src/assets/icones/` (sem extensão) ou de um ícone de lucide.dev. |
| Abrir o `.html` com dois cliques fica sem estilo | O site precisa de servidor | Use `npm run dev` ou `npm run preview`. |
| `npm run qa` ou `npm run pdf` não abre o navegador | Falta o Edge (Windows) ou o Chrome (Linux, macOS) | Instale o navegador, ou escolha outro com `PDF_CHANNEL=chrome` (ou `msedge`). |
| `publicar.ps1` diz "Há mudanças sem commit" | Faltou dizer o que mudou | Rode de novo com `-Mensagem "O que mudou"`. |
| `publicar.ps1` falha no push | Git sem login no GitHub | `gh auth login --web` e, depois, `gh auth setup-git`. |
| ✗ vermelho no pull request ou na aba Actions | Build ou teste falhou no GitHub | Clique em **Details** e leia a última mensagem de erro. Rode `npm run qa` aqui para ver o mesmo erro. |
