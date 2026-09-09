// Singurele actiuni prin care jucatorul modifica starea.
//
// Interfata nu are voie sa scrie direct in GameState - trece prin aceste
// functii. Asa, o partida = seed + secventa de comenzi, si poate fi rejucata
// identic (util la depanare si la calibrare).

import { BALANCE } from '../data/balance';
import { canWorkOn } from './agents';
import { getTask, isWorkable, refreshStatuses } from './tasks';
import type { GameState } from './types';

export function activeContracts(state: GameState) {
  return state.contracts.filter((c) => c.status === 'active');
}

export function offeredContracts(state: GameState) {
  return state.contracts.filter((c) => c.status === 'offered');
}

/** Accepta o oferta. Esueaza daca s-a atins limita de contracte active. */
export function acceptOffer(state: GameState, contractId: string): boolean {
  if (activeContracts(state).length >= BALANCE.MAX_ACTIVE_CONTRACTS) {
    return false;
  }
  const contract = state.contracts.find((c) => c.id === contractId);
  if (!contract || contract.status !== 'offered') {
    return false;
  }
  contract.status = 'active';
  refreshStatuses(state, contract.id);
  return true;
}

/** Pune un agent pe un task. Refuza daca nu are nivelul cerut. */
export function assignAgent(state: GameState, agentId: string, taskId: string): boolean {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) {
    return false;
  }
  const task = getTask(state, taskId);
  if (!isWorkable(task) || !canWorkOn(agent, task)) {
    return false;
  }
  const contract = state.contracts.find((c) => c.id === task.contractId);
  if (!contract || contract.status !== 'active') {
    return false;
  }
  // Un singur agent per sub-task. Paralelismul vine exclusiv din latimea
  // arborelui: descompui ca sa poti paraleliza, nu inghesui agenti pe acelasi
  // task. Doi agenti pe acelasi fisier nu lucreaza de doua ori mai repede.
  const ocupat = state.agents.some((a) => a.id !== agentId && a.assignedTaskId === taskId);
  if (ocupat) {
    return false;
  }
  agent.assignedTaskId = taskId;
  refreshStatuses(state, task.contractId);
  return true;
}

export function unassignAgent(state: GameState, agentId: string): void {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent || agent.assignedTaskId === null) {
    return;
  }
  const contractId = state.tasks[agent.assignedTaskId]?.contractId;
  agent.assignedTaskId = null;
  if (contractId) {
    refreshStatuses(state, contractId);
  }
}
