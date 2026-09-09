// Bootstrap. Declara @font-face-urile si asteapta fontul inainte sa porneasca
// Phaser: Phaser deseneaza textul pe canvas, iar daca fontul nu e gata la
// create(), textul ramane cu fontul de rezerva - canvasul nu se redeseneaza
// singur cand fontul soseste ulterior. Apoi creeaza elementul in care Phaser
// ataseaza canvasul si porneste jocul. Restul HUD-ului (bara de jos, panoul
// de oferte, overlay-ul de faliment) e construit de FactoryScene, prin
// src/ui/hud.ts, dupa create().

import * as Phaser from 'phaser';
import { BASE_GAME_CONFIG, CANVAS_PARENT_ID } from './game/config';
import { FactoryScene } from './game/scenes/FactoryScene';

// Importate ca URL-uri, ca sa treaca prin bundler-ul Vite (woff2 e in lista
// lui de extensii de asset by default) - nu cai relative brute, care s-ar rupe la build.
import fontRegular from '../assets/fonts/mplus-rounded-1c-400-latin.woff2';
import fontRegularExt from '../assets/fonts/mplus-rounded-1c-400-latin-ext.woff2';
import fontBold from '../assets/fonts/mplus-rounded-1c-700-latin.woff2';
import fontBoldExt from '../assets/fonts/mplus-rounded-1c-700-latin-ext.woff2';
import fontExtraBold from '../assets/fonts/mplus-rounded-1c-800-latin.woff2';
import fontExtraBoldExt from '../assets/fonts/mplus-rounded-1c-800-latin-ext.woff2';

// Intervalele unicode standard latin / latin-ext folosite de Google Fonts pentru
// aceasta familie - textul din joc e in engleza (latin), latin-ext e cablat
// pentru completitudine dar nu e exercitat de continutul actual.
const UNICODE_LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const UNICODE_LATIN_EXT =
  'U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF';

function fontFace(weight: number, url: string, unicodeRange: string): string {
  return `
    @font-face {
      font-family: 'M PLUS Rounded 1c';
      font-style: normal;
      font-weight: ${weight};
      font-display: block;
      src: url(${url}) format('woff2');
      unicode-range: ${unicodeRange};
    }
  `;
}

const fontFaceCss = [
  fontFace(400, fontRegular, UNICODE_LATIN),
  fontFace(400, fontRegularExt, UNICODE_LATIN_EXT),
  fontFace(700, fontBold, UNICODE_LATIN),
  fontFace(700, fontBoldExt, UNICODE_LATIN_EXT),
  fontFace(800, fontExtraBold, UNICODE_LATIN),
  fontFace(800, fontExtraBoldExt, UNICODE_LATIN_EXT),
].join('\n');

const styleEl = document.createElement('style');
styleEl.textContent = fontFaceCss;
document.head.appendChild(styleEl);

async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (app) {
    const canvasHolder = document.createElement('div');
    canvasHolder.id = CANVAS_PARENT_ID;
    app.appendChild(canvasHolder);
  }

  await Promise.all([
    document.fonts.load('400 16px "M PLUS Rounded 1c"'),
    document.fonts.load('700 16px "M PLUS Rounded 1c"'),
    document.fonts.load('800 16px "M PLUS Rounded 1c"'),
  ]);

  new Phaser.Game({ ...BASE_GAME_CONFIG, scene: [FactoryScene] });
}

void bootstrap();
