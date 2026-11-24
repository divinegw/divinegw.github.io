// Cópia de site-astro/src/site.ts até a Etapa 4, quando o Astro sai: mude nos dois.
// Só o que a barra do topo e o rodapé usam.

export const SITE = {
  nome: "Guilda DIVINE", // nomes para leitor de tela e o © do rodapé
  marca: "DIVINE",       // o nome ao lado da logo
  discord: "https://discord.gg/7fHMRW2xvt", // convite do Discord da guilda
  github: "https://github.com/divinegw",    // organização da guilda no GitHub
  frase: "Guias de Guild Wars 2 escritos pela guilda DIVINE, do primeiro squad ao Challenge Mode.",
};

// Endereço do site publicado. Todo link copiado ou compartilhado usa este, nunca window.location.origin
// (quem cria um sorteio pelo servidor local não pode receber um link "localhost").
export const ORIGEM_SITE = "https://divinegw.github.io";

// Avisos legais do rodapé.
//   arenanet: o aviso obrigatório, em inglês e SEM ALTERAÇÃO (Content Terms of Use, II.5, versão de 28/10/2025).
export const AVISO = {
  fa: "Site de fã da guilda DIVINE, sem vínculo com a ArenaNet nem com a NCSOFT. Artes e ícones do jogo são da ArenaNet.",
  arenanet:
    "© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Heart of Thorns, Path of Fire, End of Dragons, Secrets of the Obscure, Janthir Wilds, Visions of Eternity, and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation. All other trademarks are the property of their respective owners.",
  direitos: "Textos e marca da guilda: todos os direitos reservados.", // depois de "© <ano> Guilda DIVINE."
};

// Os guias, na ordem de leitura (guia = nome do arquivo em src/content/guias/).
export const GUIAS = [
  { guia: "endgame", nome: "Endgame" },
  { guia: "fractals", nome: "Fractals" },
  { guia: "raids", nome: "Raids" },
  { guia: "dungeons", nome: "Dungeons" },
  { guia: "recursos-uteis", nome: "Recursos Úteis" },
  { guia: "cursores", nome: "Divine Prisma" },
];
