import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../src/sim/state';
import { acceptOffer, offeredContracts } from '../../src/sim/commands';
import { advance, tick } from '../../src/sim/tick';

/**
 * Determinismul e fundatia intregului proiect: fara el nu poti nici depana un
 * bug de balans, nici rula calibrarea, nici reproduce o partida raportata.
 */
describe('determinism', () => {
  it('acelasi seed si aceleasi comenzi dau stari identice dupa 500 de tick-uri', () => {
    const ruleaza = () => {
      const state = createInitialState(2026);
      for (let i = 0; i < 500; i++) {
        for (const c of offeredContracts(state)) {
          acceptOffer(state, c.id);
        }
        tick(state);
      }
      return state;
    };

    expect(JSON.stringify(ruleaza())).toBe(JSON.stringify(ruleaza()));
  });

  it('seed-uri diferite dau partide diferite', () => {
    const a = createInitialState(1);
    const b = createInitialState(2);
    advance(a, 400);
    advance(b, 400);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('o firma fara niciun contract acceptat ajunge la faliment', () => {
    const state = createInitialState(5);
    advance(state, 20000);
    expect(state.bankrupt).toBe(true);
  });
});
