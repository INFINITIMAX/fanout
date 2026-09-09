// HUD: bani, rata de ardere, tick, controlul vitezei (bara de jos), contracte
// livrate si oferte cu randul intreg ca actiune de acceptare (panoul OFFERS).
// DOM peste canvas (spec.md 2.2), randat doar cand FactoryScene apeleaza
// render() - dupa fiecare tick avansat, nu la fiecare frame.

import { type Contract, type GameState, leavesOfContract, type TaskNode } from '../sim';

/**
 * Acelasi stack de fonturi ca `FONT.FAMILY` din src/game/layout.ts. Nu poate fi
 * importat de acolo (src/ui/ importa exclusiv din src/sim/index.ts si src/data/),
 * asa ca valoarea e duplicata literal - se tine identica manual.
 *
 * Acelasi lucru pentru culorile si razele de rotunjire de mai jos: duplicat
 * literal din COLORS/RADIUS in src/game/layout.ts.
 */
const FONT_FAMILY = `'M PLUS Rounded 1c', system-ui, sans-serif`;

const PANEL_BG = 'rgba(26, 32, 48, 0.92)';
const PANEL_BORDER = 'rgba(255, 255, 255, 0.14)';
const PANEL_SHADOW = '0 4px 16px rgba(0, 0, 0, 0.45)';
const SELECTION = '#f5c518';
const SELECTION_TEXT = '#1a2030';
const TEXT = '#ffffff';
const TEXT_DIM = '#b9c0d0';
const BAR_FILL_DANGER = '#e8514f';

const RADIUS_PANEL = '14px';
const RADIUS_CARD = '12px';
const RADIUS_PILL = '999px';

export type Speed = 0 | 1 | 2 | 4;

export interface HudRenderData {
  readonly state: GameState;
  readonly burnRatePerHour: number;
  readonly offered: readonly Contract[];
}

export interface HudCallbacks {
  readonly onSetSpeed: (speed: Speed) => void;
  readonly onAcceptOffer: (contractId: string) => void;
  readonly onRestart: () => void;
}

export interface Hud {
  render(data: HudRenderData): void;
  showBankrupt(stats: GameState['stats']): void;
  hideBankrupt(): void;
}

const SPEED_LABELS: Record<Speed, string> = { 0: '⏸', 1: 'x1', 2: 'x2', 4: 'x4' };
const SPEEDS: readonly Speed[] = [0, 1, 2, 4];

const BOTTOM_BAR_HEIGHT = '52px';
const OFFERS_PANEL_WIDTH = '280px';

export function createHud(callbacks: HudCallbacks): Hud {
  document.body.style.fontFamily = FONT_FAMILY;
  document.body.style.color = TEXT;

  const bottomBar = document.createElement('div');
  styleFixed(bottomBar, { bottom: '0', left: '0', right: OFFERS_PANEL_WIDTH, height: BOTTOM_BAR_HEIGHT });
  Object.assign(bottomBar.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '0 16px',
    background: PANEL_BG,
    borderTop: `1px solid ${PANEL_BORDER}`,
    fontSize: '13px',
    zIndex: '10',
  });
  document.body.appendChild(bottomBar);

  const speedRow = document.createElement('div');
  Object.assign(speedRow.style, { display: 'flex', gap: '6px' });
  bottomBar.appendChild(speedRow);

  const speedButtons = new Map<Speed, HTMLButtonElement>();
  for (const speed of SPEEDS) {
    const btn = document.createElement('button');
    btn.textContent = SPEED_LABELS[speed];
    Object.assign(btn.style, {
      cursor: 'pointer',
      width: '34px',
      height: '34px',
      borderRadius: RADIUS_PILL,
      border: `1px solid ${PANEL_BORDER}`,
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      fontWeight: '700',
    });
    btn.addEventListener('click', () => {
      callbacks.onSetSpeed(speed);
      highlightSpeed(speed);
    });
    speedButtons.set(speed, btn);
    speedRow.appendChild(btn);
  }

  function highlightSpeed(active: Speed): void {
    for (const [speed, btn] of speedButtons) {
      const isActive = speed === active;
      Object.assign(btn.style, {
        background: isActive ? SELECTION : 'rgba(255, 255, 255, 0.06)',
        color: isActive ? SELECTION_TEXT : TEXT,
      });
    }
  }
  highlightSpeed(1);

  const statsRow = document.createElement('div');
  Object.assign(statsRow.style, { display: 'flex', gap: '20px', marginLeft: 'auto', fontWeight: '800' });
  bottomBar.appendChild(statsRow);

  const tickEl = document.createElement('span');
  const deliveredEl = document.createElement('span');
  const burnEl = document.createElement('span');
  const moneyEl = document.createElement('span');
  Object.assign(tickEl.style, { color: TEXT_DIM, fontWeight: '700' });
  Object.assign(deliveredEl.style, { color: TEXT_DIM, fontWeight: '700' });
  statsRow.append(tickEl, deliveredEl, burnEl, moneyEl);

  const offersPanel = document.createElement('div');
  styleFixed(offersPanel, { top: '0', right: '0', bottom: '0', width: OFFERS_PANEL_WIDTH });
  Object.assign(offersPanel.style, {
    background: PANEL_BG,
    borderLeft: `1px solid ${PANEL_BORDER}`,
    boxShadow: PANEL_SHADOW,
    padding: '14px',
    overflowY: 'auto',
    zIndex: '10',
  });
  document.body.appendChild(offersPanel);

  const offersTitle = document.createElement('div');
  offersTitle.textContent = 'OFFERS';
  Object.assign(offersTitle.style, {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '1.5px',
    marginBottom: '12px',
  });
  offersPanel.appendChild(offersTitle);

  const offersList = document.createElement('div');
  Object.assign(offersList.style, { display: 'flex', flexDirection: 'column', gap: '10px' });
  offersPanel.appendChild(offersList);

  const bankruptOverlay = document.createElement('div');
  styleFixed(bankruptOverlay, { top: '0', left: '0', right: '0', bottom: '0' });
  Object.assign(bankruptOverlay.style, {
    background: 'rgba(10, 11, 15, 0.85)',
    display: 'none',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    zIndex: '20',
  });
  document.body.appendChild(bankruptOverlay);

  const bankruptPanel = document.createElement('div');
  Object.assign(bankruptPanel.style, {
    background: PANEL_BG,
    border: `1px solid ${PANEL_BORDER}`,
    boxShadow: PANEL_SHADOW,
    borderRadius: RADIUS_PANEL,
    padding: '28px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  });
  bankruptOverlay.appendChild(bankruptPanel);

  const bankruptTitle = document.createElement('div');
  bankruptTitle.textContent = 'BANKRUPT';
  Object.assign(bankruptTitle.style, {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '1.5px',
    color: BAR_FILL_DANGER,
  });

  const bankruptStats = document.createElement('div');
  Object.assign(bankruptStats.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '15px',
    fontWeight: '700',
    textAlign: 'center',
  });

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'New company';
  Object.assign(restartBtn.style, {
    cursor: 'pointer',
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
    borderRadius: RADIUS_PILL,
    border: 'none',
    background: SELECTION,
    color: SELECTION_TEXT,
  });
  restartBtn.addEventListener('click', () => callbacks.onRestart());

  bankruptPanel.append(bankruptTitle, bankruptStats, restartBtn);

  return {
    render(data) {
      const { state, burnRatePerHour, offered } = data;
      moneyEl.textContent = `${Math.round(state.money)}$`;
      burnEl.textContent = `${Math.round(burnRatePerHour)}$/h`;
      tickEl.textContent = `Tick ${state.tick}`;
      deliveredEl.textContent = `Delivered ${state.stats.delivered}`;

      offersList.innerHTML = '';
      for (const contract of offered) {
        offersList.appendChild(buildOfferRow(state, contract, callbacks.onAcceptOffer));
      }
    },
    showBankrupt(stats) {
      bankruptStats.innerHTML = '';
      const rows = [
        `Contracts delivered: ${stats.delivered}`,
        `Revenue: ${Math.round(stats.revenue)}$`,
        `Spent: ${Math.round(stats.spent)}$`,
      ];
      for (const text of rows) {
        const row = document.createElement('div');
        row.textContent = text;
        bankruptStats.appendChild(row);
      }
      bankruptOverlay.style.display = 'flex';
    },
    hideBankrupt() {
      bankruptOverlay.style.display = 'none';
    },
  };
}

/** Un rand de oferta: numele clientului, plata, numarul de sub-task-uri si forma arborelui. Randul intreg e actiunea de acceptare. */
function buildOfferRow(state: GameState, contract: Contract, onAccept: (contractId: string) => void): HTMLDivElement {
  const leaves = leavesOfContract(state, contract.id);

  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: RADIUS_CARD,
    border: `1px solid ${PANEL_BORDER}`,
    cursor: 'pointer',
    transition: 'background 0.1s ease, color 0.1s ease',
  });

  const arrow = document.createElement('span');
  arrow.textContent = '▶';
  Object.assign(arrow.style, { opacity: '0', fontWeight: '800', flexShrink: '0' });

  const main = document.createElement('div');
  Object.assign(main.style, { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '0' });

  const top = document.createElement('div');
  Object.assign(top.style, { display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '15px' });
  const name = document.createElement('span');
  name.textContent = contract.clientName;
  const pay = document.createElement('span');
  pay.textContent = `${contract.payout}$`;
  Object.assign(pay.style, { fontWeight: '800' });
  top.append(name, pay);

  const bottom = document.createElement('div');
  Object.assign(bottom.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' });
  const count = document.createElement('span');
  count.textContent = `${leaves.length} tasks`;
  Object.assign(count.style, { fontSize: '13px', fontWeight: '700', color: TEXT_DIM });
  bottom.append(count, buildTreeGlyph(leaves));

  main.append(top, bottom);
  row.append(arrow, main);

  const setSelected = (selected: boolean): void => {
    row.style.background = selected ? SELECTION : 'transparent';
    row.style.color = selected ? SELECTION_TEXT : TEXT;
    arrow.style.opacity = selected ? '1' : '0';
    name.style.color = selected ? SELECTION_TEXT : TEXT;
    pay.style.color = selected ? SELECTION_TEXT : TEXT;
    count.style.color = selected ? SELECTION_TEXT : TEXT_DIM;
  };
  setSelected(false);

  row.addEventListener('pointerenter', () => setSelected(true));
  row.addEventListener('pointerleave', () => setSelected(false));
  row.addEventListener('click', () => onAccept(contract.id));

  return row;
}

/** Diagrama structurii sub-task-urilor: un punct per frunza, cate o linie pentru fiecare dependenta reala. */
function buildTreeGlyph(leaves: readonly TaskNode[]): SVGSVGElement {
  const spacing = 14;
  const radius = 3;
  const width = Math.max(spacing * leaves.length, spacing);
  const height = 14;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  Object.assign(svg.style, { flexShrink: '0' });

  const indexOf = new Map(leaves.map((leaf, i) => [leaf.id, i] as const));
  const cx = (i: number): number => spacing * i + spacing / 2;
  const cy = height / 2;

  for (const leaf of leaves) {
    const i = indexOf.get(leaf.id);
    if (i === undefined) {
      continue;
    }
    for (const depId of leaf.dependsOn) {
      const j = indexOf.get(depId);
      if (j === undefined) {
        continue;
      }
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(cx(j)));
      line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(cx(i)));
      line.setAttribute('y2', String(cy));
      line.setAttribute('stroke', TEXT_DIM);
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
  }

  leaves.forEach((_leaf, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx(i)));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', TEXT_DIM);
    svg.appendChild(circle);
  });

  return svg;
}

interface FixedEdges {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  height?: string;
  width?: string;
}

function styleFixed(el: HTMLElement, edges: FixedEdges): void {
  el.style.position = 'fixed';
  if (edges.top !== undefined) el.style.top = edges.top;
  if (edges.left !== undefined) el.style.left = edges.left;
  if (edges.right !== undefined) el.style.right = edges.right;
  if (edges.bottom !== undefined) el.style.bottom = edges.bottom;
  if (edges.height !== undefined) el.style.height = edges.height;
  if (edges.width !== undefined) el.style.width = edges.width;
}
