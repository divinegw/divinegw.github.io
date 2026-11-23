// Histórico dos últimos 20 sorteios, salvo só neste navegador (localStorage).
// A chave é a MESMA do site de hoje ("divine-sorteios"): quem já usa continua vendo o que fez.
import { somaHistorico, type EntradaHistorico } from './local'

export const CHAVE_HISTORICO = 'divine-sorteios'
const EVENTO = 'divine:historico'

/** O texto cru que está guardado ("[]" se não há nada ou o navegador não deixa ler). */
export function lerCru(): string {
  try { return localStorage.getItem(CHAVE_HISTORICO) || '[]' } catch { return '[]' }
}

export function lerHistorico(cru = lerCru()): EntradaHistorico[] {
  try {
    const h: unknown = JSON.parse(cru)
    if (!Array.isArray(h)) return []
    // o dado vem do localStorage (e do site de hoje): descarta o item que não tem a forma esperada
    return h.filter((x): x is EntradaHistorico => (
      !!x && typeof x === 'object'
      && typeof x.modo === 'string' && typeof x.resumo === 'string' && typeof x.codigo === 'string'
      && typeof x.em === 'string' && !Number.isNaN(new Date(x.em).getTime())
      && (x.impressao === undefined || typeof x.impressao === 'string')
    ))
  } catch { return [] }
}

export function salvarNoHistorico(r: { modo: string; resumo: string; codigo: string; impressao?: string }) {
  try { localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(somaHistorico(lerHistorico(), r))) } catch { /* sem armazenamento: o histórico só não aparece */ }
  window.dispatchEvent(new Event(EVENTO))
}

export function apagarHistorico() {
  try { localStorage.removeItem(CHAVE_HISTORICO) } catch { /* nada */ }
  window.dispatchEvent(new Event(EVENTO))
}

export function assinarHistorico(aviso: () => void) {
  window.addEventListener(EVENTO, aviso)
  window.addEventListener('storage', aviso)
  return () => {
    window.removeEventListener(EVENTO, aviso)
    window.removeEventListener('storage', aviso)
  }
}
