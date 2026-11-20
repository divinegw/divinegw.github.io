# Auditoria de conteúdo dos guias (17/11/2026)

> **Fase 2 aplicada (17/11/2026), não publicada.** Tudo das seções 2 a 6 entrou, com estas mudanças pedidas no caminho:
> - "Nada pode ficar sem vídeo": o CM da Kela ganhou um vídeo (Aiko, run para iniciantes, porque não existe guia narrado), os Legendary Modes de Ura, Cerus e Vloxx ganharam link de vídeo no texto e o Path 4 de Arah ganhou vídeo (Banter Bill).
> - Os resumos de CM não ficam num capítulo separado: cada um fica no próprio boss, recolhido, e abre pela seta no fim da linha.
> - "Strikes" virou "Raid Encounters" em todo texto que falava do modo de jogo (o nome oficial desde 03/02/2026). O título do Endgame "Strikes CM e Fractals CM" virou "Raid Encounters CM e Fractals CM"; a âncora desse `####` mudou, mas nenhum link do site apontava para ela.
> - Os textos novos passaram pelo humanizador. Os textos antigos ficaram como estavam.
> - Extras: página `/novidades.html` com sino na barra dos guias, aviso de novidade e faixa na home; prévia de link (Open Graph) com a arte do Endgame.

Fase 1 do pedido "verificar todas as seções, procurar informações erradas, desatualizadas e faltantes". Nenhum guia foi editado. As correções só entram depois de aprovadas.

**Como foi feito.** Quatro pesquisadores leram os seis `.mdx`. A wiki oficial bloqueia o WebFetch (403), então os pontos que dependiam dela foram conferidos por mim no navegador do app, direto na API da wiki (`wiki.guildwars2.com/api.php`), e os vídeos foram conferidos no YouTube (busca, oEmbed e capítulos). Onde o pesquisador disse "errado" e a wiki mostrou que o site está certo, o item foi para a lista de alarmes falsos no fim do relatório.

## 1. Challenge Modes: o que existe e o que o site cobre

O problema que o seu amigo apontou se confirma. O guia de Raids **lista corretamente** quais encontros têm CM, mas nenhum boss de raid tem vídeo de CM, e o site não explica o que muda em nenhum deles. O componente `<Boss>` já aceita `cm="..."` (o guia de Fractals usa), só falta preencher.

A lista de CM e LCM do site bate com a wiki (páginas *Challenge Mote*, *Raid*, *Guardian's Glade*, *Nexus of Eternity*).

| Encontro | CM | LCM | Vídeo CM hoje | Texto CM hoje | Vídeo CM proposto |
|---|---|---|---|---|---|
| **W3** Keep Construct | sim | — | não | não | Mukluk, *A Guide to ALL Raid Challenge Modes* (`Hwd7v0Vr2eY`, 03/2022) em 0:53 |
| **W4** Cairn | sim | — | não | não | mesmo vídeo, 1:03 |
| **W4** Mursaat Overseer | sim | — | não | não | mesmo vídeo, 1:34 |
| **W4** Samarog | sim | — | não | não (o guia da Snow Crows não fala do CM) | mesmo vídeo, 2:16 |
| **W4** Deimos | sim | — | não | não | mesmo vídeo, 3:09 |
| **W5** Soulless Horror | sim | — | não | não | mesmo vídeo, 3:52 |
| **W5** Dhuum | sim | — | não | não | mesmo vídeo, 4:19 |
| **W6** Conjured Amalgamate | sim | — | não | não | mesmo vídeo, 4:59 |
| **W6** Twin Largos | sim | — | não | não | mesmo vídeo, 5:46 |
| **W6** Qadim | sim | — | não | não | mesmo vídeo, 6:12 |
| **W7** Cardinal Adina | sim | — | não | não | mesmo vídeo, 7:15 |
| **W7** Cardinal Sabir | sim | — | não | não | mesmo vídeo, 7:50 |
| **W7** Qadim the Peerless | sim | — | não | não | mesmo vídeo, 8:15 |
| **W8** Greer | sim | — | não | não | 4649, *Quick Wing 8 Guides: Greer CM Overview* (`E2dShTtCtD8`, out/2026, depois da mudança de enrage de 14/04/2026) |
| **W8** Decima | sim | — | não | não | Henne, *Wing 8 Decima CM Strategy and Achievement Guide* (`t0Dj09CKgRM`, 2025) |
| **W8** Ura | sim | sim | não | não | RYUU, *Ura CM Guide: Basics of ranged shard* (`a5q4tA3YN3w`, 2025). LCM: só achei PoV (Earthwurm Jim, `cDVvnaxoHOY`) |
| Old Lion's Court | sim | — | não | sim (Snow Crows CM) | Vallun, *How to Beat Old Lion's Court CM - Raid Guide* (`YgqHyhHbBh0`, 2023) |
| Aetherblade Hideout | sim | — | não | não | Mukluk, *Aetherblade Hideout Challenge Mode* (`zmr5y37MAuI`); texto: Hardstuck CM |
| Xunlai Jade Junkyard | sim | — | não | não | Mukluk, *Jade Junkyard Challenge Mode* (`gj9ZzHYNMek`); texto: Hardstuck CM |
| Kaineng Overlook | sim | — | não | sim (Snow Crows CM) | GilGalad Gaming, *Minister Li CM Guide* (`iHiYS5P85Co`, 2022) |
| Harvest Temple | sim | — | não | não | MintayRee, *Harvest Temple CM Commander Guide* (`XAyjm0Z5MHI`, 2022); texto: Hardstuck CM |
| Cosmic Observatory | sim | — | não | não (o link atual é o guia normal) | Mukluk, *Cosmic Observatory Strike Challenge Mode Guide* (`TJ4zkibt64k`); texto: Snow Crows CM |
| Temple of Febe (Cerus) | sim | sim | não | não | REMagic, *Quick Overview for Flower Strategy (Cerus CM)* (`LqY6yV1mgzk`, 2025) |
| Guardian's Glade (Kela) | sim | — | não | não | **sem vídeo-guia**. Só PoV: Snow Crows, *Guardian's Glade CM 9:52* (`tE2YGxl8H-o`) |
| Nexus of Eternity (Vloxx) | sim | sim | não | não | Wolf GW2, *Vloxx CM Newer Strat Guide with Explanations* (`NNYx8mR8HwI`, nov/2026) |
| Forging Steel | desafios opcionais (só em squad) | — | — | — | não precisa, já está explicado no texto |
| **Fractal 94** Solitary Throne | sim | — | não | não | Syrma Gaming, *Every GW2 Fractal Challenge Mode Explained* (`mOoNh8fD3s8`, 30/09/2026) em 0:37 |
| **Fractal 95** Kinfall | sim | — | não | sim (GuildJen) | mesmo vídeo, 8:26 |
| **Fractal 96** Nightmare | sim | — | sim (Mukluk) | sim | ok |
| **Fractal 97** Shattered Observatory | sim | — | sim (Mukluk) | sim | ok |
| **Fractal 98** Sunqua Peak | sim | — | sim (Mukluk) | sim | ok |
| **Fractal 99** Silent Surf | sim | — | sim (Mukluk) | sim | ok |
| **Fractal 100** Lonely Tower | sim | — | não | sim (GuildJen) | mesmo vídeo da Syrma, 42:50 |

Dungeons não têm CM (a wiki só lista CM em Raids, Fractals, Convergences e histórias do Living World).

Os títulos e as datas dos vídeos vieram do YouTube, mas eu não assisti aos vídeos. Os de Mukluk são da mesma série que o site já usa. Os vídeos de W3 a W7 são de 2022; desde então pode ter havido ajuste de balanceamento, mas não achei rework de CM dessas wings.

## 2. Raids (`raids.mdx`)

| Seção / âncora | Tipo | Hoje | Proposta | Fonte | Prioridade |
|---|---|---|---|---|---|
| Raid Wings e Raid Encounters (cada `<Boss>` com CM) | faltando | nenhum botão CM | pôr `cm=` em 25 bosses, com os vídeos da tabela acima | YouTube (oEmbed e capítulos) | **alta** |
| nova seção `#challenge-modes` (âncora nova, depois de Raid Encounters) | faltando | não existe | um card por wing ou grupo de encontros, com 2 a 4 tópicos por boss sobre o que o CM muda (vida, enrage, mecânicas novas), mais o link do guia em texto do CM quando existir | wiki, seção "Challenge Mote" de cada wing e encontro | **alta** |
| Cosmic Observatory, `guia=` | desatualizado | guia normal da Snow Crows | trocar pelo guia de CM da Snow Crows (`/guides/strike-missions/secrets-of-the-obscure/cosmic-observatory-cm`) ou deixar os dois (normal no `guia=`, CM na seção nova) | Snow Crows (aberto pelo pesquisador) | média |
| Aetherblade Hideout, Xunlai Jade Junkyard, Harvest Temple | faltando | sem guia em texto | linkar os guias de CM da Hardstuck na seção nova | hardstuck.gg (abertos pelo pesquisador) | média |
| Recompensas, linha 44 | faltando | só fala do limite de Magnetite | acrescentar: o Gaeting Crystal também tem limite, **150 por semana**. O CM dá 10 a mais por boss, fora do limite | wiki *Gaeting Crystal* | média |
| Tiers de dificuldade, linha 92 (Emboldened) | faltando | "não altera recompensas" | acrescentar: **ativar o CM desliga o Emboldened**, e com Emboldened não se ganham alguns achievements (Undefeated, Down Down Downed etc.) | wiki *Emboldened* | baixa |
| Raid Encounters | faltando | Freezie não aparece | a wiki lista **Freezie** (Secret Lair of the Snowmen, Wintersday) entre os encontros de raid, sem CM. O Wintersday começa em dezembro. Proposta: uma linha ou um `<Boss>` sazonal. Antes, confirmo na wiki a data e o acesso | wiki *Raid* | baixa |
| linha 128, recompensa extra do CM | não confirmado | 2 gold, 10 Magnetite, XP e exótica | os 10 Magnetite estão confirmados; o gold e a exótica, não. Confiro na fase 2 | wiki *Magnetite Shard* | baixa |
| linha 144, Quickplay "5.000 de karma" | não confirmado | 5.000 karma e XP | o anúncio oficial fala em "quantidades reduzidas da mesma moeda", e a wiki diz que o Quickplay às vezes dá metade e às vezes o valor cheio de Magnetite. Confiro antes de mudar | guildwars2.com (03/02/2026), wiki *Magnetite Shard* | baixa |

Confirmado e sem mudança: as regras de CM por wing, os LCM de Ura, Cerus e Vloxx, os 8 encontros do Quickplay, o limite de 800 Magnetite, o Provisioner Token fora do CM desde 03/02/2026, Call of the Mists semanal e o nome "Daily Raid Bounties".

## 3. Fractals (`fractals.mdx`)

| Seção / âncora | Tipo | Hoje | Proposta | Fonte | Prioridade |
|---|---|---|---|---|---|
| Solitary Throne, Kinfall, Lonely Tower | faltando | sem botão CM | `cm=` com os capítulos do vídeo da Syrma Gaming | YouTube | **alta** |
| Tiers e escalas, linha 52 | **errado** | Fractal Avenger "a partir do nível 71" | **a partir da escala 75** | wiki *Fractal Avenger* | **alta** |
| Challenge Mode (CM), linha 172 | faltando | só lista os níveis | um bloco curto com o que cada um dos 7 CMs muda (2 a 3 tópicos por fractal), já que nem todo guia em texto linkado cobre o CM (o de Solitary Throne, da Hardstuck, não cobre) | wiki, seções de CM de cada fractal | média |
| "Fractal God em 190 dias", linha 182 | não confirmado | 190 dias | a Hardstuck (página antiga) fala em 230 dias. Sem fonte boa para nenhum dos dois. Proposta: manter ou trocar por "cerca de 6 a 8 meses" | hardstuck.gg | baixa |

Confirmado e sem mudança: os níveis de CM 94 a 100, os 7 CMs, os custos de Mist Attunement 1 a 4 (a soma bate com o total da wiki: 160.000 Relics, 3.200 Pristines, 750 Matrix e 24 Journals), os bônus dos quatro títulos, os vídeos `cm=` que já existem e os 24 guias da GuildJen (todos no ar).

## 4. Endgame (`endgame.mdx`)

| Seção / âncora | Tipo | Hoje | Proposta | Fonte | Prioridade |
|---|---|---|---|---|---|
| LFG, linha 526 | desatualizado | "As abas de Raids e Strike Missions possuem divisões experienced e training" | hoje só existe a aba **Raids**, com *Raids (Experienced)* e *Raids (Training)* | wiki *Looking for Group* | média |
| Onde encontrar builds, linha 264 | desatualizado | "Discretize: otimizado exclusivamente para Fractals" com link para discretize.eu | o site foi aposentado e só existe o arquivo (archive.discretize.eu), como o guia de Recursos já diz. Trocar o link e a descrição | archive.discretize.eu | média |
| Kill Proof, linhas 552 a 556 | faltando (opcional) | fala de KP de Strikes CM e Fractals CM, mas não de CM de raid | acrescentar uma frase sobre como grupos de CM de raid costumam pedir KP. Só faço se achar uma fonte; senão fica como está | — | baixa |

Confirmado e sem mudança: Quickness 50%, Alacrity 25%, Might, Stability, Vulnerability, Torment (bônus com o alvo parado), Chilled "~40%" (é o texto da própria wiki), instalação e atalho do ArcDPS, golem de 4.000.000, reset diário e semanal, os títulos de KP KE, NA e TGE.

## 5. Dungeons (`dungeons.mdx`)

Nada errado. Conferido na wiki: os níveis de cada dungeon, 20 Tales por path mais o bônus diário, 26 silvers por path, Dungeon Frequenter (5 gold e 150 Tales), Dungeon Rush (15 a 22/07/2026, 770 Tales, Story conta como path) e a isenção de 07/06/2022. Não existe CM em dungeon.

Detalhe opcional: houve outra edição do Dungeon Rush em 03 a 10/03/2026. O texto fala só da última, o que está certo.

## 6. Recursos Úteis (`recursos-uteis.mdx`) e Cursores (`cursores.mdx`)

- Todos os sites testados estão no ar. O GW2 Scratch, que o pesquisador deu como abandonado, abre normalmente e tem o *arcdps Log Manager*.
- Alguns sites só devolveram o título para o fetcher (GW2Mastery, GW2 Ninja, GW2 Directory, GW2 Homes, Discretize Optimizer, Peu Research Center). Isso é típico de site feito em JavaScript, não é prova de site fora do ar. Na fase 2, abro cada um no navegador.
- Sugestão de inclusão (baixa): os guias de CM de fractal da Hardstuck (`hardstuck.gg/gw2/guides/fractal-cms`) na seção "Raids, Strikes e Fractals".
- Cursores: nenhum erro factual encontrado. Os itens externos (pasta da Steam, atalho do YoloMouse) não foram confirmados e ficam como estão.

## 7. Alarmes falsos descartados

Os pesquisadores apontaram estes itens como errados, mas a fonte primária mostrou que o site está certo. Ficam registrados aqui para ninguém "corrigir" depois:

- Sunqua Peak com `video` e `cm` trocados: falso. Pelo oEmbed, `qlTxvKghTFc` é o *TLDR* normal e `RvMjGfPfi64` é o *Challenge Mode Guide*. O site está certo.
- Custos de Mist Attunement 2 e 4 ("1.200 e 2.000 são Journals"): falso. As somas do site batem com o total da wiki.
- Bônus de Savant e Prodigy: o site mostra os valores acumulados, e eles batem.
- Chilled "~40%": é o texto da wiki.
- Gold das dungeons e recompensa do Dungeon Frequenter: batem com a wiki.
- "Daily Raid Bounty" virou "Daily Boss Bounty": falso. A wiki ainda chama de *Daily Raid Bounties*.
- GW2 Scratch abandonado: falso.

## 8. Plano da fase 2 (depois da aprovação)

1. Ler na wiki, pelo navegador, a seção de CM de cada encontro e de cada fractal com CM, e escrever os tópicos em português, no tom do guia.
2. Um `editor` por vez: primeiro `raids.mdx` (botões `cm=`, a seção `#challenge-modes`, Gaeting e Emboldened), depois `fractals.mdx`, depois `endgame.mdx`.
3. O texto do botão de dica (linha 163 de `raids.mdx`) passa a explicar o botão **CM**.
4. `npm run build`, `npm run pdf` e `npm run qa` com o `verificador`. Nenhuma âncora antiga muda, e só entra a âncora nova `#challenge-modes`.
5. Nada é publicado.
