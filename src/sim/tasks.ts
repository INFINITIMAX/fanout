// Arbori de sub-task-uri: instantiere, dependente, progres, terminare.

import type { ContractTemplate } from '../data/contracts';
import type { Contract, GameState, TaskNode } from './types';

/** Acces la un task cu eroare clara daca id-ul nu exista. */
export function getTask(state: GameState, id: string): TaskNode {
  const task = state.tasks[id];
  if (!task) {
    throw new Error(`Task inexistent: ${id}`);
  }
  return task;
}

export function isLeaf(task: TaskNode): boolean {
  return task.children.length === 0;
}

/** Frunzele unui contract - singurele task-uri pe care se poate lucra efectiv. */
export function leavesOfContract(state: GameState, contractId: string): TaskNode[] {
  return Object.values(state.tasks).filter(
    (t) => t.contractId === contractId && isLeaf(t),
  );
}

/**
 * Creeaza contractul si arborele lui de task-uri, ca oferta.
 * Radacina e un container: nu se lucreaza pe ea, se termina cand toti copiii sunt gata.
 */
export function instantiateContract(
  state: GameState,
  template: ContractTemplate,
): Contract {
  const contractId = `c${state.nextId++}`;
  const rootId = `${contractId}-root`;
  const leafIds = template.tasks.map((_, i) => `${contractId}-t${i}`);

  const root: TaskNode = {
    id: rootId,
    contractId,
    parentId: null,
    label: template.clientName,
    requiredSkill: 'backend',
    minLevel: 0,
    effortHours: 0,
    progressHours: 0,
    children: [...leafIds],
    dependsOn: [],
    status: 'in_progress',
  };
  state.tasks[rootId] = root;

  template.tasks.forEach((t, i) => {
    const id = leafIds[i] as string;
    state.tasks[id] = {
      id,
      contractId,
      parentId: rootId,
      label: t.label,
      requiredSkill: t.skill,
      minLevel: t.minLevel,
      effortHours: t.effortHours,
      progressHours: 0,
      children: [],
      dependsOn: (t.after ?? []).map((idx) => leafIds[idx] as string),
      status: 'available',
    };
  });

  const contract: Contract = {
    id: contractId,
    clientName: template.clientName,
    rootTaskId: rootId,
    payout: template.payout,
    status: 'offered',
    offeredAtTick: state.tick,
    expiresAtTick: state.tick,
  };
  state.contracts.push(contract);
  refreshStatuses(state, contractId);
  return contract;
}

/**
 * Recalculeaza starile task-urilor unui contract.
 * O frunza e blocata cat timp macar o dependenta nu e terminata.
 */
export function refreshStatuses(state: GameState, contractId: string): void {
  const assigned = new Set(
    state.agents
      .map((a) => a.assignedTaskId)
      .filter((id): id is string => id !== null),
  );

  for (const leaf of leavesOfContract(state, contractId)) {
    if (leaf.progressHours >= leaf.effortHours) {
      leaf.status = 'done';
      continue;
    }
    const blocat = leaf.dependsOn.some((d) => getTask(state, d).status !== 'done');
    if (blocat) {
      leaf.status = 'locked';
    } else {
      leaf.status = assigned.has(leaf.id) ? 'in_progress' : 'available';
    }
  }

  const contract = state.contracts.find((c) => c.id === contractId);
  if (!contract) {
    return;
  }
  const root = getTask(state, contract.rootTaskId);
  const toateGata = leavesOfContract(state, contractId).every((l) => l.status === 'done');
  root.status = toateGata ? 'done' : 'in_progress';
}

/** Se poate lucra acum pe acest task? */
export function isWorkable(task: TaskNode): boolean {
  return isLeaf(task) && (task.status === 'available' || task.status === 'in_progress');
}

/** Elimina din stare task-urile unui contract incheiat, ca sa nu creasca la infinit. */
export function removeContractTasks(state: GameState, contractId: string): void {
  for (const id of Object.keys(state.tasks)) {
    if (state.tasks[id]?.contractId === contractId) {
      delete state.tasks[id];
    }
  }
}
