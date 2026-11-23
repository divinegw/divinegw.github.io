# Skills usadas no fluxo do projeto

O `CLAUDE.md` cita estas skills em cada etapa. Só a `voz-divine` vem com o repositório. As outras são de terceiros e ficam fora por licença. Instale as que quiser em `~/.claude/skills/` (valem para todos os projetos) ou em `.claude/skills/` (só aqui; essa pasta é ignorada pelo git). Sem uma delas, o Claude segue a etapa e avisa qual faltou.

| Skill | Etapa | Origem |
|---|---|---|
| `voz-divine` | texto | neste repositório |
| `humanizer-pt-br` | texto | skill comunitária de humanização em PT-BR; opcional; sem ela a etapa segue sem esse passo |
| `impeccable` (modos `clarify` e `critique`) | texto, revisão | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache 2.0 |
| `web-design-guidelines` | revisão | baseada nas [Web Interface Guidelines da Vercel](https://github.com/vercel-labs/web-interface-guidelines) |
| `ponytail` | plano | MIT; opcional; sem ela a etapa segue sem esse passo |
| `research`, `grilling`, `diagnosing-bugs` | pesquisa, plano, bug | pacote de skills do Matt Pocock |
| `ux-writing`, `emil-design-eng`, `design-foundations`, `layout-system`, `typography-system`, `color-system`, `accessibility-excellence`, `product-design-review`, `pre-flight-check` | função e visual, revisão | pacotes de skills de design de terceiros; opcional; sem ela a etapa segue sem esse passo |
| `security-and-hardening`, `verification-before-completion` | função, fim de tarefa | skills globais de engenharia de terceiros |
| `craft`, `craft-states`, `craft-explore`, `craft-critique`, `craft-system`, `using-craft` (e `craft-setup`, `craft-sync`, fora da cadeia) | função e visual, passo 1 | [diego3g/craft](https://github.com/diego3g/craft), MIT. Copie as pastas de `skills/` para `.claude/skills/`. O plugin original carrega a `using-craft` em toda sessão por um hook `SessionStart`; aqui esse hook é opcional e fica no `settings.local.json` de cada um |
| `better-ui` | função e visual, editor | [jakubkrehel/skills](https://github.com/jakubkrehel/skills), MIT; opcional |
| `stress` | função e visual, tela com dado de fora | [raphaelsalaja/skill](https://github.com/raphaelsalaja/skill), MIT. Vem como manual (`disable-model-invocation`); tire essa linha para a cadeia poder chamar |
| `improve-ui` | auditoria de deriva | [ibelick/ui-skills](https://github.com/ibelick/ui-skills), MIT; grava planos em `design-plans/` (ignorada pelo git) |

Mantenedor: ao trocar ou instalar uma skill do fluxo, atualize esta tabela e o `CLAUDE.md` juntos.
