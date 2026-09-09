// Reprezentarea vizuala a unui contract activ: card rotunjit cu umbra, titlu,
// si cate un rand pentru fiecare sub-task (frunza), cu bara de progres stil HP
// (procent scris inauntru) si skill-ul cerut. Insigna de coordonare arata
// pretul aglomerarii (spec.md 2.5/2.6): cand 2+ agenti lucreaza simultan pe
// acest contract, jucatorul trebuie sa vada cat se pierde - e cel mai vizibil
// lucru de pe card cand apare.

import * as Phaser from 'phaser';
import {
  type Contract,
  type GameState,
  coordinationLossPercent,
  leavesOfContract,
} from '../../sim';
import {
  COLORS,
  FONT,
  LAYOUT,
  RADIUS,
  SKILL_LABELS,
  contractCardHeight,
  coordinationSeverityColor,
  cssColor,
  taskStatusColor,
} from '../layout';
import { paintBar, paintPanel, textStyle } from '../render';

interface TaskRow {
  readonly taskId: string;
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly highlight: Phaser.GameObjects.Rectangle;
  readonly bar: Phaser.GameObjects.Graphics;
  readonly barLabel: Phaser.GameObjects.Text;
}

export class ContractCard extends Phaser.GameObjects.Container {
  readonly contractId: string;
  readonly taskCount: number;

  private readonly coordBadgeBg: Phaser.GameObjects.Graphics;
  private readonly coordBadgeText: Phaser.GameObjects.Text;
  private readonly rows: TaskRow[] = [];

  constructor(scene: Phaser.Scene, state: GameState, contract: Contract, x: number, y: number) {
    super(scene, x, y);
    this.contractId = contract.id;

    const leaves = leavesOfContract(state, contract.id);
    this.taskCount = leaves.length;
    const height = contractCardHeight(this.taskCount);

    const panel = scene.add.graphics();
    paintPanel(panel, LAYOUT.CONTRACT_CARD_WIDTH, height, { radius: RADIUS.PANEL });

    const titleText = scene.add
      .text(
        LAYOUT.CONTRACT_CARD_PADDING,
        LAYOUT.CONTRACT_CARD_PADDING,
        `${contract.clientName} - ${contract.payout}$`,
        { fontFamily: FONT.FAMILY, fontSize: `${FONT.TITLE.SIZE}px`, fontStyle: FONT.TITLE.WEIGHT, color: cssColor(COLORS.TEXT) },
      )
      .setOrigin(0, 0);

    this.coordBadgeBg = scene.add.graphics().setVisible(false);
    this.coordBadgeText = scene.add
      .text(0, 0, '', textStyle(FONT.SMALL, COLORS.SELECTION_TEXT))
      .setOrigin(1, 0)
      .setVisible(false);

    this.add([panel, titleText, this.coordBadgeBg, this.coordBadgeText]);

    let rowY = LAYOUT.CONTRACT_HEADER_HEIGHT;
    for (const leaf of leaves) {
      const bg = scene.add
        .rectangle(
          LAYOUT.CONTRACT_CARD_PADDING,
          rowY,
          LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING * 2,
          LAYOUT.TASK_ROW_HEIGHT,
          taskStatusColor(leaf.status),
        )
        .setOrigin(0, 0);

      const highlight = scene.add
        .rectangle(
          LAYOUT.CONTRACT_CARD_PADDING,
          rowY,
          LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING * 2,
          LAYOUT.TASK_ROW_HEIGHT,
          COLORS.BAR_FILL_OK,
          0.35,
        )
        .setOrigin(0, 0)
        .setVisible(false);

      const label = scene.add
        .text(LAYOUT.CONTRACT_CARD_PADDING + 8, rowY + 6, leaf.label, textStyle(FONT.SMALL, COLORS.TEXT))
        .setOrigin(0, 0);

      const skillBadge = scene.add
        .text(
          LAYOUT.CONTRACT_CARD_PADDING + 8,
          rowY + LAYOUT.TASK_ROW_HEIGHT - 17,
          `${SKILL_LABELS[leaf.requiredSkill]} ${leaf.minLevel}+`,
          textStyle(FONT.SMALL, COLORS.TEXT_DIM),
        )
        .setOrigin(0, 0);

      const barX = LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING - LAYOUT.TASK_BAR_WIDTH;
      const barY = rowY + (LAYOUT.TASK_ROW_HEIGHT - LAYOUT.TASK_BAR_HEIGHT) / 2;

      const bar = scene.add.graphics();
      bar.setPosition(barX, barY);
      paintBar(bar, LAYOUT.TASK_BAR_WIDTH, LAYOUT.TASK_BAR_HEIGHT, 0, COLORS.BAR_FILL_OK);

      const barLabel = scene.add
        .text(barX + LAYOUT.TASK_BAR_WIDTH / 2, barY + LAYOUT.TASK_BAR_HEIGHT / 2, '0%', textStyle(FONT.NUMERIC, COLORS.TEXT))
        .setOrigin(0.5);

      this.add([bg, highlight, label, skillBadge, bar, barLabel]);
      this.rows.push({ taskId: leaf.id, bg, highlight, bar, barLabel });

      rowY += LAYOUT.TASK_ROW_HEIGHT + LAYOUT.TASK_ROW_GAP;
    }

    scene.add.existing(this);
  }

  /** Recalculeaza barele de progres, culorile de status si insigna de coordonare. */
  override update(state: GameState): void {
    const leaves = leavesOfContract(state, this.contractId);

    const activeAgents = state.agents.filter((a) => {
      if (a.assignedTaskId === null) {
        return false;
      }
      const task = state.tasks[a.assignedTaskId];
      return task !== undefined && task.contractId === this.contractId;
    });

    if (activeAgents.length >= 2) {
      const percent = coordinationLossPercent(activeAgents.length);
      const label = `Coordination loss: ${percent}%`;
      this.coordBadgeText.setText(label).setVisible(true);
      const badgeWidth = this.coordBadgeText.width + 20;
      const badgeHeight = 22;
      const badgeX = LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING - badgeWidth;
      const badgeY = LAYOUT.CONTRACT_CARD_PADDING;
      this.coordBadgeBg.setPosition(badgeX, badgeY).setVisible(true);
      paintPanel(this.coordBadgeBg, badgeWidth, badgeHeight, {
        radius: badgeHeight / 2,
        bgColor: coordinationSeverityColor(percent),
        bgAlpha: 1,
        shadow: false,
        borderAlpha: 0,
      });
      this.coordBadgeText.setPosition(badgeX + badgeWidth - 10, badgeY + badgeHeight / 2 - this.coordBadgeText.height / 2);
    } else {
      this.coordBadgeText.setVisible(false);
      this.coordBadgeBg.setVisible(false);
    }

    for (const row of this.rows) {
      const task = leaves.find((leaf) => leaf.id === row.taskId);
      if (!task) {
        continue;
      }
      const ratio = task.effortHours > 0 ? Math.min(1, task.progressHours / task.effortHours) : 1;
      paintBar(row.bar, LAYOUT.TASK_BAR_WIDTH, LAYOUT.TASK_BAR_HEIGHT, ratio, COLORS.BAR_FILL_OK);
      row.barLabel.setText(`${Math.round(ratio * 100)}%`);
      row.bg.setFillStyle(taskStatusColor(task.status));
    }
  }

  /** Dreptunghiurile randurilor de sub-task, in coordonate de lume - pentru testul de drop. */
  getDropRects(): Array<{ taskId: string; rect: Phaser.Geom.Rectangle }> {
    return this.rows.map((row) => ({
      taskId: row.taskId,
      rect: new Phaser.Geom.Rectangle(this.x + row.bg.x, this.y + row.bg.y, row.bg.width, row.bg.height),
    }));
  }

  /** Feedback vizual de refuz: randul sub-task-ului clipeste rosu. */
  flashRefusal(taskId: string): void {
    const row = this.rows.find((r) => r.taskId === taskId);
    if (!row) {
      return;
    }
    const original = row.bg.fillColor;
    row.bg.setFillStyle(COLORS.REFUSAL);
    this.scene.time.delayedCall(LAYOUT.FLASH_DURATION_MS, () => {
      row.bg.setFillStyle(original);
    });
  }

  /** Evidentiaza randul unui task in timpul unui drag: verde daca alocarea e posibila, rosu daca nu. */
  setRowHighlight(taskId: string, ok: boolean): void {
    const row = this.rows.find((r) => r.taskId === taskId);
    if (!row) {
      return;
    }
    row.highlight.setFillStyle(ok ? COLORS.BAR_FILL_OK : COLORS.REFUSAL, 0.35);
    row.highlight.setVisible(true);
  }

  /** Ascunde evidentierea de drag de pe toate randurile. */
  clearRowHighlight(): void {
    for (const row of this.rows) {
      row.highlight.setVisible(false);
    }
  }
}
