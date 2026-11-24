// Novidades do site (changelog). A mais nova fica em primeiro.
// Para anunciar uma atualização: acrescente uma entrada no TOPO da lista, com um `id` novo.
// O id novo é o que faz o aviso aparecer de novo para quem já tinha visto o anterior, e o ponto acender no sino.
//   id       único e permanente (vira a âncora /novidades.html#<id>); padrão: AAAA-MM-DD-assunto
//   data     AAAA-MM-DD
//   titulo   o assunto em poucas palavras (aparece no aviso, na faixa da home e na página)
//   resumo   uma frase
//   mudancas cada uma com o tipo, a área (slug do guia em GUIAS ou 'site'), o texto e, se houver, o link
//            para a seção (caminho absoluto com âncora)
//   icone    opcional: ícone de src/assets/icones/ no balão do sino e na faixa da home (sem ele, o sino)
//   arte     opcional: imagem de src/assets/guias/ (ex.: 'raids/arte.jpg') no topo da página e na faixa da home
//            (sem ela, a arte do Endgame); foco = object-position da arte
// O aviso só aparece nos AVISO_DIAS dias seguintes à data: quem chega depois disso vê a faixa da home e o sino,
// mas não recebe o aviso de uma novidade velha.
export type TipoMudanca = 'novo' | 'atualizado' | 'corrigido';
export interface Mudanca { tipo: TipoMudanca; area: string; texto: string; href?: string }
export interface Novidade { id: string; data: string; titulo: string; resumo: string; icone?: string; arte?: string; foco?: string; mudancas: Mudanca[] }

export const AVISO_DIAS = 30;

export const NOVIDADES: Novidade[] = [
  {
    id: '2026-11-24-sorteio-novo',
    data: '2026-11-24',
    titulo: 'Sorteio de cara nova!',
    resumo: 'Demos uma renovada no sorteio. Ele ganhou o visual escuro com o dourado da guilda e ficou bem mais fácil de usar no celular.',
    icone: 'essence-chest',
    arte: 'raids/arte.jpg',
    mudancas: [
      { tipo: 'atualizado', area: 'site', texto: 'Na página do sorteio, você já vê os que estão abertos agora. Escolha um e entre com o seu ID do Guild Wars 2.', href: '/sorteio.html' },
      { tipo: 'atualizado', area: 'site', texto: 'Refizemos o painel do sorteio. Nos 10 segundos finais o relógio fica laranja, e quem ganha confirma o prêmio em 1 minuto ali mesmo.', href: '/sorteio.html' },
      { tipo: 'atualizado', area: 'site', texto: 'Para quem organiza pelo celular, deixamos os botões de sortear e de copiar o link sempre à mão e criamos um convite pronto para colar no Discord.', href: '/sorteio.html' },
      { tipo: 'novo', area: 'site', texto: 'Agora dá para sortear até 10.000 unidades de um item. Você digita a quantidade e o formulário já mostra a conta em stacks.', href: '/sorteio.html' },
      { tipo: 'atualizado', area: 'site', texto: 'Quer conferir um resultado? Na página Ganhadores, cole o código em "Conferir pelo código" e veja a prova.', href: '/sorteio/ganhadores.html' },
      { tipo: 'atualizado', area: 'site', texto: 'Os códigos dos sorteios antigos continuam valendo. O mesmo código dá o mesmo resultado de antes.', href: '/sorteio/ganhadores.html' },
    ],
  },
  {
    id: '2026-11-20-sorteio',
    data: '2026-11-20',
    titulo: 'Sorteio da guilda no site!',
    resumo: 'Agora dá para sortear prêmios ao vivo com a galera, aqui no site. Você abre o sorteio, a guilda se inscreve com a conta do Guild Wars 2 e a roleta gira na tela de todo mundo.',
    icone: 'essence-chest',
    arte: 'dungeons/arte.jpg',
    mudancas: [
      { tipo: 'novo', area: 'site', texto: 'Sorteio ao vivo: você abre um sorteio com o prêmio, manda o link no Discord e cada um se inscreve com a conta do Guild Wars 2. Na hora de sortear, a roleta gira para todo mundo ver.', href: '/sorteio.html' },
      { tipo: 'novo', area: 'site', texto: 'Você pode pedir que o prêmio seja aceito em 1 minuto. Quem ganha clica em "Aceitar o prêmio". Se o tempo acabar, você sorteia outra pessoa no lugar.' },
      { tipo: 'novo', area: 'site', texto: 'Criamos a página Ganhadores, com os últimos sorteios ao vivo e quem levou cada prêmio. Para conferir um deles, cole o código em "Conferir pelo código".', href: '/sorteio/ganhadores.html' },
      { tipo: 'novo', area: 'site', texto: 'Também dá para sortear na hora, sem inscrição: uma lista de contas, números ou squads. Na aba Extras tem dados, cara ou coroa e um sorteio do que jogar.', href: '/sorteio.html' },
      { tipo: 'novo', area: 'site', texto: 'Todo resultado tem um código. Nas abas Lista de contas, Números e Squads, cole o código em "Conferir um sorteio antigo" para ver o mesmo resultado de novo.' },
      { tipo: 'corrigido', area: 'site', texto: 'Corrigimos os avisos de erro do sorteio, que agora chegam a quem usa leitor de tela. No tema claro, as cores dos prêmios também ficaram mais fáceis de ler.' },
    ],
  },
  {
    id: '2026-11-19-galeria-e-barra',
    data: '2026-11-19',
    titulo: 'Galeria de wallpapers e novo visual!',
    resumo: 'Agora você pode usar as artes dos guias como wallpapers. Também demos uma renovada no menu e na navegação do site, deixando o visual mais organizado e padronizado em todas as páginas.',
    arte: 'raids/artes/icebrood-saga.jpg',
    foco: '50% 40%',
    mudancas: [
      { tipo: 'novo', area: 'site', texto: 'A Galeria reúne as 55 artes dos guias. Abra a que você quiser em tela cheia e baixe em alta resolução, 3200 px, para usar como wallpaper.', href: '/galeria.html' },
      { tipo: 'atualizado', area: 'site', texto: 'Demos uma renovada no menu: agora ele é o mesmo em todas as páginas, e o botão "Guias" mostra os 6 guias de uma vez.' },
      { tipo: 'atualizado', area: 'site', texto: 'Reescrevemos os textos dos guias para soarem como a gente fala no Discord, mais diretos e sem cara de manual. Os fatos continuam os mesmos.' },
      { tipo: 'atualizado', area: 'site', texto: 'No celular, o botão de menu (☰) abre uma gaveta com os guias e o resto do site.' },
      { tipo: 'atualizado', area: 'site', texto: 'Os guias não têm mais PDF: tudo fica no site, sempre atualizado. Se precisar imprimir, abra o guia e use Ctrl+P. Os links antigos de PDF mostram um aviso com o link do guia.' },
      { tipo: 'novo', area: 'raids', texto: 'Artes novas no guia de Raids: Icebrood Saga, End of Dragons (Soo-Won) e Visions of Eternity.', href: '/guias/raids.html#icebrood-saga' },
    ],
  },
  {
    id: '2026-11-19-artes-e-sumario',
    data: '2026-11-19',
    titulo: 'Artes novas e sumário corrigido!',
    resumo: 'Os guias ganharam ilustrações novas e prints do jogo. O sumário agora leva à seção certa, e o Endgame tem a configuração do Zyanore para o ArcDPS, pronta para baixar.',
    icone: 'challenge-mode',
    arte: 'endgame/arte.webp',
    foco: '50% 35%',
    mudancas: [
      { tipo: 'corrigido', area: 'site', texto: 'Ao clicar num item do sumário "Neste guia", a página às vezes parava longe da seção, acima ou abaixo dela. Agora para no título certo, no computador e no celular.' },
      { tipo: 'novo', area: 'site', texto: 'Ilustrações novas em estilo pôster no topo dos guias e nos cards de Raids, Fractals e Dungeons, feitas a partir de artes e capturas do jogo.' },
      { tipo: 'novo', area: 'endgame', texto: 'A configuração do Zyanore para o ArcDPS já pode ser baixada, com o passo a passo para usá-la inteira ou só o visual.', href: '/guias/endgame.html#arcdps' },
      { tipo: 'atualizado', area: 'endgame', texto: 'A Defiance Bar ganhou um print de cada estado (travada, ativa e quebrada), tirado no Golem de treino.', href: '/guias/endgame.html#defiance-bar-barra-de-cc' },
      { tipo: 'atualizado', area: 'endgame', texto: 'Prints novos do Golem de treino, das janelas do ArcDPS e do LFG na aba de Raids, além de uma arte nova na Introdução.', href: '/guias/endgame.html#golem-de-treino' },
      { tipo: 'atualizado', area: 'raids', texto: 'Os modos de dificuldade agora explicam onde se ativa cada um: o Normal Mode é o padrão, e o Challenge Mode e o Legendary Mode saem do Challenge Mote, perto do boss.', href: '/guias/raids.html#tiers-de-dificuldade' },
      { tipo: 'atualizado', area: 'raids', texto: 'Imagem do Coalescence em resolução maior.', href: '/guias/raids.html#coalescence-anel-lendario' },
      { tipo: 'atualizado', area: 'dungeons', texto: 'Print dos Achievements de Dungeons em resolução maior.', href: '/guias/dungeons.html#achievements' },
      { tipo: 'novo', area: 'recursos-uteis', texto: 'Arte nova no topo, feita a partir do guild hall Lost Precipice.' },
    ],
  },
  {
    id: '2026-11-17-challenge-modes',
    data: '2026-11-17',
    titulo: 'Resumo do CM em cada boss!',
    resumo: 'Cada boss de Raid e cada Fractal com Challenge Mode ganhou um vídeo do CM e um resumo do que muda na luta. Também reescrevemos os guias para ficarem mais claros.',
    icone: 'challenge-mode',
    arte: 'raids/arte.jpg',
    foco: '50% 30%',
    mudancas: [
      { tipo: 'novo', area: 'raids', texto: 'Em cada boss com Challenge Mode, o botão CM agora tem do lado o "O que muda". Ele abre ali mesmo uma ficha com a vida do boss, as mecânicas novas e dicas, sem sair do guia.', href: '/guias/raids.html#bastion-of-the-penitent' },
      { tipo: 'novo', area: 'raids', texto: 'Os 25 bosses que têm Challenge Mode ganharam o botão CM, que abre um vídeo só do Challenge Mode daquele boss.', href: '/guias/raids.html#secao-2' },
      { tipo: 'novo', area: 'raids', texto: 'Aviso novo sobre o Secret Lair of the Snowmen (boss Freezie): ele também conta como Raid Encounter, mas só abre durante o Wintersday.', href: '/guias/raids.html#secao-3' },
      { tipo: 'atualizado', area: 'raids', texto: 'A parte de recompensas agora avisa que o Gaeting Crystal tem limite de 150 por semana e que ativar o Challenge Mode desliga o Emboldened.', href: '/guias/raids.html#recompensas' },
      { tipo: 'novo', area: 'fractals', texto: 'As 7 Fractals com Challenge Mode também ganharam o "O que muda", com a mesma ficha.', href: '/guias/fractals.html#solitary-throne' },
      { tipo: 'novo', area: 'fractals', texto: 'Solitary Throne, Kinfall e Lonely Tower ganharam o botão CM. Agora as 7 Fractals com Challenge Mode têm vídeo do CM.', href: '/guias/fractals.html#secao-3' },
      { tipo: 'corrigido', area: 'fractals', texto: 'O Fractal Avenger, o inimigo que finaliza quem cai em downed, aparece a partir da escala 75. O guia dizia 71.', href: '/guias/fractals.html#tiers-e-escalas' },
      { tipo: 'atualizado', area: 'endgame', texto: 'O guia passou a usar o nome oficial Raid Encounters no lugar de Strikes. No LFG, eles ficam na aba de Raids, em Experienced ou Training.', href: '/guias/endgame.html#looking-for-group-lfg' },
      { tipo: 'atualizado', area: 'endgame', texto: 'Tiramos a Discretize do guia de Endgame, pois o site parou de ser atualizado. Em Recursos Úteis, a cópia antiga dela continua listada só para consulta.', href: '/guias/endgame.html#onde-encontrar-builds-prontas' },
      { tipo: 'novo', area: 'dungeons', texto: 'O Path 4 de Arah era o único caminho sem vídeo. Agora tem.', href: '/guias/dungeons.html#the-ruined-city-of-arah' },
      { tipo: 'novo', area: 'recursos-uteis', texto: 'Link novo: os guias em texto da Hardstuck para os Challenge Modes de Fractal.', href: '/guias/recursos-uteis.html#secao-3' },
      { tipo: 'novo', area: 'site', texto: 'Esta página de Novidades. Quando sair uma atualização, o botão Novidades, no topo dos guias, ganha um ponto dourado e abre um balão avisando o que mudou.' },
      { tipo: 'novo', area: 'site', texto: 'Ao mandar o link do site no Discord ou no WhatsApp, agora aparece uma prévia com imagem, título e descrição.' },
      { tipo: 'atualizado', area: 'site', texto: 'Reescrevemos o texto de todos os guias para ficar mais claro: menos jargão sem explicação e frases mais diretas. Nenhuma informação mudou por causa disso.' },
    ],
  },
];

export const ultimaNovidade = NOVIDADES[0];
/** a novidade ainda é recente (nos AVISO_DIAS dias seguintes à data, contados na build): ganha o selo "Novo" */
export const recente = (n: Novidade) => (Date.now() - Date.parse(`${n.data}T00:00:00Z`)) / 864e5 <= AVISO_DIAS;
/** quando o selo "Novo" de uma novidade vence (data + AVISO_DIAS): o Selo com `expira` some sozinho no navegador
    depois disso, mesmo que o site não seja publicado de novo */
export const expiraNovo = (n: Novidade) => new Date(Date.parse(`${n.data}T00:00:00Z`) + AVISO_DIAS * 864e5).toISOString();

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
// "2026-11-17" -> "17 nov. 2026"
export const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
};
