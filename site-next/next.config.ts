import type { NextConfig } from "next";

// Site estático no GitHub Pages (divinegw.github.io), servido na raiz, sem servidor.
// O plano está em design-system/plano-site/PLANO.md (fora do git).
const nextConfig: NextConfig = {
  // Gera out/ com um .html por rota: /guias/fractals.html, /sorteio.html (as URLs de hoje).
  output: "export",
  trailingSlash: false,
  // O modo estático não otimiza imagens; as imagens são geradas pelo scripts/imagens.mjs (Etapa 4/5).
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
