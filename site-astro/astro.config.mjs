// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeDivine from './src/rehype-divine.mjs';

export default defineConfig({
  // Site de organização do GitHub Pages (divinegw/divinegw.github.io), servido na raiz: sem `base`.
  site: 'https://divinegw.github.io',
  // Mantém as URLs atuais: /guias/fractals.html
  build: {
    format: 'file',
    assets: 'assets/astro', // sem "_" no nome: o Jekyll do GitHub Pages ignora pastas com "_"
    inlineStylesheets: 'always', // CSS (~5 KB gzip) dentro do HTML: nada bloqueia a primeira pintura
  },
  markdown: {
    smartypants: false, // não trocar ' e " por aspas tipográficas
    rehypePlugins: [rehypeDivine],
  },
  image: {
    layout: 'constrained',
    breakpoints: [380, 760, 1140, 1520],
  },
  integrations: [mdx()],
});
