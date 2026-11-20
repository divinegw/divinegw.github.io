---
name: voz-divine
description: Escreve ou reescreve qualquer texto do site da Guilda DIVINE na voz da guilda (Parceiro de guilda, VOZ.md) e audita texto existente contra ela. Use SEMPRE antes do humanizer-pt-br e do clarify, em todo texto que alguém vai ler — guias (.mdx), cards e frases de site.ts, novidades, topos de página, avisos, 404, README dos downloads, créditos — e quando o usuário disser que o texto está "robótico", "seco", "sem essência", "não parece a gente" ou pedir para revisar o tom.
---

# Voz da DIVINE

A fonte única das regras é `VOZ.md`, na raiz do projeto. **Leia o arquivo inteiro antes de escrever**: dimensões, Faça/Não faça, Diga/Nunca diga, tom por contexto e os exemplos de antes e depois (os dois primeiros foram escritos pelo próprio usuário e são a referência mais fiel).

## Ordem de todo texto

1. **Voz** (esta skill): escreva ou reescreva na voz, escolhendo o tom pelo contexto (guia, novidade/card, aviso/erro, crise).
2. **`humanizer-pt-br`**: tira o que sobrou de vício de IA.
3. **`impeccable` em modo `clarify`**: só nos trechos de **instrução** (passo a passo, aviso com ação, rótulo de botão, nome para leitor de tela). Em título, card, novidade e abertura de capítulo, o clarify não acrescenta "onde fica" nem "o que fazer": isso é o que deixava o texto com cara de manual.

## Reescrever texto existente

- **Fato não muda.** Números, nomes oficiais (em inglês), links, âncoras, componentes MDX e atributos ficam como estão. Mude só a frase em volta. Se uma frase só fica boa mudando um fato, deixe o fato e avise.
- Mexa só no que falha numa regra do `VOZ.md`. Frase que já passa fica.
- Em `.mdx`, não mude a estrutura: títulos `##`/`###` que viram âncora (o `id` sai do texto do título) só mudam se a âncora for preservada; na dúvida, não mude o título.
- Texto dentro de tabela, `Chip`, `Termo def=` e rótulo curto: só troque palavra proibida; não alongue.

## Auditar (modo revisão)

Para cada trecho, marque passa/falha em cada item do checklist do `VOZ.md` e devolva:
- a nota (itens que passam / total) por arquivo;
- os 3 padrões de desvio mais comuns, cada um com um exemplo real e a reescrita;
- a lista de trechos que falham, com arquivo:linha e a proposta.

## Teste final

Leia em voz alta. Se soa como manual, como empresa ou como IA, volte ao passo 1. Se soa como alguém da guilda explicando no Discord, está pronto.
