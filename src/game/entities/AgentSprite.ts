// Reprezentarea vizuala a unui agent: un dreptunghi cu numele lui, skill-ul
// dominant si nivelul (sub nume), si starea curenta (culoare + text).
// Starea trebuie citibila fara click (spec.md 2.6).

import * as Phaser from 'phaser';
import type { Agent, SkillId } from '../../sim';
import { COLORS, FONT, LAYOUT, SKILL_LABELS, dominantSkill } from '../layout';

/**
 * Patru stari, derivate din starea reala (nu din activitatea ultimului tick):
 * idle - fara task alocat; assigned - task lucrabil, dar jocul e pe pauza;
 * working - task lucrabil, jocul ruleaza; blocked - task alocat dar nelucrabil
 * (dependenta neterminata).
 */
export type AgentVisualStatus = 'idle' | 'assigned' | 'working' | 'blocked';

const STATUS_LABEL: Record<AgentVisualStatus, string> = {
  idle: 'idle',
  assigned: 'assigned',
  working: 'working',
  blocked: 'blocked',
};

const STATUS_COLOR: Record<AgentVisualStatus, number> = {
  idle: COLORS.AGENT_IDLE,
  assigned: COLORS.AGENT_ALLOCATED,
  working: COLORS.AGENT_WORKING,
  blocked: COLORS.AGENT_BLOCKED,
};

export class AgentSprite extends Phaser.GameObjects.Container {
  readonly agentId: string;

  private readonly box: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly skillText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, agent: Agent, x: number, y: number) {
    super(scene, x, y);
    this.agentId = agent.id;

    const { skill, level } = dominantSkill(agent);
    const halfHeight = LAYOUT.AGENT_HEIGHT / 2;

    this.box = scene.add
      .rectangle(0, 0, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, COLORS.AGENT_IDLE)
      .setStrokeStyle(2, COLORS.AGENT_STROKE, 0.2);
    this.nameText = scene.add
      .text(0, -halfHeight + 10, agent.name, {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_PRIMARY}px`,
        color: COLORS.TEXT_PRIMARY,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.skillText = scene.add
      .text(0, 0, `${SKILL_LABELS[skill]} ${level}`, {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_SECONDARY}px`,
        color: COLORS.TEXT_MUTED,
      })
      .setOrigin(0.5);
    this.statusText = scene.add
      .text(0, halfHeight - 11, STATUS_LABEL.idle, {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_SECONDARY}px`,
        color: COLORS.TEXT_MUTED,
      })
      .setOrigin(0.5);

    this.add([this.box, this.nameText, this.skillText, this.statusText]);
    this.setSize(LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT);
    this.setInteractive({ draggable: true, useHandCursor: true });

    scene.add.existing(this);
  }

  /** Actualizeaza culoarea si eticheta de stare. `detail` e skill-ul task-ului, cand e alocat. */
  setStatus(status: AgentVisualStatus, detail?: SkillId): void {
    this.box.setFillStyle(STATUS_COLOR[status]);
    this.statusText.setText(
      detail ? `${STATUS_LABEL[status]} · ${SKILL_LABELS[detail]}` : STATUS_LABEL[status],
    );
  }

  /** Contur rosu in timpul unui drag, peste un sub-task incompatibil. */
  setDragHighlight(blocked: boolean): void {
    this.box.setStrokeStyle(
      blocked ? 3 : 2,
      blocked ? COLORS.TASK_REFUSED_FLASH : COLORS.AGENT_STROKE,
      blocked ? 1 : 0.2,
    );
  }

  /** Clipire rosie scurta - feedback ca alocarea a fost refuzata. */
  flashRefusal(): void {
    const original = this.box.fillColor;
    this.box.setFillStyle(COLORS.AGENT_BLOCKED);
    this.scene.time.delayedCall(LAYOUT.FLASH_DURATION_MS, () => {
      this.box.setFillStyle(original);
    });
  }
}
