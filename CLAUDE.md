# Manual da Guilda DIVINE (Guild Wars 2)

**Idioma:** escreva tudo o que a pessoa lê em português do Brasil, inclusive os avisos curtos entre ferramentas. Nomes do jogo (bosses, itens, mecânicas) ficam no original.

Site estático com os guias da guilda (Raids, Fractals, Dungeons, Endgame, Recursos Úteis, Divine Prisma), feito em Astro na pasta `site-astro/`. O repositório `divinegw/divinegw.github.io` guarda o código-fonte. O GitHub Actions (`.github/workflows/site.yml`) gera, testa e publica no GitHub Pages a cada push na `main`, e só testa em cada pull request.

## Regras fixas

- Onde fica cada coisa: `COMO_EDITAR.md` e `site-astro/README.md` (blocos dos `.mdx`). Visual: `DESIGN.md` (site novo) e `site-astro/DESIGN-codex.md` (site em Astro, enquanto no ar). Voz: `VOZ.md`. Contribuição externa: `CONTRIBUTING.md`. Histórico: `site-astro/RELATORIO.md`.
- Texto dos guias: `site-astro/src/content/guias/*.mdx`. Nunca edite `site-astro/dist/` (gerado).
- **Site novo em transição (desde 23/11/2026):** a próxima versão é feita em Next.js + shadcn na pasta `site-next/`, em etapas (plano aprovado em `design-system/plano-site/PLANO.md`, fora do git). Enquanto os dois convivem, `site-next/scripts/juntar.mjs` põe as rotas já migradas (lista `ROTAS`) por cima do `site-astro/dist/`. Antes de mexer no `site-next/`, leia o `site-next/README.md` e a documentação do Next em `site-next/node_modules/next/dist/docs/`, porque a versão 16 muda APIs. A sequência de testes está no item "Build e testes".
- Contrato dos links do Discord: `site-astro/scripts/qa/contrato.json` lista as URLs e âncoras que não podem sumir, e o `npm run qa` confere. Regravar só quando o mantenedor aprovar a mudança de um link: em `site-astro/`, `node scripts/qa/contrato.mjs gravar`, que lê o `dist/` como está (depois do `juntar`, já com as páginas do Next).
- Build e testes, a mesma sequência do Actions:
  1. em `site-astro/`: `npm run build`;
  2. em `site-next/`: `npm run lint`, `npm run build` e `node scripts/juntar.mjs`;
  3. em `site-astro/`: `npm run pdf-aviso` e `npm run qa`.
- O site não oferece PDF desde 19/11/2026: `npm run pdf` só sob pedido (`publicar.ps1 -ComPdf`, ou o botão "Run workflow" com `pdf` marcado). Sem ele, cada `/pdfs/<guia>.pdf` é um aviso com o link do guia.
- Fato só muda com fonte. Texto confuso, seco ou robótico pode e deve ser reescrito. Use os nomes oficiais atuais do jogo ("Raid Encounters", não "Strikes").
- Mantenha URLs (`/guias/<guia>.html`, `/pdfs/<guia>.pdf`) e âncoras: há links para elas no Discord.
- Publicar (`publicar.ps1`, `git push` na `main`, merge de PR) só com pedido explícito do mantenedor. Commit local pode.
- Commits e textos do site não mencionam o Claude nem levam `Co-Authored-By`.

## Fluxo por etapa

A sessão principal planeja, decide e conversa. O trabalho braçal vai para os agentes de `.claude/agents/`. Cada tipo de tarefa segue a cadeia abaixo, nesta ordem. Uma etapa só começa com a saída da anterior em mãos.

### Texto (guia, novidade, card, README, LEIA-ME, créditos, commit)

| # | Quem | Skills | Sai daqui |
|---|---|---|---|
| 1 | `pesquisador` (só se mexer em fato) | `research` | trecho atual → correção → URL da fonte |
| 2 | sessão principal | `voz-divine` → `humanizer-pt-br` → `impeccable` modo `clarify` (só nos trechos de instrução), `ux-writing` em botão, rótulo e erro | texto final aprovado |
| 3 | `editor` | `voz-divine` (para conferir, não reescrever) | arquivos alterados + build passou |
| 4 | `verificador` | — | passou / lista de falhas |
| 5 | `revisor` | `voz-divine` em modo auditoria, `accessibility-excellence` | lista priorizada |

O clarify não entra em título, card, novidade nem abertura de capítulo: ali ele deixa o texto com cara de manual. Em instrução, cada frase diz o que é, onde fica e o que a pessoa faz. Nada de rótulo vago ("o botão", "a seta") sem dizer qual.

### Função, componente ou visual

| # | Quem | Skills | Sai daqui |
|---|---|---|---|
| 1 | sessão principal | `grilling` se o pedido estiver ambíguo; `ponytail` para escolher a menor solução que resolve; `design-foundations` + `DESIGN.md`; `craft` para desenhar a tela (ver **Craft** abaixo) | plano curto: arquivos, o que muda, como testar, lista de estados e a direção escolhida |
| 2 | `editor` | conforme o tipo: `layout-system` (grid, responsivo), `typography-system`, `color-system` (cor e contraste, sempre via `tokens.css`), `emil-design-eng` (animação, hover, clique), `accessibility-excellence` (teclado, ARIA, foco), `security-and-hardening` (dado de fora: Firebase do sorteio, API do GW2), `ux-writing` (rótulos), `better-ui` (acabamento: raio, sombra, alinhamento de ícone) | arquivos alterados + build passou |
| 3 | sessão principal, só em tela que mostra dado de fora (sorteio, API do GW2) | `stress` (nome de 30 letras, 0 e 500 inscritos, texto vazio) | o que quebrou → volta para o `editor` |
| 4 | `verificador` | — | passou / lista de falhas |
| 5 | `revisor` | `impeccable` modo `critique`, `product-design-review`, `web-design-guidelines`, `pre-flight-check` | lista priorizada |
| 6 | sessão principal | `verification-before-completion` | novidade feita (ver **Novidade**) e só agora diz "pronto" |

#### Craft (passo 1)

O craft (`.claude/skills/craft*`) desenha antes de codar. A `using-craft` é o roteador dele. Neste projeto ele trabalha dentro desta cadeia: desenha e decide no passo 1, e os agentes fazem o resto.

- **Tela ou pedaço de tela:** `craft`. Ele chama `craft-states` para listar todos os estados (vazio, carregando, erro, muitos itens, celular) e, antes de mostrar qualquer coisa, `craft-critique`.
- **Mais de um caminho bom, ou o pedido de "opções":** `craft-explore`. O quadro com o Atual e as direções vai para `design-system/explorations/<tema>/` (fora do git) e espera o mantenedor escolher. Depois da escolha, a pasta é apagada.
- **Peça reutilizável nova ou ajuste em várias telas:** `craft-system`.
- **Fora daqui:** `craft-setup` e `craft-sync`. O `DESIGN.md` já existe e o projeto não usa ferramenta de design (Figma, Paper).
- Direções de cor, fonte ou visual só entram quando o pedido for por algo novo ou fora do que existe. Nesse caso, a proposta sai do `tokens.css` e diz o que mudaria no `DESIGN.md`.

### Auditoria de deriva (componentes que se afastaram do sistema)

`improve-ui` na sessão principal (só lê o código; grava os planos em `design-plans/`, fora do git) → o mantenedor escolhe quais planos entram → `editor` aplica → `verificador` → `revisor`. Use antes de reorganizar um conjunto de telas (por exemplo, os painéis do sorteio) ou quando o visual parecer inconsistente.

### Bug

`diagnosing-bugs` na sessão principal (reproduzir, achar a causa) → `editor` aplica a correção → `verificador` → `revisor` se a correção mudar algo visível → novidade do tipo `corrigido` se o leitor notava o bug.

### Novidade (fecha toda entrega)

Toda entrega que quem visita o site percebe termina com uma novidade em `site-astro/src/novidades.ts`: feature nova, página ou guia novo, guia atualizado ou reescrito, visual novo, correção que o leitor nota. Ela vai **no mesmo commit** da mudança. Pela regra, a entrega só fica pronta quando a novidade estiver feita.

- **Quando entra:** a mudança aparece para o visitante. Refatoração, teste, ajuste de build e documentação do repositório (`CLAUDE.md`, `DESIGN.md`, README) não geram novidade.
- **Como fazer:** o formato está no topo de `novidades.ts`. O texto segue a cadeia de **Texto** acima: `voz-divine` → `humanizer-pt-br`, sem clarify. O título tem até 6 palavras e "!". Cada item de `mudancas` aponta com `href` para a seção que mudou.
- **Uma por dia:** se já existe uma entrada com a data de hoje, acrescente os itens de `mudancas` nela e mantenha o `id`. Um `id` novo acende o aviso de novo para todo mundo, então crie outra entrada só quando for um anúncio separado.
- **Conferência:** o `verificador` roda com a novidade já no lugar, e o `revisor` audita o texto dela na voz. Na dúvida se uma mudança merece novidade, pergunte ao mantenedor antes do commit.

### Publicação

Mudança pronta, com a novidade → commit local com mensagem de verdade (o histórico é público) → quando o mantenedor pedir: `publicar.ps1 -Mensagem "..."` (testa local, faz push; o Actions publica). Contribuição externa entra por pull request, e o Actions roda os mesmos testes.

### Regras da orquestração

- As etapas de `verificador` e `revisor` rodam no fim de **toda** tarefa que mexe no site. Corrija o que eles acharem e rode o verificador de novo antes de dizer que terminou.
- Delegue quando a tarefa for mecânica, de leitura ampla ou repetitiva. Faça direto quando forem poucas chamadas de ferramenta: subir um agente também custa.
- O agente começa sem contexto: o pedido diz os arquivos, o que fazer, quais skills carregar e como saber que terminou.
- Pesquisas independentes podem rodar em paralelo. Edições no mesmo arquivo, nunca: um `editor` por vez.
- Confira o resultado do agente antes de dizer que algo está pronto.

## Agentes

| Agente | Modelo | Papel |
|---|---|---|
| `pesquisador` | Haiku | checar fatos de GW2, achar fontes, buscar nos arquivos. Só lê. |
| `editor` | Sonnet | aplicar mudanças já decididas e rodar a build. |
| `verificador` | Haiku | build, `pdf-aviso`, `qa`, links e imagens. Não corrige. |
| `revisor` | Sonnet | design, UX, acessibilidade e voz. Não edita. |

## Skills

- **Vêm com o repositório:** `voz-divine` (`.claude/skills/voz-divine/`).
- **Externas:** todas as outras citadas acima. A lista com a origem de cada uma está em `.claude/SKILLS.md`. Se uma skill da etapa não estiver instalada, siga a etapa sem ela e diga qual faltou no relatório final. Nunca invente o conteúdo de uma skill que você não carregou.
- A `starchild-design-pack`, se estiver instalada, tem paleta própria (laranja/preto). Aqui manda o `DESIGN.md`.
