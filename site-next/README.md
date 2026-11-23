# site-next: o site novo da DIVINE

**Quem edita guia não precisa mexer aqui.** Os guias continuam no `../site-astro/` até passarem para cá, um por vez.

Esta pasta guarda a próxima versão do Manual da Guilda DIVINE: Next.js 16, React 19, Tailwind CSS v4 e os componentes prontos do shadcn/ui. O site sai estático (só arquivos, sem servidor) para o GitHub Pages, com tema escuro e as fontes Inter e JetBrains Mono servidas pelo próprio site.

O site novo é feito em etapas e convive com o atual até o último guia passar: primeiro a base e o visual, depois o sorteio, a página inicial e por fim os guias. Só vão ao ar as páginas que estão na lista `ROTAS`, em `scripts/juntar.mjs`. O resto continua vindo do Astro.

## Comandos

Primeira vez nesta pasta: `npm install`.

O `juntar` precisa do site atual já gerado. Então, a sequência completa é esta, um comando por vez:

```powershell
cd site-astro
npm run build
cd ..\site-next
npm run lint
npm test
npm run build
node scripts/juntar.mjs
cd ..\site-astro
npm run pdf-aviso
npm run qa
```

- `npm run lint`, `npm test` e `npm run build` (em `site-next/`) conferem o código, garantem que o sorteio dá o mesmo resultado de antes e geram a pasta `out/`, com um `.html` por página.
- `node scripts/juntar.mjs` copia as páginas da lista `ROTAS` para o site atual (`../site-astro/dist/`).
- `npm run qa` (em `site-astro/`) testa tudo. Um dos testes é o contrato dos links do Discord: nenhuma URL ou link com `#` pode sumir.

Para ver enquanto edita: `npm run dev` e abra <http://localhost:3000/design-system>.

Para testar o sorteio com dados extremos (títulos longos, nenhum, 20 abertos, servidor lento ou fora do ar), sem gravar nada no banco: com o `npm run dev` no ar, `node testes/stress/rodar.mjs http://localhost:3000/sorteio`. As fotos vão para `testes/stress/fotos/` (fora do git).

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Páginas (cada pasta vira uma URL) | `app/` |
| Cores, cantos e fontes | `app/globals.css` (provisórios até a etapa do sistema de design) |
| Fontes (licença OFL) | `app/fonts/`; licenças em `public/assets/fonts/` |
| Componentes shadcn (copiados e adaptados) | `components/ui/` |
| Vitrine dos componentes (não vai ao ar) | `app/design-system/page.tsx` |

## Regras

- **O site não tem servidor.** Não use nada do Next que dependa de servidor: `middleware`, server actions, `redirects` e `rewrites`. Na dúvida, pergunte ao mantenedor.
- **A versão 16 do Next mudou muita coisa.** Antes de usar um recurso, leia a documentação que vem junto, em `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- **Componente shadcn se ajusta no próprio arquivo**, em `components/ui/`, nunca com CSS solto em outro lugar. Para trazer um novo: `npx shadcn add <nome>`. Baixar componente novo pede o OK do mantenedor.
- **Cor só pelas de `app/globals.css`**, pelos nomes (`bg-background`, `text-primary-text`). Nunca um código de cor solto (`#e2b254`) dentro de componente.
- **O site é só escuro.** O `<html>` tem sempre a classe `dark`.
