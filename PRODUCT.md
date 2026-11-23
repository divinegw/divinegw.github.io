# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Membros da guilda DIVINE e jogadores brasileiros de Guild Wars 2** que estudam o guia antes de entrar em raid, fractal ou dungeon. Muitos chegam por um link mandado no Discord da guilda, direto numa seção (âncora) do guia.
- **Quem organiza sorteio ao vivo** na live ou no Discord da guilda: abre o sorteio, manda o link, acompanha as inscrições e sorteia na frente de todo mundo. Quem participa entra pelo link, põe a conta do jogo e espera a roleta.

## Product Purpose

Manual da Guilda DIVINE: guias de Raids, Fractals, Dungeons, Endgame e Recursos Úteis para o jogador chegar sabendo o que fazer, e ferramentas da guilda (sorteio ao vivo, galeria de wallpapers, novidades). Sucesso é o squad entrar preparado e o sorteio da live acontecer sem ninguém duvidar do resultado.

## Positioning

Guia em português do Brasil na voz da guilda, com vídeo de cada boss gravado pela própria DIVINE e artes próprias. O sorteador dá a todo resultado um código que qualquer pessoa usa para refazer a conta e conferir que ninguém mexeu.

## Operating Context

- Leitura em computador e celular, muitas vezes logo antes de uma run, com o link vindo do Discord.
- Sorteio usado durante live: a tela pode estar sendo transmitida, quem ganhou tem 1 minuto para aceitar o prêmio, e quem organiza sorteia outra pessoa se não aceitarem.
- Nomes do jogo (bosses, itens, mecânicas) ficam no original em inglês; nomes oficiais atuais ("Raid Encounters", não "Strikes").

## Capabilities and Constraints

- Site estático em Astro (`site-astro/`), com o código aberto em `divinegw/divinegw.github.io`. O GitHub Actions testa cada pull request e publica no GitHub Pages a cada push na `main` (o dono envia com `publicar.ps1`). Publicar só com pedido explícito do dono.
- **Custo zero:** GitHub Pages e Firebase no plano grátis (Spark). Nenhum recurso pago.
- **Tudo em PT-BR** para quem lê.
- **URLs e âncoras fixas** (`/guias/<guia>.html`, `/pdfs/<guia>.pdf` e os ids das seções): há links para elas no Discord.
- **Sem PDF** no site desde 19/11/2026 (só sob pedido, com `publicar.ps1 -ComPdf`).
- **Nada de copiar ou traduzir lore nem texto da wiki ou da ArenaNet.** Descrições de itens e prêmios são escritas com palavras próprias.
- Sorteio ao vivo: Firebase (Firestore + login anônimo ou Google), regras em `firebase/firestore.rules`; registro permanente em Ganhadores; busca de item pela wiki e pela API oficial do jogo.

## Brand Commitments

- Voz da guilda definida em `VOZ.md` (Parceiro de guilda): fala com "você", "nós" quando é a guilda, palavra de jogador, sem cara de manual. Todo texto passa por voz-divine, humanizer-pt-br e clarify (só em instrução).
- Visual: `DESIGN.md` (sistema novo, site-next/, só escuro, ouro); o site em Astro, enquanto no ar, segue `site-astro/DESIGN-codex.md`.
- Nada de atribuição a ferramentas de IA em commits, no site ou nos textos.

## Evidence on Hand

- Guias em `site-astro/src/content/guias/*.mdx`, com vídeos da guilda.
- Artes dos guias (galeria de wallpapers) e logo em `design-system/logo/`.
- Não há depoimentos, números de público ou parcerias registrados: não inventar.

## Product Principles

1. O jogador chega sabendo o que fazer: clareza antes de enfeite.
2. Confiança verificável: todo sorteio pode ser conferido por qualquer pessoa.
3. Link do Discord nunca quebra.
4. Da guilda para a guilda: voz própria, conteúdo próprio, custo zero.

## Accessibility & Inclusion

WCAG 2.2 AA como piso: contraste nos temas claro e escuro, alvos de toque, foco visível, leitor de tela e "reduzir movimento". O `npm run qa` checa contraste, overflow, alvos e links em celular e computador, nos dois temas.
