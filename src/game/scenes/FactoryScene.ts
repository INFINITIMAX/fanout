// Scena principala: bucla de timp, agentii, contractele active si
// drag & drop-ul care le leaga. Singura sursa de adevar e state (GameState);
// scena doar citeste si randeaza, iar comenzile jucatorului trec exclusiv
// prin functiile din src/sim/index.ts.

import * as Phaser from 'phaser';
import {
  type GameState,
  acceptOffer,
  activeContracts,
  assignAgent,
  burnRatePerHour,
  canWorkOn,
  createInitialState,
  isWorkable,
  offeredContracts,
  tick,
} from '../../sim';
import { BALANCE } from '../../data/balance';
import { COLORS, FONT, LAYOUT, contractCardHeight, officeSlotPosition } from '../layout';
import { createHud, type Hud, type Speed } from '../../ui/hud';
import { AgentSprite, type AgentVisualStatus } from '../entities/AgentSprite';
import { ContractCard } from '../entities/ContractCard';

interface DropTarget {
  readonly contractId: string;
  readonly taskId: string;
}

export class FactoryScene extends Phaser.Scene {
  private state!: GameState;
  private speed: Speed = 1;
  private accumulatorMs = 0;
  private hud!: Hud;
  private draggingAgentId: string | null = null;
  private pauseBanner!: Phaser.GameObjects.Text;

  private readonly agentSprites = new Map<string, AgentSprite>();
  private readonly contractCards = new Map<string, ContractCard>();

  constructor() {
    super('FactoryScene');
  }

  create(): void {
    this.state = createInitialState(Date.now() >>> 0);
    this.speed = 1;
    this.accumulatorMs = 0;

    this.add
      .rectangle(LAYOUT.OFFICE_X, LAYOUT.OFFICE_Y, LAYOUT.OFFICE_WIDTH, LAYOUT.OFFICE_HEIGHT, COLORS.OFFICE_BG)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLORS.AGENT_STROKE, 0.15);
    this.add
      .text(LAYOUT.OFFICE_X + 12, LAYOUT.OFFICE_Y + 8, `AGENTS (${this.state.agents.length})`, {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_TITLE}px`,
        fontStyle: 'bold',
        color: COLORS.TEXT_PRIMARY,
      })
      .setOrigin(0, 0);

    this.pauseBanner = this.add
      .text(LAYOUT.SCENE_WIDTH / 2, 8, 'PAUSED', {
        fontFamily: FONT.FAMILY,
        fontSize: `${FONT.SIZE_TITLE}px`,
        fontStyle: 'bold',
        color: '#14161c',
        backgroundColor: '#ffb347',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setDepth(1000)
      .setVisible(false);

    this.hud = createHud({
      onSetSpeed: (speed) => {
        this.speed = speed;
        this.renderAll();
      },
      onAcceptOffer: (contractId) => {
        acceptOffer(this.state, contractId);
        this.renderAll();
      },
      onRestart: () => this.restart(),
    });

    this.createAgentSprites();

    this.input.on(
      'drag',
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        if (!(gameObject instanceof AgentSprite)) {
          return;
        }
        gameObject.x = dragX;
        gameObject.y = dragY;
        this.updateDragHighlight(gameObject);
      },
    );

    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof AgentSprite) {
        this.draggingAgentId = gameObject.agentId;
      }
    });

    this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof AgentSprite) {
        this.handleDrop(gameObject);
      }
    });

    this.renderAll();
  }

  override update(_time: number, delta: number): void {
    if (this.state.bankrupt || this.speed === 0) {
      return;
    }

    const msPerTick = 1000 / BALANCE.TICKS_PER_SECOND;
    this.accumulatorMs += delta * this.speed;

    let advanced = false;
    while (this.accumulatorMs >= msPerTick) {
      this.accumulatorMs -= msPerTick;
      tick(this.state);
      advanced = true;
      if (this.state.bankrupt) {
        break;
      }
    }
    if (advanced) {
      this.renderAll();
    }
  }

  private createAgentSprites(): void {
    this.state.agents.forEach((agent, index) => {
      const { x, y } = officeSlotPosition(index);
      this.agentSprites.set(agent.id, new AgentSprite(this, agent, x, y));
    });
  }

  private restart(): void {
    for (const sprite of this.agentSprites.values()) {
      sprite.destroy();
    }
    this.agentSprites.clear();
    for (const card of this.contractCards.values()) {
      card.destroy();
    }
    this.contractCards.clear();

    this.state = createInitialState(Date.now() >>> 0);
    this.speed = 1;
    this.accumulatorMs = 0;
    this.draggingAgentId = null;

    this.createAgentSprites();
    this.hud.hideBankrupt();
    this.renderAll();
  }

  /** Agentii care in acest moment chiar consuma costul integral (lucreaza efectiv). */
  private currentlyActiveAgentIds(): Set<string> {
    const ids = new Set<string>();
    for (const agent of this.state.agents) {
      if (agent.assignedTaskId === null) {
        continue;
      }
      const task = this.state.tasks[agent.assignedTaskId];
      if (task && isWorkable(task)) {
        ids.add(agent.id);
      }
    }
    return ids;
  }

  private renderAll(): void {
    const activeIds = this.currentlyActiveAgentIds();

    this.syncContractCards();
    this.syncAgentPositions();
    this.pauseBanner.setVisible(this.speed === 0);

    this.hud.render({
      state: this.state,
      burnRatePerHour: burnRatePerHour(this.state, activeIds),
      offered: offeredContracts(this.state),
    });

    if (this.state.bankrupt) {
      this.hud.showBankrupt(this.state.stats);
    }
  }

  private syncContractCards(): void {
    const active = activeContracts(this.state);
    const activeIds = new Set(active.map((c) => c.id));

    for (const [id, card] of this.contractCards) {
      if (!activeIds.has(id)) {
        card.destroy();
        this.contractCards.delete(id);
      }
    }

    let y = LAYOUT.CONTRACTS_Y;
    for (const contract of active) {
      let card = this.contractCards.get(contract.id);
      if (!card) {
        card = new ContractCard(this, this.state, contract, LAYOUT.CONTRACTS_X, y);
        this.contractCards.set(contract.id, card);
      } else {
        card.setPosition(LAYOUT.CONTRACTS_X, y);
      }
      card.update(this.state);
      y += contractCardHeight(card.taskCount) + LAYOUT.CONTRACT_CARD_GAP;
    }
  }

  private syncAgentPositions(): void {
    const paused = this.speed === 0;

    this.state.agents.forEach((agent, index) => {
      const sprite = this.agentSprites.get(agent.id);
      if (!sprite || sprite.agentId === this.draggingAgentId) {
        return;
      }

      if (agent.assignedTaskId !== null) {
        const task = this.state.tasks[agent.assignedTaskId];
        const card = task ? this.contractCards.get(task.contractId) : undefined;
        const dropRect = card?.getDropRects().find((d) => d.taskId === agent.assignedTaskId);
        if (task && dropRect) {
          const status: AgentVisualStatus = !isWorkable(task) ? 'blocked' : paused ? 'assigned' : 'working';
          sprite.setPosition(
            dropRect.rect.x + dropRect.rect.width + LAYOUT.AGENT_WIDTH / 2 + LAYOUT.AGENT_TASK_OFFSET,
            dropRect.rect.y + dropRect.rect.height / 2,
          );
          sprite.setStatus(status, task.requiredSkill);
          return;
        }
      }

      const { x, y } = officeSlotPosition(index);
      sprite.setPosition(x, y);
      sprite.setStatus('idle');
    });
  }

  /** Ținta se determină prin suprapunerea dreptunghiului agentului tras cu rândurile de task; câștigă aria cea mai mare. */
  private findDropTarget(agentBounds: Phaser.Geom.Rectangle): DropTarget | null {
    let best: DropTarget | null = null;
    let bestArea = 0;
    for (const card of this.contractCards.values()) {
      for (const { taskId, rect } of card.getDropRects()) {
        if (!Phaser.Geom.Rectangle.Overlaps(agentBounds, rect)) {
          continue;
        }
        const intersection = Phaser.Geom.Rectangle.Intersection(agentBounds, rect);
        const area = intersection.width * intersection.height;
        if (area > bestArea) {
          bestArea = area;
          best = { contractId: card.contractId, taskId };
        }
      }
    }
    return best;
  }

  private clearRowHighlights(): void {
    for (const card of this.contractCards.values()) {
      card.clearRowHighlight();
    }
  }

  private updateDragHighlight(sprite: AgentSprite): void {
    this.clearRowHighlights();
    const target = this.findDropTarget(sprite.getBounds());
    if (!target) {
      sprite.setDragHighlight(false);
      return;
    }
    const agent = this.state.agents.find((a) => a.id === sprite.agentId);
    const task = this.state.tasks[target.taskId];
    if (!agent || !task) {
      sprite.setDragHighlight(true);
      return;
    }
    const occupied = this.state.agents.some((a) => a.id !== agent.id && a.assignedTaskId === target.taskId);
    const compatible = isWorkable(task) && canWorkOn(agent, task) && !occupied;
    sprite.setDragHighlight(!compatible);
    this.contractCards.get(target.contractId)?.setRowHighlight(target.taskId, compatible);
  }

  private handleDrop(sprite: AgentSprite): void {
    sprite.setDragHighlight(false);
    this.clearRowHighlights();
    this.draggingAgentId = null;

    const target = this.findDropTarget(sprite.getBounds());
    if (target) {
      const success = assignAgent(this.state, sprite.agentId, target.taskId);
      if (!success) {
        sprite.flashRefusal();
        this.contractCards.get(target.contractId)?.flashRefusal(target.taskId);
      }
    }

    this.renderAll();
  }
}
