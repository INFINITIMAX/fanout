// Helpere de desen impartite intre AgentSprite si ContractCard: panouri
// rotunjite cu umbra si bare de progres in stil HP (track inchis + umplere
// colorata, cu text scris deasupra). Singurul loc care stie sa deseneze
// aceste forme - restul entitatilor doar le pozitioneaza si le actualizeaza.

import * as Phaser from 'phaser';
import { COLORS, FONT, RADIUS, SHADOW, cssColor } from './layout';

export interface PanelOptions {
  readonly radius?: number;
  readonly bgColor?: number;
  readonly bgAlpha?: number;
  readonly borderColor?: number;
  readonly borderAlpha?: number;
  readonly shadow?: boolean;
}

/** (Re)deseneaza un panou rotunjit cu umbra si contur pe un Graphics existent, cu (0,0) = colt stanga-sus. */
export function paintPanel(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  options: PanelOptions = {},
): void {
  const radius = options.radius ?? RADIUS.PANEL;
  g.clear();
  if (options.shadow !== false) {
    g.fillStyle(COLORS.PANEL_SHADOW, COLORS.PANEL_SHADOW_ALPHA);
    g.fillRoundedRect(SHADOW.OFFSET_X, SHADOW.OFFSET_Y, width, height, radius);
  }
  g.fillStyle(options.bgColor ?? COLORS.PANEL_BG, options.bgAlpha ?? COLORS.PANEL_BG_ALPHA);
  g.fillRoundedRect(0, 0, width, height, radius);
  if ((options.borderAlpha ?? COLORS.PANEL_BORDER_ALPHA) > 0) {
    g.lineStyle(1, options.borderColor ?? COLORS.PANEL_BORDER, options.borderAlpha ?? COLORS.PANEL_BORDER_ALPHA);
    g.strokeRoundedRect(0, 0, width, height, radius);
  }
}

/** Creeaza un Graphics nou si deseneaza panoul pe el. */
export function drawPanel(
  scene: Phaser.Scene,
  width: number,
  height: number,
  options: PanelOptions = {},
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  paintPanel(g, width, height, options);
  return g;
}

/** (Re)deseneaza o bara stil HP: track inchis + umplere colorata, colturi rotunjite (pill). */
export function paintBar(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  ratio: number,
  fillColor: number,
): void {
  const radius = height / 2;
  g.clear();
  g.fillStyle(COLORS.BAR_TRACK, COLORS.BAR_TRACK_ALPHA);
  g.fillRoundedRect(0, 0, width, height, radius);
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped > 0) {
    g.fillStyle(fillColor, 1);
    // Latimea minima = inaltimea, ca umplerea sa ramana o pastila vizibila si la ratio mic.
    g.fillRoundedRect(0, 0, Math.max(width * clamped, height), height, radius);
  }
}

/** Stilul de text Phaser corespunzator unui variant din FONT, cu o culoare data. */
export function textStyle(
  variant: { readonly SIZE: number; readonly WEIGHT: string; readonly LETTER_SPACING?: number },
  color: number,
): Phaser.Types.GameObjects.Text.TextStyle {
  const base: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT.FAMILY,
    fontSize: `${variant.SIZE}px`,
    fontStyle: variant.WEIGHT,
    color: cssColor(color),
  };
  // exactOptionalPropertyTypes: nu putem atribui `undefined` direct unei proprietati optionale.
  return variant.LETTER_SPACING === undefined ? base : { ...base, letterSpacing: variant.LETTER_SPACING };
}
