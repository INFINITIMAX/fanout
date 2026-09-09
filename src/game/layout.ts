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
 * Un singur nivel de tipografie: marime, grosime (folosita ca `fontStyle` in
 * Phaser, care accepta un numar de weight in locul cuvantului "bold"), si
 * spatiere optionala intre litere, pentru titlurile de panou.
 */
interface FontVariant {
  readonly SIZE: number;
  readonly WEIGHT: string;
  readonly LETTER_SPACING?: number;
}

/**
 * Stack unic de fonturi, folosit atat de textele Phaser (src/game/) cat si de
 * HUD-ul DOM (src/ui/hud.ts). hud.ts nu poate importa din acest fisier (regula
 * de separare game/ vs ui/ din CLAUDE.md), asa ca acolo stack-ul e duplicat literal
 * - valoarea trebuie tinuta identica manual daca se schimba aici.
 */
export const FONT = {
  FAMILY: `'M PLUS Rounded 1c', system-ui, sans-serif`,
  /** Titluri de panou: AGENTS, OFFERS, BANKRUPT - majuscule, aplicate la locul de folosire. */
  TITLE: { SIZE: 18, WEIGHT: '800', LETTER_SPACING: 1.5 } satisfies FontVariant,
  BODY: { SIZE: 15, WEIGHT: '700' } satisfies FontVariant,
  SMALL: { SIZE: 13, WEIGHT: '700' } satisfies FontVariant,
  /** Niveluri, bani, procente, ore - orice cifra care trebuie sa iasa in evidenta. */
  NUMERIC: { SIZE: 14, WEIGHT: '800' } satisfies FontVariant,
} as const;

export const RADIUS = {
  PANEL: 14,
  CARD: 12,
  PILL: 999,
} as const;

/** Deplasarea umbrei difuze de sub panouri (vezi src/game/render.ts). */
export const SHADOW = {
  OFFSET_X: 0,
  OFFSET_Y: 3,
} as const;

export const LAYOUT = {
  SCENE_WIDTH: 900,
  SCENE_HEIGHT: 640,

  // Panoul AGENTS: lista verticala de carduri, o singura coloana.
  OFFICE_X: 20,
  OFFICE_Y: 20,
  OFFICE_WIDTH: 200,
  OFFICE_HEIGHT: 600,
  OFFICE_TITLE_HEIGHT: 34,
  OFFICE_COLUMNS: 1,
  OFFICE_ROW_HEIGHT: 80,
  OFFICE_PADDING: 10,

  // Zona contractelor active: cate un ContractCard stivuit vertical.
  CONTRACTS_X: 240,
  CONTRACTS_Y: 20,
  CONTRACT_CARD_GAP: 16,
  CONTRACT_CARD_WIDTH: 630,
  CONTRACT_HEADER_HEIGHT: 44,
  CONTRACT_CARD_PADDING: 14,

  TASK_ROW_HEIGHT: 40,
  TASK_ROW_GAP: 8,
  TASK_BAR_WIDTH: 360,
  TASK_BAR_HEIGHT: 20,

  // Cardul unui agent (folosit atat in lista AGENTS cat si "parcat" langa randul de task).
  AGENT_WIDTH: 176,
  AGENT_HEIGHT: 68,
  AGENT_BAR_HEIGHT: 18,
  AGENT_BADGE_SIZE: 22,
  AGENT_DOT_RADIUS: 5,
  /** Distanta dintre marginea randului de task si cardul agentului alocat. */
  AGENT_TASK_OFFSET: 10,

  /** Durata clipirii de refuz (flashRefusal), in AgentSprite si ContractCard. */
  FLASH_DURATION_MS: 220,
} as const;

export const COLORS = {
  BACKGROUND: 0x14161c,

  PANEL_BG: 0x1a2030,
  PANEL_BG_ALPHA: 0.92,
  PANEL_BORDER: 0xffffff,
  PANEL_BORDER_ALPHA: 0.14,
  PANEL_SHADOW: 0x000000,
  PANEL_SHADOW_ALPHA: 0.45,

  SELECTION: 0xf5c518,
  SELECTION_TEXT: 0x1a2030,

  BAR_TRACK: 0x000000,
  BAR_TRACK_ALPHA: 0.35,
  BAR_FILL_OK: 0x4ad46a,
  BAR_FILL_WARN: 0xf5a623,
  BAR_FILL_DANGER: 0xe8514f,

  TEXT: 0xffffff,
  TEXT_DIM: 0xb9c0d0,

  // Cele patru stari reale ale agentului (T-38) - fundalul cardului.
  AGENT_IDLE: 0x353c52,
  AGENT_ASSIGNED: 0x8a6a1f,
  AGENT_WORKING: 0x2c6b48,
  AGENT_BLOCKED: 0x763232,

  // Fundalul unui rand de sub-task, dupa statusul lui.
  ROW_LOCKED: 0x1c2029,
  ROW_AVAILABLE: 0x232a3c,
  ROW_IN_PROGRESS: 0x24344f,
  ROW_DONE: 0x1f3a2c,

  REFUSAL: 0xe8514f,
} as const;

/** Etichete afisate pentru fiecare SkillId - cheia interna ramane neschimbata. */
export const SKILL_LABELS: Record<SkillId, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  databases: 'Databases',
  ai_integration: 'AI Integration',
} as const;

/** Cod scurt pentru insigna de skill dominant de pe cardul agentului. */
export const SKILL_BADGES: Record<SkillId, string> = {
  frontend: 'FE',
  backend: 'BE',
  databases: 'DB',
  ai_integration: 'AI',
} as const;

/** Sub acest prag, pierderea prin coordonare e doar un avertisment; peste, e grava. */
export const COORDINATION_DANGER_THRESHOLD = 25;

/** Converteste o culoare hex Phaser (0xRRGGBB) intr-un string CSS, pentru stilul textelor. */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Culoarea insignei de pierdere prin coordonare, dupa gravitate. */
export function coordinationSeverityColor(percent: number): number {
  return percent >= COORDINATION_DANGER_THRESHOLD ? COLORS.BAR_FILL_DANGER : COLORS.BAR_FILL_WARN;
}

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
  locked: COLORS.ROW_LOCKED,
  available: COLORS.ROW_AVAILABLE,
  in_progress: COLORS.ROW_IN_PROGRESS,
  done: COLORS.ROW_DONE,
};

export function taskStatusColor(status: TaskStatus): number {
  return TASK_STATUS_COLOR[status];
}
