// Forma completa a starii de joc.
//
// Regula: nimic din acest fisier nu stie de Phaser, de pixeli sau de ecran.
// Pozitiile vizuale ale agentilor traiesc in src/game/, nu aici - simularea nu
// are nevoie de ele ca sa fie corecta.

import type { RngState } from './rng';

export type SkillId = 'frontend' | 'backend' | 'databases' | 'ai_integration';

// Tuplu, nu array: cu noUncheckedIndexedAccess, SKILL_IDS[0] pe un array simplu
// ar fi `SkillId | undefined`. Ca tuplu, primul element e cunoscut la compilare.
export const SKILL_IDS = [
  'frontend',
  'backend',
  'databases',
  'ai_integration',
] as const satisfies readonly SkillId[];

export type TaskStatus = 'locked' | 'available' | 'in_progress' | 'done';
export type ContractStatus = 'offered' | 'active' | 'delivered' | 'expired';

export interface Agent {
  id: string;
  name: string;
  skills: Record<SkillId, number>;
  /** Ore de munca acumulate. In realitate: tokeni / compute consumat. */
  hoursWorked: number;
  /** Puncte pe care jucatorul le investeste in agent. El nu "invata" singur. */
  unspentSkillPoints: number;
  assignedTaskId: string | null;
}

export interface TaskNode {
  id: string;
  contractId: string;
  parentId: string | null;
  label: string;
  requiredSkill: SkillId;
  minLevel: number;
  effortHours: number;
  progressHours: number;
  children: string[];
  /** Id-uri de task-uri care trebuie terminate inainte ca acesta sa poata incepe. */
  dependsOn: string[];
  status: TaskStatus;
}

export interface Contract {
  id: string;
  clientName: string;
  rootTaskId: string;
  payout: number;
  status: ContractStatus;
  offeredAtTick: number;
  /** Oferta dispare daca nu e acceptata pana la acest tick. */
  expiresAtTick: number;
}

export interface GameState {
  tick: number;
  money: number;
  agents: Agent[];
  tasks: Record<string, TaskNode>;
  contracts: Contract[];
  rng: RngState;
  /** Tick-ul la care apare urmatoarea oferta. */
  nextOfferTick: number;
  /** Contor intern pentru id-uri stabile si deterministe. */
  nextId: number;
  bankrupt: boolean;
  stats: {
    delivered: number;
    expiredOffers: number;
    revenue: number;
    spent: number;
  };
}
