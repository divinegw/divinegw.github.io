// Cópia de site-astro/src/lib/sorteio/roleta.ts (Etapa 2c), mesma lógica. As cores vêm de quem usa, lidas dos tokens do site novo (ver AbaLista).
// Roleta do sorteador, desenhada num <canvas> (400 × 400 px lógicos). Usada pelo /sorteio.html.
// O canvas é decorativo (aria-hidden): o resultado sempre sai em texto, fora dele.
// As cores vêm de quem usa: 4 fundos que se revezam, 4 tintas de texto (uma para cada fundo) e a cor das linhas.

export interface CoresRoleta { fundos: string[]; tintas: string[]; linha: string; fonte: string }

/** Resolve qualquer cor CSS (inclusive var(--x) e light-dark()) para rgb, no contexto de `onde`. */
export function corCss(valor: string, onde: Element = document.body) {
  const p = document.createElement('span');
  p.style.color = valor;
  onde.append(p);
  const c = getComputedStyle(p).color;
  p.remove();
  return c;
}

const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Roleta {
  ctx: CanvasRenderingContext2D;
  giro = 0;
  itens: { nome: string; peso: number }[] = [];
  private paleta: CoresRoleta | null = null; // fixada durante o giro
  constructor(canvas: HTMLCanvasElement, public cores: () => CoresRoleta) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = 400 * dpr; canvas.height = 400 * dpr;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
  }
  desenha() {
    const { ctx, itens } = this;
    const total = itens.reduce((s, x) => s + x.peso, 0);
    const { fundos, tintas, linha, fonte } = this.paleta ?? this.cores();
    ctx.clearRect(0, 0, 400, 400);
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(this.giro);
    let a = -Math.PI / 2;
    const rotulos = itens.length <= 60;
    // cores em rodízio; a última fatia não pode repetir a cor da vizinha nem a da primeira
    const n = fundos.length;
    const ks = itens.map((_, i) => i % n);
    const u = ks.length - 1;
    if (u > 0 && ks[u] === ks[0]) ks[u] = [...Array(n).keys()].find((k) => k !== ks[0] && k !== ks[u - 1])!;
    itens.forEach((x, i) => {
      const fatia = (x.peso / total) * Math.PI * 2;
      const k = ks[i];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 192, a, a + fatia); ctx.closePath();
      ctx.fillStyle = fundos[k]; ctx.fill();
      ctx.strokeStyle = linha; ctx.lineWidth = 1.5; ctx.stroke();
      if (rotulos && fatia > 0.12) {
        ctx.save();
        ctx.rotate(a + fatia / 2);
        ctx.fillStyle = tintas[k];
        ctx.font = `600 ${itens.length > 30 ? 12 : 14}px ${fonte}`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        const t = x.nome.length > 18 ? `${x.nome.slice(0, 17)}…` : x.nome;
        ctx.fillText(t, 180, 0);
        ctx.restore();
      }
      a += fatia;
    });
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fillStyle = linha; ctx.fill();
    ctx.restore();
  }
  /** Gira até o item `alvo` parar embaixo do ponteiro (no alto). `sorte` (0–1) escolhe o ponto dentro da fatia. */
  async gira(alvo: number, sorte: number, ms: number) {
    const total = this.itens.reduce((s, x) => s + x.peso, 0);
    let ini = 0;
    for (let i = 0; i < alvo; i++) ini += this.itens[i].peso;
    const meio = ((ini + this.itens[alvo].peso * (0.15 + 0.7 * sorte)) / total) * Math.PI * 2;
    const volta = Math.PI * 2;
    const atual = ((this.giro % volta) + volta) % volta;
    const fim = this.giro - atual + volta * 6 + ((volta - meio) % volta);
    if (reduzido() || ms === 0) { this.giro = fim; this.desenha(); return; }
    const de = this.giro;
    const t0 = performance.now();
    this.paleta = this.cores();
    await new Promise<void>((ok) => {
      const passo = (t: number) => {
        const p = Math.min((t - t0) / ms, 1);
        this.giro = de + (fim - de) * (1 - Math.pow(1 - p, 4));
        this.desenha();
        if (p < 1) requestAnimationFrame(passo); else { this.paleta = null; ok(); }
      };
      requestAnimationFrame(passo);
    });
  }
}
