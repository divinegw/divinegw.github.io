// Fixture do stress do bloco "Abertos agora" (/sorteio). Os limites vêm de site-astro/firebase/firestore.rules:
// titulo 1–80, premio 0–120, premioInfo.nome 1–80, quantidade 1–1.000.000, icone só render.guildwars2.com (até 200),
// raridade até 20, descricao 0–300, vencedores 1–50. Contagem de inscritos: sem limite encontrado.
// "Agora" fixo: AGORA. Datas relativas a ele. Nada aleatório: o mesmo resultado a cada rodada.
export const AGORA = Date.parse('2026-11-23T21:30:00-03:00');
const MIN = 60_000;

const s = (v) => ({ stringValue: v });
const n = (v) => ({ integerValue: String(v) });
const t = (ms) => ({ timestampValue: new Date(ms).toISOString() });
const ICONE = 'https://render.guildwars2.com/file/220061640ECA41C0577758030357221B4ECCE62C/502065.png';

function doc(id, { titulo, premio = '', info = null, fecha = null, vencedores = 1 }) {
  const fields = {
    titulo: s(titulo), premio: s(premio), descricao: s(''), vencedores: n(vencedores), aberto: { booleanValue: true },
    fechaEm: fecha === null ? { nullValue: null } : t(fecha), criadoEm: t(AGORA - 30 * MIN), expiraEm: t(AGORA + 7 * 24 * 60 * MIN),
    resultado: { nullValue: null }, dono: s('x'),
  };
  if (info) fields.premioInfo = { mapValue: { fields: {
    tipo: s(info.tipo ?? 'item'), nome: s(info.nome), quantidade: n(info.quantidade ?? 1), icone: s(info.icone ?? ''),
    raridade: s(info.raridade ?? ''), descricao: s(''), itemId: n(0),
  } } };
  return { document: { name: `projects/p/databases/(default)/documents/sorteios/${id}`, fields } };
}

const L80 = 'Sorteio de fim de ano da guilda com prêmios para todos os squads '.repeat(3).slice(0, 80);
const L81 = L80 + 'X';
const L120 = 'Gift of Battle, Mystic Clover e um monte de outras coisas legais '.repeat(3).slice(0, 120);

// Pior caso: um valor do catálogo em cada campo, nos limites e um além.
export const PIOR = [
  doc('a1', { titulo: L80, premio: L120, fecha: AGORA + 8 * 1000 }),
  doc('a2', { titulo: 'Benachrichtigungseinstellungen', info: { nome: 'Benachrichtigungseinstellungen'.repeat(2).slice(0, 80), quantidade: 1_000_000, icone: ICONE, raridade: 'Legendary' }, fecha: AGORA + 59 * MIN }),
  doc('a3', { titulo: '<script>alert(1)</script>', premio: '&amp; **negrito**', fecha: null }),
  doc('a4', { titulo: 'J', premio: '', fecha: AGORA + 3 * 24 * 60 * MIN }),
  doc('a5', { titulo: '👩🏽‍💻 Priya e 🦊 Fox', info: { nome: '王秀英', quantidade: 1, icone: 'https://evil.example.com/x.png', raridade: 'Exotic' }, fecha: AGORA - 1000 }),
  doc('a6', { titulo: 'نور الهدى عبد الرحمن', premio: 'Đặng Thị Ngọc Hân สมศักดิ์ ศรีสุวรรณ', fecha: AGORA + 12 * MIN }),
  doc('a7', { titulo: 'invoice‮fdp.exe', premio: 'Z̵̡̛a̷l̸g̵o̶', fecha: AGORA + 25 * MIN }),
  doc('a8', { titulo: L81, premio: '   ', info: { tipo: 'gemas', nome: 'Gemas', quantidade: 999_999 }, fecha: AGORA + 2 * MIN }),
];
export const UM = [doc('u1', { titulo: 'Sorteio da raid de domingo', premio: 'Gift of Battle', fecha: AGORA + 40 * MIN })];
export const VAZIO = [];
export const MUITOS = Array.from({ length: 20 }, (_, i) => PIOR[i % PIOR.length]).map((d, i) => ({ document: { ...d.document, name: d.document.name + '-' + i } }));
// Inscritos por sorteio (contagem): 0, 1, 2.000 e 1.234.567 em rodízio.
export const INSCRITOS = [0, 1, 2000, 1_234_567];
