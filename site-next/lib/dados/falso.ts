// Camada de dados FALSA do painel do sorteio: tudo em memória, nada vai para o banco.
// Só existe no desenvolvimento: lib/dados/index.ts a importa atrás de `process.env.NODE_ENV === "development"`
// e de `?falso=<cenario>` na URL. Na build de produção este arquivo não entra no pacote.
//
// Uso: http://localhost:3010/sorteio?s=teste&falso=inscricoes-cheia            (visitante)
//      ...&papel=organizador                                                   (quem organiza)
//      ...&parado=1                    congela o relógio (foto estável)
//      ...&voce=1                      você (Zyanore.3030) está inscrito e, nos cenários com resultado, ganhou
//      ...&erro=inscrever|aceitar|sortear|tirar|trocar   a próxima gravação desse tipo falha
//      /sorteio/ganhadores?falso=ganhadores-cheia|ganhadores-vazia|ganhadores-erro|ganhadores-muitos|conferir-achou|conferir-nao-achou
//        (código que acha: N8F2-M325-U72K; código que não confere: NAOC-ONFE-RE00)
// No console: window.__divineFalso.avancar(ms), .parar(), .seguir(), .conexao(false|true), .ouvintes()
import { sortearAoVivo, chaveDe, type Inscrito } from "@/lib/sorteio/ao-vivo"
import { novoCodigo } from "@/lib/sorteio/aleatorio"
import { ICONE_GEMA, type PremioInfo } from "@/lib/sorteio/premio"
import type { Dados, DadosGanhadores } from "./index"
import type { Registro, Resultado, Sorteio, Usuario, Conexao } from "./firebase"

type Papel = "visitante" | "organizador"
type Carimbo = Sorteio["fechaEm"]

class Ts {
  constructor(private ms: number) {}
  toMillis() { return this.ms }
  toDate() { return new Date(this.ms) }
}
const ts = (ms: number) => new Ts(ms) as unknown as NonNullable<Carimbo>

class FalsoErro extends Error {
  constructor(public codigo: string, mensagem: string) {
    super(mensagem)
    this.name = "ErroSorteio"
  }
}

export const CENARIOS = [
  "inscricoes-cheia", "inscricoes-vazia", "inscricoes-um", "inscricoes-2000", "ultimos-10s", "encerrado",
  "sorteando", "sorteando-aceite", "resultado-1", "resultado-3", "voce-ganhou", "voce-nao-ganhou",
  "confirmacao-esperando", "confirmacao-confirmou", "confirmacao-tempo-acabou", "confirmacao-mista-3",
  "confirmacao-mista-3-fim", "confirmacao-voce", "confirmacao-voce-10s", "organizador", "tirado",
  "sem-prazo", "nao-carregou", "nao-existe", "sem-internet",
  // página de Ganhadores (criarFalsoGanhadores)
  "ganhadores-cheia", "ganhadores-vazia", "ganhadores-erro", "ganhadores-muitos", "conferir-achou", "conferir-nao-achou",
] as const

/** Quantos ouvintes estão ligados agora, somando todos os painéis abertos. Depois de fechar o painel, tudo volta a 0. */
const CONTAGEM = { sorteio: 0, inscritos: 0, aceites: 0, conexao: 0 }
export const ouvintesLigados = () => ({ ...CONTAGEM })

const EU = "Zyanore.3030"
const PREMIO: PremioInfo = {
  tipo: "item", nome: "Abyssal Forest Dye", quantidade: 1, icone: ICONE_GEMA, raridade: "rare", descricao: "Dye · Rare", itemId: 0,
}
const NOMES = ["Kaelith.4821", "Bruno Tank.1290", "Mirela.7342", "Thorvald.5510", "Sereia Azul.0381", "Draknos.6624", "Lua.2207", "Varek.9013", "Pietra.4466", "Hoshi.1185", "Caio Necro.3302", "Aurelia.8871", "Grom.4040", "Nyx.7719", "Iara.5028", "Tavros.6612", "Belinha.2930", "Ravyn.1477", "Christopher Alexander Montgome.5678", "Benachrichtigungseinstellungen.1234", "🦊 Fox.4242", "王秀英.8888", "Ozzy.8805", "Selene.3391", "Fennick.2264", "Duda.9150", "Korrin.7036", "Maya Ele.4519", "Ruiva.6680", "Tiberius.0927", "Ana Guard.5843", "Lyra.3175", "Bastião.8412", "Elowen.2096", "Rook.7348", "Jade.4401", "Merrik.6157", "Sol.9932", "Teodoro.1820", "Vex.5574"]
const PIOR = ["Benachrichtigungseinstellungen.1234", "Christopher Alexander Montgome.5678", "Jo.0001", "dana.0042", "🦊 Fox.4242", "👩🏽‍💻 Priya.7777", "王秀英.8888", "محمد علي.3030", "Nguyễn Thị Hương.2468", "<b>Ana</b>.1234", "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.9999", "Kaelith.4821", "Bruno Tank.1290", "Mirela.7342"]

const comoInscrito = (conta: string): Inscrito => ({ chave: chaveDe(conta), conta })
const ordenar = (l: Inscrito[]) => [...l].sort((a, b) => (a.chave < b.chave ? -1 : 1))

/** Procura, entre códigos fixos, um em que `eu` ganha (ou não ganha), para o cenário ser sempre o mesmo. */
async function acharCodigo(inscritos: Inscrito[], vencedores: number, euGanha: boolean | null) {
  for (let i = 0; i < 2000; i++) {
    const codigo = `FALS-${i.toString(36).toUpperCase().padStart(4, "0")}-TEST`
    const r = await sortearAoVivo(inscritos, [], vencedores, codigo)
    if (euGanha === null || r.ganhadores.includes(EU) === euGanha) return { codigo, ...r }
  }
  const codigo = novoCodigo()
  return { codigo, ...(await sortearAoVivo(inscritos, [], vencedores, codigo)) }
}

interface Montagem {
  sorteio: Sorteio | null
  inscritos: Inscrito[]
  aceites: Set<string>
  chaveMinha: string | null
  falha: boolean
  offline: boolean
  /** resultado que aparece sozinho, 1,5 s depois de abrir (para ver a roleta de verdade) */
  sorteiaDepois?: boolean
}

export async function criarFalso(cenario: string, papelPedido: Papel | null, extras: URLSearchParams): Promise<Dados> {
  const parado = extras.get("parado") === "1"
  const voce = extras.get("voce") === "1" || cenario === "confirmacao-voce" || cenario === "confirmacao-voce-10s" || cenario === "voce-ganhou" || cenario === "voce-nao-ganhou" || cenario === "tirado"
  let erroPedido = extras.get("erro")
  let deslocamento = 0
  let congelado: number | null = parado ? Date.now() : null
  const agora = () => congelado ?? Date.now() + deslocamento
  const papel: Papel = papelPedido ?? (cenario === "organizador" ? "organizador" : "visitante")

  // ------------------------------------------------------------ montagem do cenário
  const m = await montar(cenario, voce, agora)
  let { sorteio, inscritos } = m
  let aceites = m.aceites
  let chaveMinha = m.chaveMinha
  let online = !m.offline
  const esperaOnline: (() => void)[] = []

  const ouvintes = {
    sorteio: new Set<(s: Sorteio | null) => void>(),
    inscritos: new Set<(i: Inscrito[]) => void>(),
    aceites: new Set<(c: Set<string>) => void>(),
    conexao: new Set<(o: boolean) => void>(),
  }
  const clonar = <T,>(x: T) => x
  const avisaSorteio = () => ouvintes.sorteio.forEach((f) => f(sorteio ? { ...sorteio } : null))
  const avisaInscritos = () => ouvintes.inscritos.forEach((f) => f([...inscritos]))
  const avisaAceites = () => ouvintes.aceites.forEach((f) => f(new Set(aceites)))
  const dorme = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms))
  const quandoOnline = () => (online ? Promise.resolve() : new Promise<void>((ok) => esperaOnline.push(ok)))
  const falhaSe = (tipo: string) => {
    if (erroPedido === tipo) { erroPedido = null; throw new Error(`falso: ${tipo} falhou de propósito`) }
  }

  function ouvir<T>(nome: keyof typeof CONTAGEM, grupo: Set<(x: T) => void>, aoMudar: (x: T) => void, inicial: () => T, atraso: number, aoFalhar?: (e: Error) => void, falha = false) {
    let vivo = true
    let registrado = false
    const t = setTimeout(() => {
      if (!vivo) return
      if (falha) { aoFalhar?.(new Error("falso: não carregou")); return }
      grupo.add(aoMudar)
      registrado = true
      CONTAGEM[nome]++
      aoMudar(inicial())
    }, atraso)
    return () => {
      vivo = false
      clearTimeout(t)
      grupo.delete(aoMudar)
      if (registrado) { registrado = false; CONTAGEM[nome]-- }
    }
  }

  // ------------------------------------------------------------ operações (mesma forma do firebase.ts)
  const usuario: Usuario = { uid: "falso-uid", google: false }

  const dados: Dados = {
    falso: true,
    PRAZO_ACEITE: 60_000,
    MAX_REFEITOS: 20,
    agora,
    ouvirConexao(aoMudar) {
      ouvintes.conexao.add(aoMudar)
      CONTAGEM.conexao++
      aoMudar(online)
      let ativo = true
      return () => { if (ativo) { ativo = false; CONTAGEM.conexao--; ouvintes.conexao.delete(aoMudar) } }
    },
    linkDe: (id, origem) => `${origem}/sorteio.html?s=${id}`,
    async entrar() { await dorme(100); return { ...usuario } },
    async ligarGoogle() {
      await dorme(400)
      if (erroPedido === "google") { erroPedido = null; throw new Error("falso: google falhou") }
      usuario.google = true
      return { ...usuario }
    },
    ouvirSorteio: (_id, aoMudar, aoFalhar) => {
      const parar = ouvir("sorteio", ouvintes.sorteio, aoMudar, () => (sorteio ? { ...sorteio } : null), 150, aoFalhar, m.falha)
      if (m.sorteiaDepois && !m.falha) {
        const t = setTimeout(() => { void sorteiaAgora() }, 1650)
        return () => { parar(); clearTimeout(t) }
      }
      return parar
    },
    ouvirInscritos: (_id, aoMudar, aoFalhar) => ouvir("inscritos", ouvintes.inscritos, aoMudar, () => [...inscritos], 200, aoFalhar, m.falha),
    ouvirAceites: (_id, aoMudar, aoFalhar) => ouvir("aceites", ouvintes.aceites, aoMudar, () => new Set(aceites), 120, aoFalhar, m.falha),
    async conectar(): Promise<Conexao> {
      await dorme(80)
      return { organizador: papel === "organizador", tokenRecusado: cenario === "token-recusado", chaveMinha }
    },
    async tokenOrganizador() { return "token-falso-so-para-teste" },
    guardarToken() {},
    async inscrever(_id, conta) {
      await quandoOnline()
      await dorme(600)
      falhaSe("inscrever")
      if (!sorteio || !sorteio.aberto || sorteio.resultado) throw new Error("falso: fechado")
      const chave = chaveDe(conta)
      if (inscritos.some((p) => p.chave === chave)) throw new Error("falso: já inscrito")
      inscritos = ordenar([...inscritos, comoInscrito(conta)])
      chaveMinha = chave
      avisaInscritos()
      return chave
    },
    async aceitar(_id, chave) {
      await quandoOnline()
      await dorme(400)
      falhaSe("aceitar")
      aceites = new Set([...aceites, chave])
      avisaAceites()
    },
    async tirarParticipante(_id, chave, conta) {
      await dorme(300)
      falhaSe("tirar")
      inscritos = inscritos.filter((p) => p.chave !== chave)
      if (sorteio) sorteio = { ...sorteio, tirados: [...(sorteio.tirados ?? []), conta] }
      avisaInscritos(); avisaSorteio()
    },
    async encerrarInscricoes() {
      await dorme(200)
      if (sorteio) sorteio = { ...sorteio, aberto: false }
      avisaSorteio()
    },
    async reabrirInscricoes() {
      await dorme(200)
      if (sorteio) sorteio = { ...sorteio, aberto: true, fechaEm: null }
      avisaSorteio()
    },
    async sortear(_id, s, lista, excluidos) {
      falhaSe("sortear")
      const n = lista.length - excluidos.length
      if (n < 1) throw new FalsoErro("sem-inscritos", "Ainda não tem ninguém inscrito para sortear.")
      const anterior = s.resultado
      if (anterior && (s.historico ?? []).length >= 20) throw new FalsoErro("limite-refeito", "Este sorteio já foi refeito 20 vezes, que é o máximo. Abra um sorteio novo.")
      const codigo = novoCodigo()
      const r = await sortearAoVivo(lista, excluidos, s.vencedores, codigo)
      const resultado: Resultado = { ...r, codigo, excluidos, mantidos: [], em: ts(agora()), prazo: s.aceite ? ts(agora() + 60_000) : null }
      sorteio = { ...s, aberto: false, resultado, historico: anterior ? [...(s.historico ?? []), anterior] : s.historico }
      aceites = new Set()
      avisaSorteio(); avisaAceites()
      return resultado
    },
    async sortearDeNovo(...a) { return dados.sortear(...a) },
    async trocarAusentes(_id, s, lista, aceitos, fora) {
      falhaSe("trocar")
      const r = s.resultado
      if (!r) return null
      const mant = r.ganhadores.filter((n) => aceitos.has(chaveDe(n)))
      const sem = r.ganhadores.filter((n) => !aceitos.has(chaveDe(n)))
      const exc = [...new Set([...r.excluidos, ...fora, ...sem.map(chaveDe), ...mant.map(chaveDe)])]
      const livres = lista.filter((p) => !exc.includes(p.chave)).length
      if (!sem.length) return null
      if (livres < 1) throw new FalsoErro("sem-livres", "Não sobrou ninguém para sortear: todo mundo que se inscreveu já ganhou ou não aceitou.")
      if ((s.historico ?? []).length >= 20) throw new FalsoErro("limite-refeito", "Este sorteio já foi refeito 20 vezes, que é o máximo. Abra um sorteio novo.")
      const codigo = novoCodigo()
      const x = await sortearAoVivo(lista, exc, Math.min(sem.length, livres), codigo)
      const novo: Resultado = { ganhadores: [...mant, ...x.ganhadores], codigo, impressao: x.impressao, total: r.total, excluidos: exc, mantidos: mant, em: ts(agora()), prazo: ts(agora() + 60_000) }
      sorteio = { ...s, resultado: novo, historico: [...(s.historico ?? []), r], ausentes: [...(s.ausentes ?? []), ...sem] }
      avisaSorteio()
      return novo
    },
    async apagarSorteio() {
      await dorme(300)
      sorteio = null
      avisaSorteio()
    },
  }

  /** Cenário "sorteando": o resultado chega depois da abertura, como se quem organiza tivesse clicado. */
  async function sorteiaAgora() {
    if (!sorteio || sorteio.resultado) return
    const r = await sortearAoVivo(inscritos, [], sorteio.vencedores, "FALS-ROLE-TA00")
    sorteio = { ...sorteio, aberto: false, resultado: { ...r, codigo: "FALS-ROLE-TA00", excluidos: [], mantidos: [], em: ts(agora()), prazo: sorteio.aceite ? ts(agora() + 60_000) : null } }
    avisaSorteio()
  }

  // ------------------------------------------------------------ alças de teste no console
  if (typeof window !== "undefined") {
    const alca = {
      avancar(ms: number) { if (congelado !== null) congelado += ms; else deslocamento += ms },
      parar() { congelado = agora() },
      seguir() { if (congelado !== null) { deslocamento = congelado - Date.now(); congelado = null } },
      conexao(sim: boolean) {
        online = sim
        ouvintes.conexao.forEach((f) => f(sim))
        if (sim) esperaOnline.splice(0).forEach((f) => f())
      },
      ouvintes: () => ({ ...CONTAGEM }),
      estado: () => clonar({ sorteio, inscritos: inscritos.length, aceites: [...aceites], chaveMinha }),
    }
    ;(window as unknown as { __divineFalso: typeof alca }).__divineFalso = alca
  }
  return dados
}

// ------------------------------------------------------------ página de Ganhadores
/** Registros falsos para a página de Ganhadores. Cada um bate com a conta de verdade (código e lista), menos "NAOC-ONFE-RE00",
 *  que tem um ganhador trocado para mostrar o "Não confere". Nomes e prêmios no pior caso (comprimento, emoji, HTML). */
async function registrosFalsos(quantos: number): Promise<Registro[]> {
  const inscritos = PIOR.map(comoInscrito)
  const premios: { premio: string; info: PremioInfo | null }[] = [
    { premio: "Abyssal Forest Dye", info: PREMIO },
    { premio: "1.000 gemas", info: { tipo: "gemas", nome: "Gemas", quantidade: 1000, icone: ICONE_GEMA, raridade: "gema", descricao: "", itemId: 0 } },
    { premio: "Gift of Battle", info: { tipo: "item", nome: "Gift of Battle", quantidade: 1, icone: ICONE_GEMA, raridade: "legendary", descricao: "", itemId: 0 } },
    { premio: "Um prêmio com um nome muito, muito, muito comprido mesmo, daqueles que quebram o card em duas linhas ou mais", info: null },
    { premio: "250 de ouro", info: { tipo: "ouro", nome: "Ouro", quantidade: 250, icone: "", raridade: "ouro", descricao: "", itemId: 0 } },
    { premio: "Visions of Eternity", info: { tipo: "expansao", nome: "Visions of Eternity", quantidade: 1, icone: "", raridade: "expansao", descricao: "", itemId: 0 } },
  ]
  const titulos = ["Sorteio da live de sexta", "1º Sorteio da live especial de fim de mês com um título bem longo, de 80 letras!!", "Raid training de quarta", "<b>Sorteio</b> relâmpago"]
  const vencedores = [1, 3, 1, 6, 1, 2, 1, 14]
  const agora = Date.now()
  const saida: Registro[] = []
  for (let i = 0; i < quantos; i++) {
    const codigo = i === 0 ? "N8F2-M325-U72K" : i === 1 ? "NAOC-ONFE-RE00" : `FALS-${i.toString(36).toUpperCase().padStart(4, "0")}-TEST`
    const v = vencedores[i % vencedores.length]
    const x = await sortearAoVivo(inscritos, [], v, codigo)
    const p = premios[i % premios.length]
    const ganhadores = i === 1 ? ["Intruso.0000", ...x.ganhadores.slice(1)] : x.ganhadores
    saida.push({
      id: `falso-${i}`, titulo: titulos[i % titulos.length], premio: p.premio, premioInfo: p.info, ganhadores, codigo,
      impressao: x.impressao, total: x.total, excluidos: [], participantes: PIOR, refeito: i % 5 === 2 ? 2 : 0,
      data: agora - i * 86_400_000 - 3_600_000, mantidos: [], ausentes: i % 4 === 3 ? ["Lua.2207"] : [],
    })
  }
  return saida
}

/** Dados falsos da página de Ganhadores: ?falso=ganhadores-cheia | ganhadores-vazia | ganhadores-erro | ganhadores-muitos | conferir-achou | conferir-nao-achou. */
export function criarFalsoGanhadores(cenario: string): DadosGanhadores {
  const dorme = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms))
  const sinalOu = (sinal?: AbortSignal) => { if (sinal?.aborted) throw new DOMException("cancelado", "AbortError") }
  let cache: Promise<Registro[]> | null = null
  const todos = () => (cache ??= registrosFalsos(cenario === "ganhadores-muitos" ? 50 : cenario === "ganhadores-vazia" ? 0 : 12))
  return {
    falso: true,
    async lerRegistros(quantos, sinal) {
      await dorme(900)
      sinalOu(sinal)
      if (cenario === "ganhadores-erro") throw new Error("falso: não carregou")
      return (await todos()).slice(0, quantos)
    },
    async lerRegistroPorCodigo(codigo, sinal) {
      await dorme(700)
      sinalOu(sinal)
      if (cenario === "ganhadores-erro") throw new Error("falso: não carregou")
      if (cenario === "conferir-nao-achou" || cenario === "ganhadores-vazia") return null
      return (await todos()).find((r) => r.codigo === codigo) ?? null
    },
  }
}

// ------------------------------------------------------------ cenários
async function montar(cenario: string, voce: boolean, agora: () => number): Promise<Montagem> {
  const t0 = agora()
  const base = (_nomes: string[], extra: Partial<Sorteio> = {}): Sorteio => ({
    titulo: "1º Sorteio da live especial de fim de mês!", premio: "Abyssal Forest Dye", descricao: "Uma ótima tinta!",
    vencedores: 1, dono: "outro-uid", fechaEm: ts(t0 + (13 * 60 + 23) * 1000), aberto: true, resultado: null,
    expiraEm: ts(t0 + 86_400_000), google: false, historico: [], tirados: [], premioInfo: PREMIO, aceite: false, ausentes: [],
    ...extra,
  })

  const lista40 = (comEu: boolean) => ordenar((comEu ? [...NOMES.slice(0, 39), EU] : NOMES).map(comoInscrito))
  const vazio: Montagem = { sorteio: null, inscritos: [], aceites: new Set(), chaveMinha: null, falha: false, offline: false }
  const inscritos = lista40(voce)
  const minha = voce ? chaveDe(EU) : null

  async function comResultado(opcoes: { vencedores: number; aceite: boolean; euGanha: boolean | null; idadeMs: number; prazoEm?: number; aceitos?: (g: string[]) => string[] }): Promise<Montagem> {
    const c = await acharCodigo(inscritos, opcoes.vencedores, voce ? opcoes.euGanha : false)
    const prazo = opcoes.aceite ? ts(t0 + (opcoes.prazoEm ?? 47_000)) : null
    const s = base(inscritos.map((p) => p.conta), {
      vencedores: opcoes.vencedores, aceite: opcoes.aceite, aberto: false,
      resultado: { ganhadores: c.ganhadores, codigo: c.codigo, impressao: c.impressao, total: c.total, excluidos: [], mantidos: [], em: ts(t0 - opcoes.idadeMs), prazo },
    })
    return { ...vazio, sorteio: s, inscritos, aceites: new Set((opcoes.aceitos?.(c.ganhadores) ?? []).map(chaveDe)), chaveMinha: minha }
  }

  switch (cenario) {
    case "inscricoes-cheia":
    case "organizador":
    case "sem-internet":
      return { ...vazio, sorteio: base([]), inscritos, chaveMinha: minha, offline: cenario === "sem-internet" }
    case "inscricoes-vazia":
      return { ...vazio, sorteio: base([]) }
    case "inscricoes-um":
      return { ...vazio, sorteio: base([]), inscritos: [comoInscrito("Kaelith.4821")] }
    case "inscricoes-2000": {
      const mil = Array.from({ length: 2000 }, (_, i) => comoInscrito(`${PIOR[i % PIOR.length].replace(/\.\d{4}$/, "")}.${String(i).padStart(4, "0")}`))
      return { ...vazio, sorteio: base([]), inscritos: ordenar(mil), chaveMinha: null }
    }
    case "ultimos-10s":
      return { ...vazio, sorteio: base([], { fechaEm: ts(t0 + 9_500) }), inscritos, chaveMinha: minha }
    case "sem-prazo":
      return { ...vazio, sorteio: base([], { fechaEm: null }), inscritos, chaveMinha: minha }
    case "encerrado":
      return { ...vazio, sorteio: base([], { aberto: false }), inscritos, chaveMinha: minha }
    case "sorteando":
      return { ...vazio, sorteio: base([], { vencedores: 1 }), inscritos, chaveMinha: minha, sorteiaDepois: true }
    case "sorteando-aceite":
      return { ...vazio, sorteio: base([], { vencedores: 1, aceite: true }), inscritos, chaveMinha: minha, sorteiaDepois: true }
    case "resultado-1":
    case "voce-nao-ganhou":
      return comResultado({ vencedores: 1, aceite: false, euGanha: false, idadeMs: 600_000 })
    case "resultado-3":
      return comResultado({ vencedores: 3, aceite: false, euGanha: false, idadeMs: 600_000 })
    case "voce-ganhou":
      return comResultado({ vencedores: 1, aceite: false, euGanha: true, idadeMs: 600_000 })
    case "confirmacao-esperando":
      return comResultado({ vencedores: 1, aceite: true, euGanha: false, idadeMs: 600_000, prazoEm: 47_000 })
    case "confirmacao-voce":
      return comResultado({ vencedores: 1, aceite: true, euGanha: true, idadeMs: 600_000, prazoEm: 47_000 })
    case "confirmacao-voce-10s":
      return comResultado({ vencedores: 1, aceite: true, euGanha: true, idadeMs: 600_000, prazoEm: 9_500 })
    case "confirmacao-confirmou":
      return comResultado({ vencedores: 1, aceite: true, euGanha: false, idadeMs: 600_000, prazoEm: 20_000, aceitos: (g) => [g[0]] })
    case "confirmacao-tempo-acabou":
      return comResultado({ vencedores: 1, aceite: true, euGanha: false, idadeMs: 600_000, prazoEm: -3_000 })
    case "confirmacao-mista-3":
      return comResultado({ vencedores: 3, aceite: true, euGanha: false, idadeMs: 600_000, prazoEm: 25_000, aceitos: (g) => [g[0]] })
    case "confirmacao-mista-3-fim":
      return comResultado({ vencedores: 3, aceite: true, euGanha: false, idadeMs: 600_000, prazoEm: -3_000, aceitos: (g) => [g[0]] })
    case "tirado": {
      const sem = inscritos.filter((p) => p.chave !== chaveDe(EU))
      return { ...vazio, sorteio: base([], { tirados: [EU] }), inscritos: sem, chaveMinha: chaveDe(EU) }
    }
    case "nao-carregou":
      return { ...vazio, falha: true }
    case "nao-existe":
      return { ...vazio, sorteio: null }
    default:
      return { ...vazio, sorteio: base([]), inscritos }
  }
}
