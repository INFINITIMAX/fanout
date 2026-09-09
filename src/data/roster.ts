// Echipa de start.
//
// Profilurile sunt intentionat complementare, nu identice: daca toti agentii ar
// fi la fel, alegerea "cui ii dau task-ul" ar fi lipsita de continut. Fiecare
// are un varf clar si cel putin o zona in care e slab.

import type { SkillId } from '../sim/types';

export interface AgentTemplate {
  name: string;
  skills: Record<SkillId, number>;
}

export const STARTING_ROSTER: readonly AgentTemplate[] = [
  { name: 'ARIA',  skills: { frontend: 3, backend: 1, databases: 1, ai_integration: 2 } },
  { name: 'BOREA', skills: { frontend: 1, backend: 3, databases: 2, ai_integration: 1 } },
  { name: 'CERES', skills: { frontend: 1, backend: 2, databases: 3, ai_integration: 1 } },
  { name: 'DORIS', skills: { frontend: 2, backend: 1, databases: 1, ai_integration: 3 } },
  { name: 'ECHO',  skills: { frontend: 2, backend: 2, databases: 2, ai_integration: 2 } },
  { name: 'FARO',  skills: { frontend: 1, backend: 1, databases: 2, ai_integration: 1 } },
];
