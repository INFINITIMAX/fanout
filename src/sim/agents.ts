// Agenti: potrivire cu task-ul, viteza, cost, progresie.
//
// Nota de fidelitate conceptuala (vezi intent.md): agentul NU invata din
// experienta. Orele lucrate deblocheaza un punct pe care JUCATORUL il investeste.
// In realitate, asta inseamna ca ii dai agentului un tool nou sau un prompt mai
// bun - imbunatatirea vine din afara, nu dinauntru.

import { BALANCE } from '../data/balance';
import type { Agent, SkillId, TaskNode } from './types';
import { SKILL_IDS } from './types';

export function skillLevel(agent: Agent, skill: SkillId): number {
  return agent.skills[skill];
}

export function totalSkillLevels(agent: Agent): number {
  return SKILL_IDS.reduce((sum, s) => sum + agent.skills[s], 0);
}

/** Poate agentul sa preia acest task? Sub nivelul minim, nu. */
export function canWorkOn(agent: Agent, task: TaskNode): boolean {
  return skillLevel(agent, task.requiredSkill) >= task.minLevel;
}

/**
 * Viteza agentului pe un task, in ore de munca per ora de timp.
 * Fiecare nivel peste minimul cerut aduce un bonus liniar.
 */
export function speedOn(agent: Agent, task: TaskNode): number {
  if (!canWorkOn(agent, task)) {
    return 0;
  }
  const peste = skillLevel(agent, task.requiredSkill) - task.minLevel;
  return 1 + BALANCE.SPEED_PER_LEVEL * peste;
}

/** Cost orar. Un agent mai capabil costa mai mult - exact ca un model mai bun. */
export function hourlyCost(agent: Agent): number {
  return (
    BALANCE.AGENT_COST_PER_HOUR +
    BALANCE.AGENT_COST_PER_SKILL_LEVEL_PER_HOUR * totalSkillLevels(agent)
  );
}

/** Acorda puncte de skill pentru orele acumulate, fara sa le cheltuie. */
export function grantSkillPoints(agent: Agent, hoursBefore: number): void {
  const prag = BALANCE.HOURS_PER_SKILL_POINT;
  const inainte = Math.floor(hoursBefore / prag);
  const acum = Math.floor(agent.hoursWorked / prag);
  if (acum > inainte) {
    agent.unspentSkillPoints += acum - inainte;
  }
}

/** Investeste un punct intr-un skill. Decizie a jucatorului, nu a agentului. */
export function spendSkillPoint(agent: Agent, skill: SkillId): boolean {
  if (agent.unspentSkillPoints <= 0) {
    return false;
  }
  agent.unspentSkillPoints -= 1;
  agent.skills[skill] += 1;
  return true;
}
