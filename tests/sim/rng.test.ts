import { describe, expect, it } from 'vitest';
import { createRng, nextFloat, nextInt } from '../../src/sim/rng';

describe('rng', () => {
  it('acelasi seed produce aceeasi secventa', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seriaA = Array.from({ length: 50 }, () => nextFloat(a));
    const seriaB = Array.from({ length: 50 }, () => nextFloat(b));
    expect(seriaA).toEqual(seriaB);
  });

  it('seed-uri diferite produc secvente diferite', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(nextFloat(a)).not.toBe(nextFloat(b));
  });

  it('valorile stau in [0, 1)', () => {
    const rng = createRng(99);
    for (let i = 0; i < 500; i++) {
      const v = nextFloat(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('nextInt respecta intervalul inchis', () => {
    const rng = createRng(7);
    const vazute = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = nextInt(rng, 3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      vazute.add(v);
    }
    expect(vazute.size).toBe(4);
  });
});
