import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mesmo alias "@" do tsconfig.json. Os testes rodam em Node (sem DOM): o sorteio não precisa de navegador.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: { environment: 'node', include: ['testes/**/*.test.ts'] },
});
