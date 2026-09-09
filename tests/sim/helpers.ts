// Utilitare comune pentru testele si calibrarea motorului.

import { CONTRACT_TEMPLATES, type ContractTemplate } from '../../src/data/contracts';
import { acceptOffer, assignAgent } from '../../src/sim/commands';
import { createInitialState } from '../../src/sim/state';
import { instantiateContract, isWorkable, leavesOfContract } from '../../src/sim/tasks';
import { canWorkOn } from '../../src/sim/agents';
import { tick } from '../../src/sim/tick';
import type { GameState } from '../../src/sim/types';

export function templateByKey(key: string): ContractTemplate {
  const t = CONTRACT_TEMPLATES.find((c) => c.key === key);
  if (!t) {
    throw new Error(`Sablon inexistent: ${key}`);
  }
  return t;
}

/**
 * Stare de laborator: fara oferte automate, cu un singur contract deja acceptat.
 * Izoleaza ce masuram de zgomotul generatorului de oferte.
 */
export function labState(templateKey: string, rosterSize: number, seed = 1): GameState {
  const state = createInitialState(seed, rosterSize);
  state.nextOfferTick = Number.POSITIVE_INFINITY;
  const contract = instantiateContract(state, templateByKey(templateKey));
  acceptOffer(state, contract.id);
  return state;
}

/**
 * Tine `n` agenti ocupati pe contract, realocandu-i cand un task se termina.
 * Restul raman inactivi - dar tot costa, exact ca in joc.
 */
export function keepBusy(state: GameState, n: number): void {
  const contract = state.contracts.find((c) => c.status === 'active');
  if (!contract) {
    return;
  }
  const ocupate = new Set(
    state.agents.map((a) => a.assignedTaskId).filter((id): id is string => id !== null),
  );
  // Un agent per sub-task: task-urile deja luate nu mai sunt disponibile.
  const libere = leavesOfContract(state, contract.id).filter(
    (t) => isWorkable(t) && !ocupate.has(t.id),
  );
  const disponibili = state.agents.filter((a) => a.assignedTaskId === null);

  let ocupati = state.agents.filter((a) => a.assignedTaskId !== null).length;
  for (const agent of disponibili) {
    if (ocupati >= n || libere.length === 0) {
      break;
    }
    const idx = libere.findIndex((t) => canWorkOn(agent, t));
    if (idx === -1) {
      continue;
    }
    const task = libere[idx]!;
    if (assignAgent(state, agent.id, task.id)) {
      libere.splice(idx, 1);
      ocupati++;
    }
  }
}

export interface RunResult {
  ticks: number;
  spent: number;
  revenue: number;
  profit: number;
  delivered: boolean;
}

/** Ruleaza un contract pana la livrare (sau pana la limita) cu `n` agenti activi. */
export function runContract(
  templateKey: string,
  n: number,
  rosterSize = 6,
  maxTicks = 20000,
): RunResult {
  const state = labState(templateKey, rosterSize);

  let t = 0;
  while (t < maxTicks && state.stats.delivered === 0 && !state.bankrupt) {
    keepBusy(state, n);
    tick(state);
    t++;
  }

  return {
    ticks: t,
    spent: state.stats.spent,
    revenue: state.stats.revenue,
    profit: state.stats.revenue - state.stats.spent,
    delivered: state.stats.delivered > 0,
  };
}
