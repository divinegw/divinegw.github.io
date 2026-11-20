// Galeria (/galeria.html): as artes que a guilda fez para os guias.
//   arquivo = <grupo>-<vaga>: a imagem do site é src/assets/galeria/<arquivo>.jpg (gerada por scripts/galeria.mjs)
//             e o PNG em alta é <arquivo>.png no Release do GitHub (GALERIA.release)
//   titulo  = nome oficial no jogo · detalhe = o que mais aparece na arte (wing, boss, lugar)
//   guia / ancora = onde a arte aparece no site ("Ver no guia")
// Os grupos seguem a ordem de leitura de GUIAS (site.ts); dentro do grupo, a ordem do guia.

export const GALERIA = {
  // PNGs de 3200 px, exatamente como saíram do Upscayl (Remacri 2x), anexados ao Release "galeria-v1"
  // do repositório do site. Trocar uma arte: substitua o anexo de mesmo nome no Release; o link não muda.
  release: 'https://github.com/divinegw/divinegw.github.io/releases/download/galeria-v1/',
  largura: 3200,
};

export interface Arte { arquivo: string; titulo: string; detalhe?: string; guia: string; ancora?: string }

const fractal = (vaga: string, titulo: string): Arte =>
  ({ arquivo: `fractals-${vaga}`, titulo: `${titulo} Fractal`, guia: 'fractals', ancora: vaga });
const dungeon = (vaga: string, titulo: string): Arte =>
  ({ arquivo: `dungeons-${vaga}`, titulo, guia: 'dungeons', ancora: vaga });

export const ARTES: Arte[] = [
  { arquivo: 'endgame-topo', titulo: 'Endgame', detalhe: 'Topo do guia', guia: 'endgame' },
  { arquivo: 'endgame-introducao', titulo: 'Nexus of Eternity', detalhe: 'Introdução do Endgame', guia: 'endgame', ancora: 'introducao' },

  { arquivo: 'fractals-fractals-of-the-mists', titulo: 'Fractals of the Mists', detalhe: 'Topo do guia e Recompensas', guia: 'fractals', ancora: 'recompensas' },
  { arquivo: 'fractals-mistlock-observatory', titulo: 'Mistlock Observatory', detalhe: 'O hub das Fractals', guia: 'fractals', ancora: 'introducao-as-fractals' },
  fractal('aetherblade', 'Aetherblade'),
  fractal('aquatic-ruins', 'Aquatic Ruins'),
  fractal('captain-mai-trin-boss', 'Captain Mai Trin Boss'),
  fractal('chaos', 'Chaos'),
  fractal('cliffside', 'Cliffside'),
  fractal('deepstone', 'Deepstone'),
  fractal('kinfall', 'Kinfall'),
  fractal('lonely-tower', 'Lonely Tower'),
  fractal('molten-boss', 'Molten Boss'),
  fractal('molten-furnace', 'Molten Furnace'),
  fractal('nightmare', 'Nightmare'),
  fractal('shattered-observatory', 'Shattered Observatory'),
  fractal('silent-surf', 'Silent Surf'),
  fractal('siren-s-reef', "Siren's Reef"),
  fractal('snowblind', 'Snowblind'),
  fractal('solid-ocean', 'Solid Ocean'),
  fractal('solitary-throne', 'Solitary Throne'),
  fractal('sunqua-peak', 'Sunqua Peak'),
  fractal('swampland', 'Swampland'),
  fractal('thaumanova-reactor', 'Thaumanova Reactor'),
  fractal('twilight-oasis', 'Twilight Oasis'),
  fractal('uncategorized', 'Uncategorized'),
  fractal('underground-facility', 'Underground Facility'),
  fractal('urban-battleground', 'Urban Battleground'),
  fractal('volcanic', 'Volcanic'),

  { arquivo: 'raids-portal-do-aerodrome', titulo: 'Portal de Raids', detalhe: "Lion's Arch Aerodrome", guia: 'raids', ancora: 'introducao-as-raids' },
  // o arquivo se chama "recompensas" por causa da seção do guia onde ela fica, mas a arte mostra o Aerodrome
  { arquivo: 'raids-recompensas-de-raid', titulo: "Lion's Arch Aerodrome", detalhe: 'Seção Recompensas', guia: 'raids', ancora: 'recompensas' },
  { arquivo: 'raids-quickplay', titulo: 'Quickplay', guia: 'raids', ancora: 'quickplay' },
  { arquivo: 'raids-wing-1-spirit-vale-sabetha', titulo: 'Spirit Vale', detalhe: 'Wing 1 · Sabetha', guia: 'raids', ancora: 'spirit-vale' },
  { arquivo: 'raids-wing-2-salvation-pass-matthias', titulo: 'Salvation Pass', detalhe: 'Wing 2 · Matthias', guia: 'raids', ancora: 'salvation-pass' },
  { arquivo: 'raids-wing-3-stronghold-xera', titulo: 'Stronghold of the Faithful', detalhe: 'Wing 3 · Xera', guia: 'raids', ancora: 'stronghold-of-the-faithful' },
  { arquivo: 'raids-wing-4-bastion-deimos', titulo: 'Bastion of the Penitent', detalhe: 'Wing 4 · Deimos', guia: 'raids', ancora: 'bastion-of-the-penitent' },
  { arquivo: 'raids-wing-5-hall-of-chains-dhuum', titulo: 'Hall of Chains', detalhe: 'Wing 5 · Dhuum', guia: 'raids', ancora: 'hall-of-chains' },
  { arquivo: 'raids-wing-6-mythwright-gambit-qadim', titulo: 'Mythwright Gambit', detalhe: 'Wing 6 · Qadim', guia: 'raids', ancora: 'mythwright-gambit' },
  { arquivo: 'raids-wing-7-key-of-ahdashim-qadim-the-peerless', titulo: 'The Key of Ahdashim', detalhe: 'Wing 7 · Qadim the Peerless', guia: 'raids', ancora: 'the-key-of-ahdashim' },
  { arquivo: 'raids-wing-8-mount-balrior-ura', titulo: 'Mount Balrior', detalhe: 'Wing 8 · Ura', guia: 'raids', ancora: 'mount-balrior' },
  { arquivo: 'raids-living-world-season-1', titulo: 'Living World Season 1', detalhe: 'Raid Encounters', guia: 'raids', ancora: 'living-world-season-1' },
  { arquivo: 'raids-icebrood-saga', titulo: 'Icebrood Saga', detalhe: 'Raid Encounters', guia: 'raids', ancora: 'icebrood-saga' },
  { arquivo: 'raids-end-of-dragons', titulo: 'End of Dragons', detalhe: 'Raid Encounters · Soo-Won', guia: 'raids', ancora: 'end-of-dragons' },
  { arquivo: 'raids-secrets-of-the-obscure', titulo: 'Secrets of the Obscure', detalhe: 'Raid Encounters', guia: 'raids', ancora: 'secrets-of-the-obscure' },
  { arquivo: 'raids-visions-of-eternity', titulo: 'Visions of Eternity', detalhe: 'Raid Encounters', guia: 'raids', ancora: 'visions-of-eternity' },

  dungeon('ascalonian-catacombs', 'Ascalonian Catacombs'),
  dungeon('caudecus-s-manor', "Caudecus's Manor"),
  dungeon('twilight-arbor', 'Twilight Arbor'),
  dungeon('sorrow-s-embrace', "Sorrow's Embrace"),
  dungeon('citadel-of-flame', 'Citadel of Flame'),
  dungeon('honor-of-the-waves', 'Honor of the Waves'),
  dungeon('crucible-of-eternity', 'Crucible of Eternity'),
  dungeon('the-ruined-city-of-arah', 'The Ruined City of Arah'),
  { arquivo: 'dungeons-gates-of-arah', titulo: 'Gates of Arah', detalhe: 'Introdução das Dungeons', guia: 'dungeons', ancora: 'introducao-as-dungeons' },

  { arquivo: 'recursos-uteis-topo', titulo: 'Lost Precipice', detalhe: 'Topo de Recursos Úteis', guia: 'recursos-uteis' },
];
