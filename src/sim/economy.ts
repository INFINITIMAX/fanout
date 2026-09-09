// Bani: ce se arde in fiecare tick si ce intra la livrare.

import { BALANCE } from '../data/balance';
import { hourlyCost } from './agents';
import type { GameState } from './types';

/**
 * Scade costul unui tick. Agentii care au lucrat platesc integral, ceilalti
 * platesc fractiunea de inactivitate - un agent pe care il tii in firma costa
 * chiar si cand nu are ce face.
 */
export function applyCosts(state: GameState, activeAgentIds: ReadonlySet<string>): number {
  let total = 0;
  for (const agent of state.agents) {
    const factor = activeAgentIds.has(agent.id) ? 1 : BALANCE.IDLE_COST_FACTOR;
    total += hourlyCost(agent) * BALANCE.TICK_HOURS * factor;
  }
  state.money -= total;
  state.stats.spent += total;
  return total;
}

export function payout(state: GameState, amount: number): void {
  state.money += amount;
  state.stats.revenue += amount;
}

/** Rata de ardere, pentru HUD: bani pe ora de joc la configuratia curenta. */
export function burnRatePerHour(state: GameState, activeAgentIds: ReadonlySet<string>): number {
  return state.agents.reduce((sum, agent) => {
    const factor = activeAgentIds.has(agent.id) ? 1 : BALANCE.IDLE_COST_FACTOR;
    return sum + hourlyCost(agent) * factor;
  }, 0);
}
