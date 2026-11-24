// Roda sozinho depois de `npm run build` (postbuild). Procura no out/ rastros da camada falsa do desenvolvimento
// (lib/dados/falso.ts): se algum cenário de teste for parar no pacote publicado, o build falha.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const raiz = resolve(fileURLToPath(new URL("..", import.meta.url)))
const saida = join(raiz, "out")

// Nomes que só existem na camada falsa. Se um deles aparece no out/, ela vazou para a produção.
const PROIBIDOS = [
  "__divineFalso",
  "inscricoes-cheia",
  "inscricoes-2000",
  "confirmacao-mista-3",
  "confirmacao-voce-10s",
  "ultimos-10s",
  "ganhadores-cheia",
  "ganhadores-vazia",
  "ganhadores-erro",
  "ganhadores-muitos",
  "conferir-achou",
  "conferir-nao-achou",
  "NAOC-ONFE-RE00",
]
const EXTENSOES = /\.(js|mjs|css|html|txt|json|map)$/i

function* arquivos(dir) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) yield* arquivos(caminho)
    else if (EXTENSOES.test(nome)) yield caminho
  }
}

if (!existsSync(saida)) {
  console.error("confere-producao: não achei a pasta out/. Rode `npm run build` antes.")
  process.exit(1)
}

const achados = []
for (const arquivo of arquivos(saida)) {
  const texto = readFileSync(arquivo, "utf8")
  for (const nome of PROIBIDOS) {
    if (texto.includes(nome)) achados.push(`${relative(raiz, arquivo)}: "${nome}"`)
  }
}

if (achados.length) {
  console.error("confere-producao: a camada falsa do desenvolvimento foi parar no site publicado.")
  console.error("Estes arquivos têm nomes de cenário de teste:")
  for (const a of achados) console.error("  - " + a)
  console.error("Confira lib/dados/index.ts: o import de ./falso só pode rodar em desenvolvimento.")
  process.exit(1)
}
console.log(`confere-producao: ok, nenhum cenário de teste no out/.`)
