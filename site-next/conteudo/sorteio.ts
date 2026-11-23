// Cópia até a Etapa 6: mude nos dois (site-astro/src/sorteio.ts e este arquivo).
// Configuração do sorteio online (/sorteio.html). Projeto Firebase "divine-sorteio" (plano Spark, grátis), criado em 20/11/2026.
// Enquanto FIREBASE for null, a parte online não aparece e os links de inscrição (?s=...) mostram um aviso.
// Como ligar: site-astro/firebase/LEIA-ME.md. Estes valores NÃO são segredo: o Firebase foi feito para eles ficarem
// no site. Quem protege os dados são as regras (site-astro/firebase/firestore.rules).
export const FIREBASE: null | {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
} = {
  apiKey: 'AIzaSyDxAYmeCF0NbozS5RKwra-SCGfky5eqEmU',
  authDomain: 'divine-sorteio.firebaseapp.com',
  projectId: 'divine-sorteio',
  appId: '1:3945500132:web:33d97603ba9659debb0bf1',
};
