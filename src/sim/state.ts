// Starea initiala a unei partide.

import { BALANCE } from '../data/balance';
import { STARTING_ROSTER } from '../data/roster';
import { createRng, nextInt } from './rng';
import type { GameState } from './types';

export function createInitialState(seed: number, rosterSize = STARTING_ROSTER.length): GameState {
  const rng = createRng(seed);

  const state: GameState = {
    tick: 0,
    money: BALANCE.STARTING_MONEY,
    agents: STARTING_ROSTER.slice(0, rosterSize).map((t, i) => ({
      id: `a${i}`,
      name: t.name,
      skills: { ...t.skills },
      hoursWorked: 0,
      unspentSkillPoints: 0,
      assignedTaskId: null,
    })),
    tasks: {},
    contracts: [],
    rng,
    nextOfferTick: 0,
    nextId: 1,
    bankrupt: false,
    stats: { delivered: 0, expiredOffers: 0, revenue: 0, spent: 0 },
  };

  // Prima oferta apare imediat: jocul incepe cu ceva de facut, fara meniu.
  state.nextOfferTick = nextInt(rng, 0, 10);
  return state;
}
