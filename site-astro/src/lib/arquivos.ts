// Acha ícones (src/assets/icones/) e imagens dos guias (src/assets/guias/) pelo nome.
import type { ImageMetadata } from 'astro';

const icones = import.meta.glob<ImageMetadata>('../assets/icones/*.{png,webp,jpg}', { eager: true, import: 'default' });
const imagens = import.meta.glob<ImageMetadata>('../assets/guias/**/*.{png,webp,jpg,jpeg}', { eager: true, import: 'default' });

const porNome = new Map(Object.entries(icones).map(([k, v]) => [k.replace(/^.*\/|\.\w+$/g, ''), v]));

/** "agony" -> src/assets/icones/agony.(png|webp|jpg) */
export const icone = (nome: string) => porNome.get(nome);

/** "raids/spirit-vale.jpg" -> src/assets/guias/raids/spirit-vale.jpg */
export function imagem(caminho: string): ImageMetadata {
  const img = imagens[`../assets/guias/${caminho}`];
  if (!img) throw new Error(`Imagem não encontrada: src/assets/guias/${caminho}`);
  return img;
}
