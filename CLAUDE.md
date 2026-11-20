# Manual da Guilda DIVINE (Guild Wars 2)

**Idioma:** escreva tudo o que a pessoa lê em português do Brasil, inclusive os avisos curtos entre ferramentas. Nomes do jogo (bosses, itens, mecânicas) ficam no original.

Site estático com os guias da guilda (Raids, Fractals, Dungeons, Endgame, Recursos Úteis, Divine Prisma), feito em Astro na pasta `site-astro/`. O repositório `divinegw/divinegw.github.io` guarda o código-fonte. O GitHub Actions (`.github/workflows/site.yml`) gera, testa e publica no GitHub Pages a cada push na `main`, e só testa em cada pull request.

## Regras fixas

- Onde fica cada coisa: `COMO_EDITAR.md` e `site-astro/README.md` (blocos dos `.mdx`). Visual: `DESIGN.md`. Voz: `VOZ.md`. Contribuição externa: `CONTRIBUTING.md`. Histórico: `site-astro/RELATORIO.md`.
- Texto dos guias: `site-astro/src/content/guias/*.mdx`. Nunca edite `site-astro/dist/` (gerado).
- Build e testes, em `site-astro/`: `npm run build`, `npm run pdf-aviso`, `npm run qa`. É a mesma sequência do Actions. O site não oferece PDF desde 19/11/2026: `npm run pdf` só sob pedido (`publicar.ps1 -ComPdf`, ou o botão "Run workflow" com `pdf` marcado). Sem ele, cada `/pdfs/<guia>.pdf` é um aviso com o link do guia.
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
| 1 | sessão principal | `grilling` se o pedido estiver ambíguo; `ponytail` para escolher a menor solução que resolve; `design-foundations` + `DESIGN.md` | plano curto: arquivos, o que muda, como testar |
| 2 | `editor` | conforme o tipo: `layout-system` (grid, responsivo), `typography-system`, `color-system` (cor e contraste, sempre via `tokens.css`), `emil-design-eng` (animação, hover, clique), `accessibility-excellence` (teclado, ARIA, foco), `security-and-hardening` (dado de fora: Firebase do sorteio, API do GW2), `ux-writing` (rótulos) | arquivos alterados + build passou |
| 3 | `verificador` | — | passou / lista de falhas |
| 4 | `revisor` | `impeccable` modo `critique`, `product-design-review`, `web-design-guidelines`, `pre-flight-check` | lista priorizada |
| 5 | sessão principal | `verification-before-completion` | só agora diz "pronto" |

### Bug

`diagnosing-bugs` na sessão principal (reproduzir, achar a causa) → `editor` aplica a correção → `verificador` → `revisor` se a correção mudar algo visível.

### Publicação

Mudança pronta → commit local com mensagem de verdade (o histórico é público) → quando o mantenedor pedir: `publicar.ps1 -Mensagem "..."` (testa local, faz push; o Actions publica). Contribuição externa entra por pull request, e o Actions roda os mesmos testes.

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
