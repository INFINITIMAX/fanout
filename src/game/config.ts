// Configurarea Phaser. Singurul fisier din src/game/ care importa Phaser
// pentru constante - restul layout-ului sta in layout.ts, ca sa ramana testabil.

import * as Phaser from 'phaser';
import { CANVAS_PARENT_ID, COLORS, LAYOUT } from './layout';

export { CANVAS_PARENT_ID } from './layout';

/** Config Phaser fara scena - main.ts adauga FactoryScene, ca sa evite un import circular. */
export const BASE_GAME_CONFIG: Omit<Phaser.Types.Core.GameConfig, 'scene'> = {
  type: Phaser.AUTO,
  parent: CANVAS_PARENT_ID,
  width: LAYOUT.SCENE_WIDTH,
  height: LAYOUT.SCENE_HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
};
