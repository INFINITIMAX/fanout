// Un tick de simulare, in ordinea fixata in spec.md §2.4:
//   1. oferte noi si oferte expirate
//   2. progres pe task-urile alocate (aici intra costul coordonarii)
//   3. deblocarea dependentelor
//   4. livrari si venit
//   5. costuri
//   6. verificarea falimentului
//
// Functia muteaza starea primita. Determinismul vine din faptul ca singura
// sursa de aleator e state.rng.

import { BALANCE } from '../data/balance';
import { CONTRACT_TEMPLATES } from '../data/contracts';
import { grantSkillPoints, speedOn } from './agents';
import { coordinationMultiplier } from './coordination';
import { applyCosts, payout } from './economy';
import { nextInt, pick } from './rng';
import {
  getTask,
  instantiateContract,
  isWorkable,
  refreshStatuses,
  removeContractTasks,
} from './tasks';
import type { GameState } from './types';

export function tick(state: GameState): void {
  if (state.bankrupt) {
    return;
  }
  state.tick += 1;

  faza1Oferte(state);
  const activi = faza2Progres(state);
  faza3si4LivrariSiDeblocari(state);
  applyCosts(state, activi);

  if (state.money < 0) {
    state.bankrupt = true;
  }
}

export function advance(state: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    tick(state);
  }
}

function faza1Oferte(state: GameState): void {
  for (const contract of state.contracts) {
    if (contract.status === 'offered' && state.tick >= contract.expiresAtTick) {
      contract.status = 'expired';
      state.stats.expiredOffers += 1;
      removeContractTasks(state, contract.id);
    }
  }

  if (state.tick >= state.nextOfferTick) {
    const template = pick(state.rng, CONTRACT_TEMPLATES);
    const contract = instantiateContract(state, template);
    contract.expiresAtTick = state.tick + BALANCE.OFFER_LIFETIME_TICKS;

    const [min, max] = BALANCE.OFFER_INTERVAL_TICKS;
    state.nextOfferTick = state.tick + nextInt(state.rng, min, max);
  }
}

/**
 * Progresul unui tick. Returneaza id-urile agentilor care chiar au lucrat -
 * doar ei platesc costul integral.
 */
function faza2Progres(state: GameState): Set<string> {
  const activi = new Set<string>();

  for (const contract of state.contracts) {
    if (contract.status !== 'active') {
      continue;
    }

    // Cine lucreaza efectiv pe acest contract in acest tick.
    const lucratori = state.agents.filter((agent) => {
      if (agent.assignedTaskId === null) {
        return false;
      }
      const task = state.tasks[agent.assignedTaskId];
      return task !== undefined && task.contractId === contract.id && isWorkable(task);
    });

    if (lucratori.length === 0) {
      continue;
    }

    // Costul coordonarii: cu cat sunt mai multi pe acelasi contract, cu atat
    // mai putin din efortul lor devine munca.
    const multiplicator = coordinationMultiplier(lucratori.length);

    for (const agent of lucratori) {
      const task = getTask(state, agent.assignedTaskId as string);
      const viteza = speedOn(agent, task);
      if (viteza <= 0) {
        continue;
      }
      task.progressHours = Math.min(
        task.effortHours,
        task.progressHours + BALANCE.TICK_HOURS * viteza * multiplicator,
      );

      const inainte = agent.hoursWorked;
      agent.hoursWorked += BALANCE.TICK_HOURS;
      grantSkillPoints(agent, inainte);
      activi.add(agent.id);
    }
  }

  return activi;
}

function faza3si4LivrariSiDeblocari(state: GameState): void {
  for (const contract of state.contracts) {
    if (contract.status !== 'active') {
      continue;
    }
    refreshStatuses(state, contract.id);

    // Agentii de pe task-uri terminate se elibereaza singuri.
    for (const agent of state.agents) {
      if (agent.assignedTaskId === null) {
        continue;
      }
      const task = state.tasks[agent.assignedTaskId];
      if (task && task.contractId === contract.id && task.status === 'done') {
        agent.assignedTaskId = null;
      }
    }

    if (getTask(state, contract.rootTaskId).status === 'done') {
      contract.status = 'delivered';
      state.stats.delivered += 1;
      payout(state, contract.payout);
      removeContractTasks(state, contract.id);
    }
  }
}
