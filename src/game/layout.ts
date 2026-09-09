// Constante si functii pure de layout. NU importa Phaser.
//
// Separat de config.ts intentionat: bundle-ul Phaser atinge `window` la simpla
// incarcare a modulului, deci orice test pe functiile de aici ar cadea la import
// intr-un mediu fara DOM. Acelasi principiu ca Regula #1 din CLAUDE.md, aplicat
// in interiorul src/game/.

import type { Agent, SkillId, TaskStatus } from '../sim';
import { SKILL_IDS } from '../sim';

/** Id-ul elementului DOM in care Phaser ataseaza canvasul (creat de main.ts). */
export const CANVAS_PARENT_ID = 'fabricaai-canvas';

/**
 * Stack unic de fonturi, folosit atat de textele Phaser (src/game/) cat si de
 * HUD-ul DOM (src/ui/hud.ts). hud.ts nu poate importa din acest fisier (regula
 * de separare game/ vs ui/ din CLAUDE.md), asa ca acolo stack-ul e duplicat literal
 * - valoarea trebuie tinuta identica manual daca se schimba aici.
 */
export const FONT = {
  FAMILY: `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`,
  SIZE_SECONDARY: 13,
  SIZE_PRIMARY: 15,
  SIZE_TITLE: 18,
} as const;

export const LAYOUT = {
  SCENE_WIDTH: 900,
  SCENE_HEIGHT: 640,

  // Zona de birouri: agentii liberi stau aici, intr-un grid de 2 coloane.
  OFFICE_X: 20,
  OFFICE_Y: 20,
  OFFICE_WIDTH: 210,
  OFFICE_HEIGHT: 600,
  OFFICE_TITLE_HEIGHT: 28,
  OFFICE_COLUMNS: 2,
  OFFICE_ROW_HEIGHT: 76,
  OFFICE_PADDING: 10,

  // Zona contractelor active: cate un ContractCard stivuit vertical.
  CONTRACTS_X: 250,
  CONTRACTS_Y: 20,
  CONTRACT_CARD_GAP: 16,
  CONTRACT_CARD_WIDTH: 630,
  CONTRACT_HEADER_HEIGHT: 40,
  CONTRACT_CARD_PADDING: 12,

  TASK_ROW_HEIGHT: 38,
  TASK_ROW_GAP: 6,
  TASK_BAR_WIDTH: 380,
  TASK_BAR_HEIGHT: 14,

  AGENT_WIDTH: 92,
  AGENT_HEIGHT: 58,
  /** Distanta dintre marginea randului de task si sprite-ul agentului alocat. */
  AGENT_TASK_OFFSET: 8,

  /** Durata clipirii de refuz (flashRefusal), in AgentSprite si ContractCard. */
  FLASH_DURATION_MS: 220,
} as const;

export const COLORS = {
  BACKGROUND: 0x14161c,
  OFFICE_BG: 0x1b1e27,
  CONTRACT_BG: 0x1f222c,

  AGENT_IDLE: 0x3a3f4b,
  AGENT_ALLOCATED: 0x9c7a26,
  AGENT_WORKING: 0x2f7d4f,
  AGENT_BLOCKED: 0x7d2f2f,
  AGENT_STROKE: 0xffffff,

  TASK_LOCKED: 0x23262f,
  TASK_AVAILABLE: 0x2a2d38,
  TASK_IN_PROGRESS: 0x2a4d63,
  TASK_DONE: 0x2f7d4f,
  TASK_BAR_FILL: 0x4c8dff,
  TASK_REFUSED_FLASH: 0xd94c4c,

  TEXT_PRIMARY: '#e6e8ee',
  TEXT_MUTED: '#b7bccb',
} as const;

/** Etichete afisate pentru fiecare SkillId - cheia interna ramane neschimbata. */
export const SKILL_LABELS: Record<SkillId, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  databases: 'Databases',
  ai_integration: 'AI Integration',
} as const;

/** Pozitia (centru) unui slot de birou, in coordonate de scena. */
export function officeSlotPosition(index: number): { x: number; y: number } {
  const col = index % LAYOUT.OFFICE_COLUMNS;
  const row = Math.floor(index / LAYOUT.OFFICE_COLUMNS);
  const gridY = LAYOUT.OFFICE_Y + LAYOUT.OFFICE_TITLE_HEIGHT;
  const x = LAYOUT.OFFICE_X + LAYOUT.OFFICE_PADDING
    + col * (LAYOUT.AGENT_WIDTH + LAYOUT.OFFICE_PADDING) + LAYOUT.AGENT_WIDTH / 2;
  const y = gridY + LAYOUT.OFFICE_PADDING
    + row * LAYOUT.OFFICE_ROW_HEIGHT + LAYOUT.AGENT_HEIGHT / 2;
  return { x, y };
}

/** Skill-ul dominant al unui agent (nivelul cel mai mare); egalitate -> primul din SKILL_IDS. */
export function dominantSkill(agent: Agent): { skill: SkillId; level: number } {
  let best: SkillId = SKILL_IDS[0];
  let bestLevel = agent.skills[best];
  for (const skill of SKILL_IDS) {
    if (agent.skills[skill] > bestLevel) {
      best = skill;
      bestLevel = agent.skills[skill];
    }
  }
  return { skill: best, level: bestLevel };
}

/** Inaltimea unui ContractCard, in functie de cate sub-task-uri (frunze) are contractul. */
export function contractCardHeight(taskCount: number): number {
  return LAYOUT.CONTRACT_HEADER_HEIGHT
    + taskCount * (LAYOUT.TASK_ROW_HEIGHT + LAYOUT.TASK_ROW_GAP)
    + LAYOUT.CONTRACT_CARD_PADDING;
}

const TASK_STATUS_COLOR: Record<TaskStatus, number> = {
  locked: COLORS.TASK_LOCKED,
  available: COLORS.TASK_AVAILABLE,
  in_progress: COLORS.TASK_IN_PROGRESS,
  done: COLORS.TASK_DONE,
};

export function taskStatusColor(status: TaskStatus): number {
  return TASK_STATUS_COLOR[status];
}
