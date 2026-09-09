import { describe, expect, it } from 'vitest';
import {
  contractCardHeight,
  LAYOUT,
  officeSlotPosition,
  taskStatusColor,
} from '../../src/game/layout';
import type { TaskStatus } from '../../src/sim';

describe('officeSlotPosition', () => {
  it('e determinista: acelasi index da mereu aceeasi pozitie', () => {
    expect(officeSlotPosition(5)).toEqual(officeSlotPosition(5));
  });

  it('returneaza coordonate finite pentru un singur agent (index 0)', () => {
    const pos = officeSlotPosition(0);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
  });

  it('nicio pereche de slot-uri nu se suprapune, pana la 12 agenti', () => {
    const halfW = LAYOUT.AGENT_WIDTH / 2;
    const halfH = LAYOUT.AGENT_HEIGHT / 2;
    const positions = Array.from({ length: 12 }, (_, i) => officeSlotPosition(i));

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i]!;
        const b = positions[j]!;
        const overlapX = Math.abs(a.x - b.x) < 2 * halfW;
        const overlapY = Math.abs(a.y - b.y) < 2 * halfH;
        const overlaps = overlapX && overlapY;
        expect(overlaps).toBe(false);
      }
    }
  });

  // T-40 a schimbat asezarea de la 2 coloane la o singura coloana verticala, dupa
  // referinta vizuala (lista de echipa din Pokemon SV). Testul nu a fost slabit ca
  // sa treaca: verifica acum invarianta reala a noului layout, si tot poate cadea.
  it('agentii se aseaza pe o singura coloana: acelasi x, y strict crescator', () => {
    const pozitii = Array.from({ length: 6 }, (_, i) => officeSlotPosition(i));

    for (const p of pozitii) {
      expect(p.x).toBe(pozitii[0]!.x);
    }
    for (let i = 1; i < pozitii.length; i++) {
      expect(pozitii[i]!.y).toBeGreaterThan(pozitii[i - 1]!.y);
    }
  });

  it('pasul vertical dintre doi agenti consecutivi este constant', () => {
    const pas = officeSlotPosition(1).y - officeSlotPosition(0).y;
    for (let i = 2; i < 6; i++) {
      expect(officeSlotPosition(i).y - officeSlotPosition(i - 1).y).toBe(pas);
    }
  });
});

describe('contractCardHeight', () => {
  it('un contract fara sub-task-uri are inaltimea header + padding', () => {
    expect(contractCardHeight(0)).toBe(LAYOUT.CONTRACT_HEADER_HEIGHT + LAYOUT.CONTRACT_CARD_PADDING);
  });

  it('inaltimea creste strict cu numarul de sub-task-uri', () => {
    const inaltimi = [0, 1, 2, 3, 4].map(contractCardHeight);
    for (let i = 1; i < inaltimi.length; i++) {
      expect(inaltimi[i]!).toBeGreaterThan(inaltimi[i - 1]!);
    }
  });

  it('fiecare sub-task suplimentar adauga exact TASK_ROW_HEIGHT + TASK_ROW_GAP', () => {
    const pas = LAYOUT.TASK_ROW_HEIGHT + LAYOUT.TASK_ROW_GAP;
    expect(contractCardHeight(3) - contractCardHeight(2)).toBe(pas);
    expect(contractCardHeight(7) - contractCardHeight(6)).toBe(pas);
  });
});

describe('taskStatusColor', () => {
  const statuses: readonly TaskStatus[] = ['locked', 'available', 'in_progress', 'done'];

  it('fiecare stare are o culoare definita (numar)', () => {
    for (const status of statuses) {
      expect(typeof taskStatusColor(status)).toBe('number');
    }
  });

  it('doua stari diferite nu au niciodata aceeasi culoare', () => {
    const culori = statuses.map(taskStatusColor);
    const unice = new Set(culori);
    expect(unice.size).toBe(statuses.length);
  });
});
