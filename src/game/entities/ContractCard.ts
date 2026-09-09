// Reprezentarea vizuala a unui contract activ: titlu, plata, si cate un rand
// pentru fiecare sub-task (frunza), cu bara de progres si skill-ul cerut.
// Randul de coordonare arata pretul aglomerarii (spec.md 2.5/2.6): cand 2+
// agenti lucreaza simultan pe acest contract, jucatorul trebuie sa vada cat
// se pierde.

import * as Phaser from 'phaser';
import {
  type Contract,
  type GameState,
  coordinationLossPercent,
  leavesOfContract,
} from '../../sim';
import { COLORS, FONT, LAYOUT, SKILL_LABELS, contractCardHeight, taskStatusColor } from '../layout';

interface TaskRow {
  readonly taskId: string;
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly barFill: Phaser.GameObjects.Rectangle;
  readonly highlight: Phaser.GameObjects.Rectangle;
}

export class ContractCard extends Phaser.GameObjects.Container {
  readonly contractId: string;
  readonly taskCount: number;

  private readonly coordText: Phaser.GameObjects.Text;
  private readonly rows: TaskRow[] = [];

  constructor(scene: Phaser.Scene, state: GameState, contract: Contract, x: number, y: number) {
    super(scene, x, y);
    this.contractId = contract.id;

    const leaves = leavesOfContract(state, contract.id);
    this.taskCount = leaves.length;
    const height = contractCardHeight(this.taskCount);

    const panel = scene.add
      .rectangle(0, 0, LAYOUT.CONTRACT_CARD_WIDTH, height, COLORS.CONTRACT_BG)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xffffff, 0.08);

    const titleText = scene.add
      .text(
        LAYOUT.CONTRACT_CARD_PADDING,
        LAYOUT.CONTRACT_CARD_PADDING,
        `${contract.clientName} - ${contract.payout}$`,
        { fontFamily: FONT.FAMILY, fontSize: `${FONT.SIZE_TITLE}px`, color: COLORS.TEXT_PRIMARY, fontStyle: 'bold' },
      )
      .setOrigin(0, 0);

    this.coordText = scene.add
      .text(LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING, LAYOUT.CONTRACT_CARD_PADDING, '', {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_SECONDARY}px`,
        color: '#ffb347',
      })
      .setOrigin(1, 0);

    this.add([panel, titleText, this.coordText]);

    let rowY = LAYOUT.CONTRACT_HEADER_HEIGHT;
    for (const leaf of leaves) {
      const bg = scene.add
        .rectangle(
          LAYOUT.CONTRACT_CARD_PADDING,
          rowY,
          LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING * 2,
          LAYOUT.TASK_ROW_HEIGHT,
          COLORS.TASK_AVAILABLE,
        )
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xffffff, 0.06);

      const highlight = scene.add
        .rectangle(
          LAYOUT.CONTRACT_CARD_PADDING,
          rowY,
          LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING * 2,
          LAYOUT.TASK_ROW_HEIGHT,
          COLORS.AGENT_WORKING,
          0.35,
        )
        .setOrigin(0, 0)
        .setVisible(false);

      const label = scene.add
        .text(LAYOUT.CONTRACT_CARD_PADDING + 8, rowY + 6, leaf.label, {
          fontFamily: FONT.FAMILY,
          fontSize: `${FONT.SIZE_SECONDARY}px`,
          color: COLORS.TEXT_PRIMARY,
        })
        .setOrigin(0, 0);

      const skillBadge = scene.add
        .text(
          LAYOUT.CONTRACT_CARD_PADDING + 8,
          rowY + LAYOUT.TASK_ROW_HEIGHT - 17,
          `${SKILL_LABELS[leaf.requiredSkill]} ${leaf.minLevel}+`,
          { fontFamily: FONT.FAMILY, fontSize: `${FONT.SIZE_SECONDARY}px`, color: COLORS.TEXT_MUTED },
        )
        .setOrigin(0, 0);

      const barX = LAYOUT.CONTRACT_CARD_WIDTH - LAYOUT.CONTRACT_CARD_PADDING - LAYOUT.TASK_BAR_WIDTH;
      const barY = rowY + (LAYOUT.TASK_ROW_HEIGHT - LAYOUT.TASK_BAR_HEIGHT) / 2;

      const barBg = scene.add
        .rectangle(barX, barY, LAYOUT.TASK_BAR_WIDTH, LAYOUT.TASK_BAR_HEIGHT, COLORS.TASK_LOCKED)
        .setOrigin(0, 0);
      const barFill = scene.add.rectangle(barX, barY, 0, LAYOUT.TASK_BAR_HEIGHT, COLORS.TASK_BAR_FILL).setOrigin(0, 0);

      this.add([bg, highlight, label, skillBadge, barBg, barFill]);
      this.rows.push({ taskId: leaf.id, bg, barFill, highlight });

      rowY += LAYOUT.TASK_ROW_HEIGHT + LAYOUT.TASK_ROW_GAP;
    }

    scene.add.existing(this);
  }

  /** Recalculeaza barele de progres, culorile de status si indicatorul de coordonare. */
  override update(state: GameState): void {
    const leaves = leavesOfContract(state, this.contractId);

    const activeAgents = state.agents.filter((a) => {
      if (a.assignedTaskId === null) {
        return false;
      }
      const task = state.tasks[a.assignedTaskId];
      return task !== undefined && task.contractId === this.contractId;
    });

    this.coordText.setText(
      activeAgents.length >= 2
        ? `${activeAgents.length} agents at once - Coordination loss: ${coordinationLossPercent(activeAgents.length)}%`
        : '',
    );

    for (const row of this.rows) {
      const task = leaves.find((leaf) => leaf.id === row.taskId);
      if (!task) {
        continue;
      }
      const ratio = task.effortHours > 0 ? Math.min(1, task.progressHours / task.effortHours) : 1;
      row.barFill.width = LAYOUT.TASK_BAR_WIDTH * ratio;
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
    row.bg.setFillStyle(COLORS.TASK_REFUSED_FLASH);
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
    row.highlight.setFillStyle(ok ? COLORS.AGENT_WORKING : COLORS.TASK_REFUSED_FLASH, 0.35);
    row.highlight.setVisible(true);
  }

  /** Ascunde evidentierea de drag de pe toate randurile. */
  clearRowHighlight(): void {
    for (const row of this.rows) {
      row.highlight.setVisible(false);
    }
  }
}
