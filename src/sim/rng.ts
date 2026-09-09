// Generator pseudo-aleator seeded (mulberry32).
//
// De ce nu Math.random(): motorul trebuie sa fie reproductibil. Acelasi seed si
// aceeasi secventa de comenzi = exact aceeasi partida. Fara asta nu poti nici
// testa determinismul, nici calibra balansul rulind mii de partide.
//
// Starea generatorului e un simplu numar, deci se salveaza in localStorage
// odata cu restul starii de joc.

export interface RngState {
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

/** Returneaza un float in [0, 1) si avanseaza starea. */
export function nextFloat(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Intreg in intervalul inchis [min, max]. */
export function nextInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}

/** Alege un element dintr-o lista nevida. */
export function pick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick: lista goala');
  }
  const item = items[nextInt(rng, 0, items.length - 1)];
  // noUncheckedIndexedAccess: indexul e garantat in interval, dar TS nu stie.
  return item as T;
}
