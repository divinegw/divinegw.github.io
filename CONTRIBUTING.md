# Como ajudar no site da DIVINE

Valeu por querer ajudar! Tem três jeitos, do mais rápido ao mais completo. Escolha o que combina com o tamanho da mudança.

## 1. Só avisar

Viu um erro e não quer mexer em nada? [Abra uma issue](https://github.com/divinegw/divinegw.github.io/issues/new) dizendo em qual guia está, o que está errado e, se tiver, o link da fonte (wiki, vídeo, patch note). Também vale chamar a gente no [Discord da guilda](https://discord.gg/7fHMRW2xvt).

## 2. Corrigir um texto pelo navegador

Para trocar uma frase, um número ou um link, você não precisa instalar nada.

1. Abra o guia em [`site-astro/src/content/guias/`](site-astro/src/content/guias/). Cada guia é um arquivo `.mdx` (por exemplo, `raids.mdx`).
2. Clique no ícone de lápis (**Edit this file**), no alto do arquivo.
3. Faça a mudança e clique em **Commit changes...**, depois em **Propose changes**. O GitHub cria uma cópia do repositório na sua conta (o fork) com a sua mudança.
4. Na página seguinte, clique em **Create pull request** e diga o que mudou e por quê. Mudou um fato? Cole o link da fonte.
5. Espere o teste automático terminar no pull request. Se aparecer um ✗ vermelho, clique em **Details** para ver o erro. Na maioria das vezes é um `{` ou `<` solto no texto (veja os cuidados abaixo).

## 3. Rodar o site no seu computador

Para mudanças maiores (imagem nova, componente, visual), rode o site aí.

**Precisa ter:** [Node.js 24](https://nodejs.org), Git e o [GitHub CLI](https://cli.github.com). Os testes abrem um navegador: no Windows, o Microsoft Edge (já vem instalado); no Linux e no macOS, o Google Chrome.

```bash
gh repo fork divinegw/divinegw.github.io --clone
cd divinegw.github.io
git switch -c minha-correcao
cd site-astro
npm ci
npm run dev
```

O `gh repo fork` cria a sua cópia do repositório no GitHub e baixa ela aqui. Troque `minha-correcao` por um nome curto que diga o que você vai mudar.

Abra <http://localhost:4321/>. A página atualiza sozinha cada vez que você salva um arquivo.

Antes de abrir o pull request, rode os mesmos testes que o GitHub vai rodar:

```bash
npm run build
npm run pdf-aviso
npm run qa
```

Se o `npm run qa` terminar sem apontar nenhuma falha, mande a mudança. Na pasta do projeto:

```bash
git add -A
git commit -m "Corrige a vida do Sabetha no CM"
git push -u origin minha-correcao
gh pr create --fill
```

Escreva no commit o que mudou, como no exemplo. O `gh pr create` abre o pull request no repositório da guilda.

## Onde fica cada coisa

| Quero mudar | Arquivo |
|---|---|
| Texto de um guia | `site-astro/src/content/guias/<guia>.mdx` |
| Fotos e prints de um guia | `site-astro/src/assets/guias/<guia>/` |
| Textos dos cards da página inicial | `INICIO` em `site-astro/src/site.ts` |
| Página Novidades | `site-astro/src/novidades.ts` (entrada nova sempre no topo) |
| Cores, fontes e espaçamentos | `site-astro/src/styles/tokens.css` (leia o [`DESIGN.md`](DESIGN.md) antes) |
| Blocos usados nos guias (Card, Item, Wing...) | `site-astro/src/components/` |

O [`site-astro/README.md`](site-astro/README.md) mostra cada bloco do `.mdx` com exemplo. O [`COMO_EDITAR.md`](COMO_EDITAR.md) tem a lista completa e os erros mais comuns.

## Regras da casa

- **Fato muda com fonte.** Número, mecânica ou recompensa nova vem com o link da [wiki oficial](https://wiki.guildwars2.com) ou de outra fonte confiável na descrição do pull request.
- **Links e âncoras ficam.** Não renomeie arquivos de guia nem títulos de seção sem combinar antes: a guilda compartilha esses links no Discord, e o endereço da seção sai do título.
- **Nomes do jogo em inglês e atuais:** Raid Encounters, Challenge Mode, Emboldened. Nada de "Strikes".
- **A voz é a da guilda.** Fale com "você", frase curta, palavra simples, sem cara de manual. O [`VOZ.md`](VOZ.md) tem as regras e exemplos de antes e depois.
- **Nunca edite `site-astro/dist/`.** É o site gerado; a build apaga tudo o que você mudar lá.

### Cuidados no `.mdx`

- Deixe uma linha em branco depois de `<Card ...>` e antes de `</Card>`.
- `<Item>`, `<Aviso>` e `<Recurso>` ficam numa linha só. Para quebrar a linha dentro deles, use `<br/>`.
- `{` e `<` soltos no texto quebram a build. Escreva `\{` ou `&lt;`.

## O que acontece depois do pull request

O GitHub Actions gera o site e roda os testes de contraste, layout, imagens e sumário. Com tudo verde, alguém da guilda revisa. Depois do merge, o site atualiza sozinho em poucos minutos.

## Usa o Claude Code?

O repositório já vem com os agentes e as regras do projeto: o [`CLAUDE.md`](CLAUDE.md) e a pasta `.claude/agents/`. Algumas skills do fluxo são externas e não vêm junto. A lista, com onde instalar cada uma, fica em [`.claude/SKILLS.md`](.claude/SKILLS.md). Sem elas o Claude continua funcionando, só pula aquela etapa.
