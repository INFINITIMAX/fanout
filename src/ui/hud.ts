// HUD: bani, rata de ardere, tick, controlul vitezei, contracte livrate si
// oferte cu buton de acceptare. DOM peste canvas (spec.md 2.2), randat doar
// cand FactoryScene apeleaza render() - dupa fiecare tick avansat, nu la
// fiecare frame.

import type { Contract, GameState } from '../sim';

/**
 * Acelasi stack de fonturi ca `FONT.FAMILY` din src/game/layout.ts. Nu poate fi
 * importat de acolo (src/ui/ importa exclusiv din src/sim/index.ts si src/data/),
 * asa ca valoarea e duplicata literal - se tine identica manual.
 */
const FONT_FAMILY = `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`;

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

const SPEEDS: readonly Speed[] = [0, 1, 2, 4];

export function createHud(callbacks: HudCallbacks): Hud {
  document.body.style.fontFamily = FONT_FAMILY;

  const topbar = document.createElement('div');
  styleFixed(topbar, { top: '0', left: '0', right: '0', height: '48px' });
  Object.assign(topbar.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '0 16px',
    background: '#1b1e27',
    borderBottom: '1px solid #2a2d38',
    fontSize: '13px',
    zIndex: '10',
  });
  document.body.appendChild(topbar);

  const moneyEl = document.createElement('span');
  const burnEl = document.createElement('span');
  const tickEl = document.createElement('span');
  const deliveredEl = document.createElement('span');
  topbar.append(moneyEl, burnEl, tickEl, deliveredEl);

  const speedRow = document.createElement('div');
  Object.assign(speedRow.style, { display: 'flex', gap: '4px', marginLeft: 'auto' });
  topbar.appendChild(speedRow);

  const speedButtons = new Map<Speed, HTMLButtonElement>();
  for (const speed of SPEEDS) {
    const btn = document.createElement('button');
    btn.textContent = speed === 0 ? 'Pause' : `x${speed}`;
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      callbacks.onSetSpeed(speed);
      highlightSpeed(speed);
    });
    speedButtons.set(speed, btn);
    speedRow.appendChild(btn);
  }

  function highlightSpeed(active: Speed): void {
    for (const [speed, btn] of speedButtons) {
      Object.assign(btn.style, {
        background: speed === active ? '#4c8dff' : '#2a2d38',
        color: speed === active ? '#0c0e12' : '#e6e8ee',
        border: '1px solid #3a3f4b',
        borderRadius: '4px',
        padding: '4px 8px',
      });
    }
  }
  highlightSpeed(1);

  const offersPanel = document.createElement('div');
  styleFixed(offersPanel, { top: '48px', right: '0', bottom: '0', width: '260px' });
  Object.assign(offersPanel.style, {
    background: '#1b1e27',
    borderLeft: '1px solid #2a2d38',
    padding: '12px',
    overflowY: 'auto',
    zIndex: '10',
  });
  document.body.appendChild(offersPanel);

  const offersTitle = document.createElement('div');
  offersTitle.textContent = 'Offers';
  Object.assign(offersTitle.style, { fontSize: '13px', marginBottom: '8px', opacity: '0.7' });
  offersPanel.appendChild(offersTitle);

  const offersList = document.createElement('div');
  Object.assign(offersList.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
  offersPanel.appendChild(offersList);

  const bankruptOverlay = document.createElement('div');
  styleFixed(bankruptOverlay, { top: '0', left: '0', right: '0', bottom: '0' });
  Object.assign(bankruptOverlay.style, {
    background: 'rgba(10, 11, 15, 0.9)',
    display: 'none',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: '20',
  });
  document.body.appendChild(bankruptOverlay);

  const bankruptTitle = document.createElement('div');
  bankruptTitle.textContent = 'BANKRUPT';
  Object.assign(bankruptTitle.style, { fontSize: '28px', fontWeight: 'bold', color: '#d94c4c' });

  const bankruptStats = document.createElement('div');
  Object.assign(bankruptStats.style, { fontSize: '15px', textAlign: 'center' });

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'New company';
  Object.assign(restartBtn.style, { cursor: 'pointer', padding: '8px 16px', fontSize: '15px' });
  restartBtn.addEventListener('click', () => callbacks.onRestart());

  bankruptOverlay.append(bankruptTitle, bankruptStats, restartBtn);

  return {
    render(data) {
      const { state, burnRatePerHour, offered } = data;
      moneyEl.textContent = `Money: ${Math.round(state.money)}$`;
      burnEl.textContent = `Burn rate: ${Math.round(burnRatePerHour)}$/h`;
      tickEl.textContent = `Tick: ${state.tick}`;
      deliveredEl.textContent = `Delivered: ${state.stats.delivered}`;

      offersList.innerHTML = '';
      for (const contract of offered) {
        offersList.appendChild(buildOfferRow(contract, callbacks.onAcceptOffer));
      }
    },
    showBankrupt(stats) {
      bankruptStats.textContent =
        `Contracts delivered: ${stats.delivered} - Revenue: ${Math.round(stats.revenue)}$ - Spent: ${Math.round(stats.spent)}$`;
      bankruptOverlay.style.display = 'flex';
    },
    hideBankrupt() {
      bankruptOverlay.style.display = 'none';
    },
  };
}

function buildOfferRow(contract: Contract, onAccept: (contractId: string) => void): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, {
    background: '#20232e',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    padding: '8px',
    fontSize: '13px',
  });

  const label = document.createElement('div');
  label.textContent = `${contract.clientName} - ${contract.payout}$`;
  label.style.marginBottom = '6px';

  const acceptBtn = document.createElement('button');
  acceptBtn.textContent = 'Accept';
  acceptBtn.style.cursor = 'pointer';
  acceptBtn.addEventListener('click', () => onAccept(contract.id));

  row.append(label, acceptBtn);
  return row;
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
