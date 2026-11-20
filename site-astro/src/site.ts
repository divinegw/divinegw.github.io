// Configurações do site (antes em _build/site.json).
export const SITE = {
  // título da aba (pedido do usuário em 18/11/2026): na home "Guild DIVINE - Comunidade Brasileira de Guild Wars";
  // nas outras páginas "<página> - Guild DIVINE, Comunidade Brasileira de Guild Wars". "Comunidade" cumpre a designação
  // "community site" que a ArenaNet pede na barra de título (Content Terms of Use, II.4).
  aba: 'Guild DIVINE',
  comunidade: 'Comunidade Brasileira de Guild Wars',
  nome: 'Guilda DIVINE', // aba do navegador, barra dos guias, nomes para leitor de tela (Fase 4: era "Guild DIVINE")
  marca: 'DIVINE',       // o nome ao lado da logo na barra da página inicial
  discord: 'https://discord.gg/7fHMRW2xvt', // convite do Discord da guilda (barra da home, barra dos guias e rodapé)
  github: 'https://github.com/divinegw',    // organização da guilda no GitHub (rodapé)
  frase: 'Guias de Guild Wars 2 escritos pela guilda DIVINE, do primeiro squad ao Challenge Mode.', // rodapé
  atualizado: 'nov. 2026', atualizadoISO: '2026-11', // data no topo de cada guia ("Atualizado em …")
};

// Avisos legais: rodapé do site, fim de cada PDF e página de créditos.
//   FA: a frase de site de fã, em português.
//   ARENANET: o aviso obrigatório, em inglês e SEM ALTERAÇÃO (Content Terms of Use, II.5, versão de 28/10/2025,
//   https://www.arena.net/en/legal/content-terms-of-use). Se a ArenaNet mudar o texto, troque aqui.
export const AVISO = {
  fa: 'Site de fã da guilda DIVINE, sem vínculo com a ArenaNet nem com a NCSOFT. Artes e ícones do jogo são da ArenaNet.',
  arenanet: '© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Heart of Thorns, Path of Fire, End of Dragons, Secrets of the Obscure, Janthir Wilds, Visions of Eternity, and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation. All other trademarks are the property of their respective owners.',
  direitos: 'Textos e marca da guilda: todos os direitos reservados.', // depois de "© <ano> Guilda DIVINE."
};

// Os 5 guias, na ordem de leitura. Essa ordem vale para a página inicial, o rodapé e o "Próximo guia"
// do fim de cada guia (o último não tem próximo).
//   guia  = nome do arquivo em src/content/guias/ (a arte do card vem do guia)
//   marca = ícone do canto do card, sempre branco: ícone Lucide ou arquivo de src/assets/icones/;
//           "mono-…" é um PNG branco de fundo transparente, mostrado no tamanho dos ícones Lucide
//   slide = false: não entra no slide do topo da home (o guia continua em "Mais guias", no rodapé e na busca)
//   barra = false: não entra nos links da barra do topo da home (com 6 links a busca ficava cortada)
//   selo  = opcional: { tipo: 'novo' } ou { tipo: 'atualizado', data: '2026-11', rotulo: 'nov. 2026' } (hoje nenhum: o usuário tirou o "Atualizado" dos cards)
export interface Selo { tipo: 'novo' | 'atualizado'; data?: string; rotulo?: string }
//   curto = frase de uma linha no menu "Guias" da barra do topo (Cabecalho.astro)
export interface GuiaInfo { guia: string; nome: string; marca: string; texto: string; curto: string; selo?: Selo; slide?: boolean; barra?: boolean }

export const GUIAS: GuiaInfo[] = [
  { guia: 'endgame', nome: 'Endgame', marca: 'swords', curto: 'O básico antes do primeiro squad.',
    texto: 'Tudo o que você precisa entender antes do primeiro squad: boons, roles e builds. Depois, mostramos como treinar no golem e ler o ArcDPS.', },
  { guia: 'fractals', nome: 'Fractals', marca: 'mono-fractals', curto: 'Do primeiro Tier ao Challenge Mode.',
    texto: 'Do primeiro Tier ao Challenge Mode: entenda a Agony e as instabilidades e veja o caminho até a Ad Infinitum.', },
  { guia: 'raids', nome: 'Raids', marca: 'mono-raids', curto: 'Das 8 wings aos Raid Encounters.',
    texto: 'Das 8 wings aos Raid Encounters, confira os guias e vídeos de cada boss para entender melhor os encontros antes de entrar na luta.', },
  { guia: 'dungeons', nome: 'Dungeons', marca: 'mono-dungeons', curto: 'As 8 dungeons clássicas de Tyria.',
    texto: 'Confira as 8 dungeons clássicas de Tyria, com um vídeo de cada path para você chegar sabendo o caminho e as recompensas.', },
  { guia: 'recursos-uteis', nome: 'Recursos Úteis', marca: 'wrench', curto: 'Os sites que a comunidade usa.',
    texto: 'Confira os sites e ferramentas que a comunidade usa, de builds a gold, e veja o que cada um faz.', },
  { guia: 'cursores', nome: 'Divine Prisma', marca: 'mouse-pointer-2', curto: 'Cursores feitos por nós.', barra: false, // no slide desde a Fase 5 (pedido do usuário)
    texto: 'Cursores que nós fizemos para trocar o cursor do jogo: 21 desenhos e 7 cores, com instalador para o Raidcore Nexus. Dá para usar também no YoloMouse.' },
];

// "Comece por aqui" na página inicial: os guias da trilha, em ordem. Os outros aparecem em "Mais guias".
export const TRILHA = ['endgame', 'fractals', 'raids'];

export const guiaInfo = (slug: string) => GUIAS.find((g) => g.guia === slug);
export const proximoGuia = (slug: string) => {
  const i = GUIAS.findIndex((g) => g.guia === slug);
  return i < 0 ? undefined : GUIAS[i + 1];
};

// Página inicial.
export const INICIO = {
  descricao: 'Guias da guilda DIVINE para Guild Wars 2: Endgame, Raids, Fractals, Dungeons, Recursos Úteis e Divine Prisma.',
};
