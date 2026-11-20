// Boons e conditions de GW2: nome (como na Wiki), tipo e definição curta para o balão.
// As definições resumem o guia de Endgame (capítulos Boons e Conditions); mudou lá, mude aqui.
// O ícone é o arquivo de mesmo nome em src/assets/icones/ (arte da Guild Wars 2 Wiki).
export type Efeito = { nome: string; tipo: 'Boon' | 'Condition'; def: string };

export const EFEITOS: Record<string, Efeito> = {
  // boons
  quickness: { nome: 'Quickness', tipo: 'Boon', def: 'Aumenta a velocidade de ativação das skills em 50%.' },
  alacrity: { nome: 'Alacrity', tipo: 'Boon', def: 'Aumenta a taxa de recarga das skills em 25%: elas recarregam em 80% do tempo.' },
  might: { nome: 'Might', tipo: 'Boon', def: 'Aumenta Power e Condition Damage em 30 por stack, até 25 stacks (+750 no level 80).' },
  fury: { nome: 'Fury', tipo: 'Boon', def: 'Aumenta Critical Chance em 25%.' },
  protection: { nome: 'Protection', tipo: 'Boon', def: 'Diminui em 33% o Strike Damage recebido.' },
  regeneration: { nome: 'Regeneration', tipo: 'Boon', def: 'Cura ao longo do tempo; a efetividade depende de Healing Power.' },
  vigor: { nome: 'Vigor', tipo: 'Boon', def: 'Aumenta a regeneração de endurance (a barra de dodge).' },
  resolution: { nome: 'Resolution', tipo: 'Boon', def: 'Diminui em 33% o Condition Damage recebido.' },
  stability: { nome: 'Stability', tipo: 'Boon', def: 'Protege contra controle de grupo (Stun, Daze, Float, Fear, Knock Down). Até 25 stacks, consumidos a cada CC recebido.' },
  aegis: { nome: 'Aegis', tipo: 'Boon', def: 'Bloqueia o próximo ataque recebido.' },
  resistance: { nome: 'Resistance', tipo: 'Boon', def: 'Neutraliza Blinded, Chilled, Crippled, Fear, Immobile, Slow, Taunt, Weakness e Vulnerability.' },
  swiftness: { nome: 'Swiftness', tipo: 'Boon', def: 'Aumenta a velocidade de movimento em 33%.' },
  // conditions de dano
  bleeding: { nome: 'Bleeding', tipo: 'Condition', def: 'Dano ao longo do tempo.' },
  burning: { nome: 'Burning', tipo: 'Condition', def: 'Dano ao longo do tempo, com valor final maior que o de Bleeding.' },
  poisoned: { nome: 'Poisoned', tipo: 'Condition', def: 'Dano ao longo do tempo e 33% menos cura recebida.' },
  confusion: { nome: 'Confusion', tipo: 'Condition', def: 'Dano ao longo do tempo e dano extra quando o alvo ativa uma skill.' },
  torment: { nome: 'Torment', tipo: 'Condition', def: 'Dano ao longo do tempo e dano extra se o alvo não está se movendo.' },
  // conditions de controle
  blinded: { nome: 'Blinded', tipo: 'Condition', def: 'Anula o próximo ataque do alvo.' },
  chilled: { nome: 'Chilled', tipo: 'Condition', def: 'Diminui a velocidade de movimento em 66% e aumenta a recarga das skills em cerca de 40%.' },
  crippled: { nome: 'Crippled', tipo: 'Condition', def: 'Diminui a velocidade de movimento em 50%.' },
  fear: { nome: 'Fear', tipo: 'Condition', def: 'Interrompe o alvo e o faz correr na direção oposta. Sai com Stun Break.' },
  immobile: { nome: 'Immobile', tipo: 'Condition', def: 'O alvo não se move, não vira e não esquiva, mas ainda ataca e se teleporta.' },
  slow: { nome: 'Slow', tipo: 'Condition', def: 'Aumenta o tempo de animação de qualquer ação do alvo.' },
  taunt: { nome: 'Taunt', tipo: 'Condition', def: 'Força o alvo a ir até a fonte e atacá-la; só Stun Breaks continuam disponíveis.' },
  weakness: { nome: 'Weakness', tipo: 'Condition', def: 'Metade da recuperação de endurance e metade dos acertos do alvo viram Glancing Blows.' },
  vulnerability: { nome: 'Vulnerability', tipo: 'Condition', def: 'Aumenta em 1% por stack o dano recebido, até 25 stacks.' },
};

export function efeito(id: string): Efeito {
  const e = EFEITOS[id];
  if (!e) throw new Error(`Boon ou condition desconhecido: "${id}" (veja src/lib/efeitos.ts).`);
  return e;
}
