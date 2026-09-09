// coordinationLossPercent (src/sim/coordination.ts) e folosit de ContractCard
// pentru afisare, dar tests/sim/coordination.test.ts acopera doar
// coordinationMultiplier. Adaugam aici testul pentru functia de afisare, fara
// sa atingem fisierul existent.

import { describe, expect, it } from 'vitest';
import { coordinationLossPercent } from '../../src/sim';

describe('coordinationLossPercent', () => {
  it('un singur agent nu pierde nimic in coordonare: 0%', () => {
    expect(coordinationLossPercent(1)).toBe(0);
    expect(coordinationLossPercent(0)).toBe(0);
  });

  it('pierderea creste monoton cu numarul de agenti', () => {
    const valori = [1, 2, 3, 4, 5, 6].map(coordinationLossPercent);
    for (let i = 1; i < valori.length; i++) {
      expect(valori[i]!).toBeGreaterThanOrEqual(valori[i - 1]!);
    }
    // si strict undeva, altfel testul de mai sus ar trece si daca ramane constanta
    expect(valori[valori.length - 1]!).toBeGreaterThan(valori[0]!);
  });

  it('returneaza intotdeauna un numar intreg', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 12]) {
      const val = coordinationLossPercent(n);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
