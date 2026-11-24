// Estado da internet, sem Firebase: o navegador avisa quando a conexão cai e volta.
// O painel do sorteio usa isto para mostrar a faixa "Sem conexão". Devolve a função que cancela.
export function ouvirConexao(aoMudar: (online: boolean) => void): () => void {
  const sobe = () => aoMudar(true)
  const desce = () => aoMudar(false)
  window.addEventListener("online", sobe)
  window.addEventListener("offline", desce)
  aoMudar(navigator.onLine)
  return () => {
    window.removeEventListener("online", sobe)
    window.removeEventListener("offline", desce)
  }
}
