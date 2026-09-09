// Bootstrap. Creeaza elementul in care Phaser ataseaza canvasul si porneste
// jocul. Restul HUD-ului (bara de sus, panoul de oferte, overlay-ul de
// faliment) e construit de FactoryScene, prin src/ui/hud.ts, dupa create().

import * as Phaser from 'phaser';
import { BASE_GAME_CONFIG, CANVAS_PARENT_ID } from './game/config';
import { FactoryScene } from './game/scenes/FactoryScene';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const canvasHolder = document.createElement('div');
  canvasHolder.id = CANVAS_PARENT_ID;
  app.appendChild(canvasHolder);
}

new Phaser.Game({ ...BASE_GAME_CONFIG, scene: [FactoryScene] });
