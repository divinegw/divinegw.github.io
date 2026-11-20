// Dados da página de créditos (/creditos.html). Fontes e licenças conferidas em 18/11/2026
// (relatório completo: design-system/auditoria-direitos.md).
//
// Ao mudar o site, atualize aqui:
//   - imagem nova da Wiki: some em CAPTURAS_WIKI (nome exato do arquivo na Wiki);
//   - ícone novo de banco de ícones: entra em ICONES_TERCEIROS com autor e link (o Flaticon exige);
//   - vídeo de um canal novo: entra em CANAIS (a página não mostra quantos vídeos; o número só ordena a lista).

const WIKI = 'https://wiki.guildwars2.com/wiki/File:';
export const arquivoWiki = (arquivo: string) => WIKI + encodeURIComponent(arquivo).replace(/%2F/g, '/');

/** Capturas do jogo publicadas na Guild Wars 2 Wiki (marcadas "ArenaNet image, screenshot"), usadas nos cards de Fractals. */
export const CAPTURAS_WIKI: { fractal: string; arquivo: string }[] = [
  { fractal: 'Aetherblade', arquivo: 'Aetherblade_Fractal.jpg' },
  { fractal: 'Aquatic Ruins', arquivo: 'Aquatic_Ruins_Fractal.jpg' },
  { fractal: 'Captain Mai Trin Boss', arquivo: 'Captain_Mai_Trin_Boss_Instance.jpg' },
  { fractal: 'Chaos', arquivo: 'Chaos_Fractal.jpg' },
  { fractal: 'Cliffside', arquivo: 'Cliffside_Fractal.jpg' },
  { fractal: 'Deepstone', arquivo: 'Deepstone_Fractal.jpg' },
  { fractal: 'Lonely Tower', arquivo: 'Deimos_(Lonely_Tower_Fractal).jpg' },
  { fractal: 'Molten Boss', arquivo: 'Molten_Boss_Fractal.jpg' },
  { fractal: 'Molten Furnace', arquivo: 'Molten_Furnace_Fractal.jpg' },
  { fractal: 'Nightmare', arquivo: 'Nightmare_Fractal.jpg' },
  { fractal: 'Shattered Observatory', arquivo: 'Shattered_Observatory_Fractal.jpg' },
  { fractal: "Siren's Reef", arquivo: "Siren's_Reef_Fractal.jpg" },
  { fractal: 'Snowblind', arquivo: 'Snowblind_Fractal.jpg' },
  { fractal: 'Solid Ocean', arquivo: 'Solid_Ocean_Fractal.jpg' },
  { fractal: 'Solitary Throne', arquivo: 'Solitary_Throne_Fractal.jpg' },
  { fractal: 'Sunqua Peak', arquivo: 'Sunqua_Peak_Fractal.jpg' },
  { fractal: 'Swampland', arquivo: 'Swampland_Fractal.jpg' },
  { fractal: 'Thaumanova Reactor', arquivo: 'Thaumanova_Reactor_Fractal.jpg' },
  { fractal: 'Twilight Oasis', arquivo: 'Twilight_Oasis_Fractal.jpg' },
  { fractal: 'Uncategorized', arquivo: 'Uncategorized_Fractal.jpg' },
  { fractal: 'Underground Facility', arquivo: 'Underground_Facility_Fractal.jpg' },
  { fractal: 'Urban Battleground', arquivo: 'Urban_Battleground_Fractal.jpg' },
  { fractal: 'Volcanic', arquivo: 'Volcanic_Fractal.jpg' },
];

/** Outros arquivos da Guild Wars 2 Wiki (ArenaNet image) usados como base de arte ou como captura. */
export const OUTRAS_WIKI: { uso: string; nome: string; arquivo: string }[] = [
  { uso: 'Endgame, arte da Introdução', nome: 'Nexus of Eternity 1', arquivo: 'Nexus_of_Eternity_1.jpg' },
  { uso: 'Raids, ilustração do Challenge Mote', nome: 'Challenge Mote (red)', arquivo: 'Challenge_Mote_(red).jpg' },
  { uso: 'Raids, Coalescence (captura da página da Wiki)', nome: 'Legendary unlock book', arquivo: 'Legendary_unlock_book.png' },
];

/** Ícones de bancos de ícones. Termos do Flaticon (abril de 2026, seção 8.1): crédito ao Flaticon e ao autor. */
export const ICONES_TERCEIROS = [
  { onde: 'Dungeons (card da página inicial)', nome: 'Dark', url: 'https://www.flaticon.com/free-icon/dark_15157411', autor: 'cube29', autorUrl: 'https://www.flaticon.com/authors/cube29' },
  { onde: 'Raids (card da página inicial)', nome: 'Portal', url: 'https://www.flaticon.com/free-icon/portal_8033974', autor: 'Magnific', autorUrl: 'https://www.flaticon.com/authors/magnific' },
  { onde: 'Fractals (card da página inicial)', nome: 'Spiral galaxy', url: 'https://www.flaticon.com/free-icon/spiral-galaxy_1960638', autor: 'Magnific', autorUrl: 'https://www.flaticon.com/authors/magnific' },
];

/** Canais do YouTube dos vídeos linkados nos guias (autor de cada vídeo conferido pelo oEmbed do YouTube). */
export const CANAIS: { nome: string; url: string; videos: number }[] = [
  { nome: 'MuklukYoutube', url: 'https://www.youtube.com/@MuklukYoutube', videos: 89 },
  { nome: 'AyinMaiden', url: 'https://www.youtube.com/@AyinMaiden', videos: 12 },
  { nome: 'Sarcastic Gaming', url: 'https://www.youtube.com/@SarcasticGaming', videos: 5 },
  { nome: 'Almost Alien Creature', url: 'https://www.youtube.com/@almostaliencreature6812', videos: 3 },
  { nome: 'Syrma Gaming', url: 'https://www.youtube.com/@SyrmaGaming', videos: 3 },
  { nome: 'Banter Bill', url: 'https://www.youtube.com/@banterbillbill', videos: 2 },
  { nome: 'Yoshuka', url: 'https://www.youtube.com/@Yoshuka', videos: 2 },
  { nome: 'REMagic', url: 'https://www.youtube.com/@remagic6432', videos: 2 },
  { nome: '4649', url: 'https://www.youtube.com/@4649-q7q', videos: 1 },
  { nome: 'Aiko', url: 'https://www.youtube.com/@Mynameistakenbysomeoneelse', videos: 1 },
  { nome: 'Dropbear', url: 'https://www.youtube.com/@dropbear8861', videos: 1 },
  { nome: 'Earthwurm Jim', url: 'https://www.youtube.com/@earthwurmjimthefirst', videos: 1 },
  { nome: 'Fr0zenShadow', url: 'https://www.youtube.com/@ITookACookie', videos: 1 },
  { nome: 'GameDude', url: 'https://www.youtube.com/@gamedude7504', videos: 1 },
  { nome: 'GilGalad Gaming', url: 'https://www.youtube.com/@GilGaladGaming', videos: 1 },
  { nome: 'Henne', url: 'https://www.youtube.com/@HenneGW2', videos: 1 },
  { nome: 'Heroic Flamingo', url: 'https://www.youtube.com/@HeroicFlamingo', videos: 1 },
  { nome: 'Jobexi', url: 'https://www.youtube.com/@Jobexi17', videos: 1 },
  { nome: 'MintayRee', url: 'https://www.youtube.com/@mintayree1363', videos: 1 },
  { nome: 'Pfandflaschenmodus', url: 'https://www.youtube.com/@pfandflaschenmodus6750', videos: 1 },
  { nome: 'Plenyx', url: 'https://www.youtube.com/@Plenyx', videos: 1 },
  { nome: 'RYUU', url: 'https://www.youtube.com/@ryuugw2', videos: 1 },
  { nome: 'Silabus', url: 'https://www.youtube.com/@Silabus1290', videos: 1 },
  { nome: 'Top Digital Gaming', url: 'https://www.youtube.com/@topdigitalgaming', videos: 1 },
  { nome: 'Vallun', url: 'https://www.youtube.com/@Vallun', videos: 1 },
  { nome: 'Wolf GW2', url: 'https://www.youtube.com/@Wolf-gw2', videos: 1 },
];

/** Sites consultados para escrever os guias (os guias linkam para eles; nenhum texto foi copiado). */
export const CONSULTA = [
  { nome: 'Guild Wars 2 Wiki', url: 'https://wiki.guildwars2.com/' },
  { nome: 'Snow Crows', url: 'https://snowcrows.com/' },
  { nome: 'GuildJen', url: 'https://guildjen.com/' },
  { nome: 'Hardstuck', url: 'https://hardstuck.gg/' },
  { nome: 'Discretize', url: 'https://discretize.eu/' },
];
