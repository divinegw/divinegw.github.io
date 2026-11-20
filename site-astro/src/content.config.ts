import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Cada guia é um arquivo src/content/guias/<slug>.mdx -> /guias/<slug>.html
export const collections = {
  guias: defineCollection({
    loader: glob({ pattern: '*.mdx', base: './src/content/guias' }),
    schema: ({ image }) =>
      z.object({
        title: z.string(), // "Guia de Fractals"
        description: z.string(), // uma frase, aparece no topo
        arte: image(), // arte do topo (wallpaper largo)
        // onde está o assunto da arte (personagem), como em object-position: "x y". Vale para o topo do guia,
        // o slide e os cards da home e o "Próximo guia": a arte é cortada para caber e o foco não sai do quadro
        foco: z.string().default('50% 40%'),
        // autor ou autores do guia, no topo ao lado da data: 'Raishin' -> "Autor: Raishin";
        // ['Raishin', 'Zyanore'] -> "Autores: Raishin e Zyanore" (quem escreveu a base primeiro)
        autor: z.union([z.string(), z.array(z.string()).min(1)]).optional(),
        quebra: z.boolean().default(true), // false: capítulos seguem na mesma página do PDF
        sumario: z.record(z.string(), z.string()).default({}), // id -> texto no "Neste guia", quando difere do título
      }),
  }),
};
