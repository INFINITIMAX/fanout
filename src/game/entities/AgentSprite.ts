// Reprezentarea vizuala a unui agent: un card rotunjit cu numele lui, nivelul
// (suma nivelurilor de skill), o bara stil HP spre urmatorul punct de skill,
// o insigna cu skill-ul dominant si un punct auriu cand are puncte necheltuite.
// Starea trebuie citibila fara click (spec.md 2.6) - de-aia fundalul cardului
// ramane colorat dupa cele patru stari reale (T-38).

import * as Phaser from 'phaser';
import type { Agent } from '../../sim';
import { totalSkillLevels } from '../../sim';
import { BALANCE } from '../../data/balance';
import { COLORS, LAYOUT, FONT, RADIUS, SKILL_BADGES, dominantSkill } from '../layout';
import { paintBar, paintPanel, textStyle } from '../render';

/**
 * Patru stari, derivate din starea reala (nu din activitatea ultimului tick):
 * idle - fara task alocat; assigned - task lucrabil, dar jocul e pe pauza;
 * working - task lucrabil, jocul ruleaza; blocked - task alocat dar nelucrabil
 * (dependenta neterminata).
 */
export type AgentVisualStatus = 'idle' | 'assigned' | 'working' | 'blocked';

const STATUS_COLOR: Record<AgentVisualStatus, number> = {
  idle: COLORS.AGENT_IDLE,
  assigned: COLORS.AGENT_ASSIGNED,
  working: COLORS.AGENT_WORKING,
  blocked: COLORS.AGENT_BLOCKED,
};

export class AgentSprite extends Phaser.GameObjects.Container {
  readonly agentId: string;

  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly barLabel: Phaser.GameObjects.Text;
  private readonly badgeBg: Phaser.GameObjects.Graphics;
  private readonly badgeText: Phaser.GameObjects.Text;
  private readonly skillPointDot: Phaser.GameObjects.Arc;

  private readonly barWidth: number;
  private readonly barX: number;
  private readonly barY: number;

  private status: AgentVisualStatus = 'idle';

  constructor(scene: Phaser.Scene, agent: Agent, x: number, y: number) {
    super(scene, x, y);
    this.agentId = agent.id;

    const halfWidth = LAYOUT.AGENT_WIDTH / 2;
    const halfHeight = LAYOUT.AGENT_HEIGHT / 2;
    const padding = 10;

    this.panel = scene.add.graphics();
    this.panel.setPosition(-halfWidth, -halfHeight);
    paintPanel(this.panel, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, {
      radius: RADIUS.CARD,
      bgColor: STATUS_COLOR.idle,
      bgAlpha: COLORS.PANEL_BG_ALPHA,
    });

    this.nameText = scene.add
      .text(-halfWidth + padding, -halfHeight + 14, agent.name, textStyle(FONT.BODY, COLORS.TEXT))
      .setOrigin(0, 0.5);

    this.levelText = scene.add
      .text(halfWidth - padding - LAYOUT.AGENT_BADGE_SIZE - 8, -halfHeight + 14, '', textStyle(FONT.SMALL, COLORS.TEXT_DIM))
      .setOrigin(1, 0.5);

    this.barWidth = LAYOUT.AGENT_WIDTH - padding * 2 - LAYOUT.AGENT_BADGE_SIZE - 8;
    this.barX = -halfWidth + padding;
    this.barY = 6;

    this.bar = scene.add.graphics();
    this.bar.setPosition(this.barX, this.barY);
    paintBar(this.bar, this.barWidth, LAYOUT.AGENT_BAR_HEIGHT, 0, COLORS.SELECTION);

    this.barLabel = scene.add
      .text(this.barX + this.barWidth / 2, this.barY + LAYOUT.AGENT_BAR_HEIGHT / 2, '', textStyle(FONT.NUMERIC, COLORS.TEXT))
      .setOrigin(0.5);

    const badgeCx = halfWidth - padding - LAYOUT.AGENT_BADGE_SIZE / 2;
    const badgeCy = this.barY + LAYOUT.AGENT_BAR_HEIGHT / 2;
    this.badgeBg = scene.add.graphics();
    this.badgeBg.setPosition(badgeCx - LAYOUT.AGENT_BADGE_SIZE / 2, badgeCy - LAYOUT.AGENT_BADGE_SIZE / 2);
    paintPanel(this.badgeBg, LAYOUT.AGENT_BADGE_SIZE, LAYOUT.AGENT_BADGE_SIZE, {
      radius: LAYOUT.AGENT_BADGE_SIZE / 2,
      bgColor: COLORS.BACKGROUND,
      bgAlpha: COLORS.PANEL_BG_ALPHA,
      shadow: false,
    });
    this.badgeText = scene.add
      .text(badgeCx, badgeCy, '', { ...textStyle(FONT.SMALL, COLORS.TEXT_DIM), fontSize: '10px' })
      .setOrigin(0.5);

    this.skillPointDot = scene.add
      .circle(-halfWidth + LAYOUT.AGENT_DOT_RADIUS + 4, -halfHeight + LAYOUT.AGENT_DOT_RADIUS + 4, LAYOUT.AGENT_DOT_RADIUS, COLORS.SELECTION)
      .setVisible(false);

    this.add([
      this.panel,
      this.nameText,
      this.levelText,
      this.bar,
      this.barLabel,
      this.badgeBg,
      this.badgeText,
      this.skillPointDot,
    ]);
    this.setSize(LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT);
    this.setInteractive({ draggable: true, useHandCursor: true });

    scene.add.existing(this);
    this.update(agent, 'idle');
  }

  /** Recalculeaza tot continutul cardului din starea curenta a agentului. */
  override update(agent: Agent, status: AgentVisualStatus): void {
    this.status = status;
    paintPanel(this.panel, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, {
      radius: RADIUS.CARD,
      bgColor: STATUS_COLOR[status],
      bgAlpha: COLORS.PANEL_BG_ALPHA,
    });

    this.levelText.setText(`Lv. ${totalSkillLevels(agent)}`);

    const hoursIntoLevel = agent.hoursWorked % BALANCE.HOURS_PER_SKILL_POINT;
    const ratio = hoursIntoLevel / BALANCE.HOURS_PER_SKILL_POINT;
    paintBar(this.bar, this.barWidth, LAYOUT.AGENT_BAR_HEIGHT, ratio, COLORS.SELECTION);
    this.barLabel.setText(`${Math.floor(hoursIntoLevel)} / ${BALANCE.HOURS_PER_SKILL_POINT} h`);

    const { skill } = dominantSkill(agent);
    this.badgeText.setText(SKILL_BADGES[skill]);

    this.skillPointDot.setVisible(agent.unspentSkillPoints > 0);
  }

  /** Contur de avertizare in timpul unui drag, peste un sub-task incompatibil. */
  setDragHighlight(blocked: boolean): void {
    paintPanel(this.panel, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, {
      radius: RADIUS.CARD,
      bgColor: STATUS_COLOR[this.status],
      bgAlpha: COLORS.PANEL_BG_ALPHA,
      borderColor: blocked ? COLORS.REFUSAL : COLORS.PANEL_BORDER,
      borderAlpha: blocked ? 1 : COLORS.PANEL_BORDER_ALPHA,
    });
  }

  /** Clipire rosie scurta - feedback ca alocarea a fost refuzata. */
  flashRefusal(): void {
    paintPanel(this.panel, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, {
      radius: RADIUS.CARD,
      bgColor: COLORS.REFUSAL,
      bgAlpha: COLORS.PANEL_BG_ALPHA,
    });
    this.scene.time.delayedCall(LAYOUT.FLASH_DURATION_MS, () => {
      paintPanel(this.panel, LAYOUT.AGENT_WIDTH, LAYOUT.AGENT_HEIGHT, {
        radius: RADIUS.CARD,
        bgColor: STATUS_COLOR[this.status],
        bgAlpha: COLORS.PANEL_BG_ALPHA,
      });
    });
  }
}
