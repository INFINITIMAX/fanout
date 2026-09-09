import { describe, expect, it } from 'vitest';
import { coordinationMultiplier } from '../../src/sim/coordination';
import { assignAgent } from '../../src/sim/commands';
import { isWorkable, leavesOfContract } from '../../src/sim/tasks';
import { labState, runContract } from './helpers';

describe('costul coordonarii', () => {
  it('un singur agent nu pierde nimic', () => {
    expect(coordinationMultiplier(1)).toBe(1);
    expect(coordinationMultiplier(0)).toBe(1);
  });

  it('pierderea creste cu numarul de agenti', () => {
    const valori = [1, 2, 3, 4, 5, 6].map(coordinationMultiplier);
    for (let i = 1; i < valori.length; i++) {
      expect(valori[i]!).toBeLessThan(valori[i - 1]!);
    }
  });

  it('capacitatea creste sub-liniar: 2 agenti fac mai putin decat dublu', () => {
    expect(2 * coordinationMultiplier(2)).toBeGreaterThan(1);
    expect(2 * coordinationMultiplier(2)).toBeLessThan(2);
  });
});

describe('un agent per sub-task', () => {
  it('al doilea agent nu poate prelua un task deja ocupat', () => {
    const state = labState('berlin-logistics', 6);
    const contract = state.contracts[0]!;
    const task = leavesOfContract(state, contract.id).find(isWorkable)!;

    const primul = state.agents.find((a) => assignAgent(state, a.id, task.id));
    expect(primul).toBeDefined();

    const altul = state.agents.find((a) => a.id !== primul!.id && a.assignedTaskId === null)!;
    expect(assignAgent(state, altul.id, task.id)).toBe(false);
  });
});

/**
 * TESTUL-CHEIE al proiectului (plan.md, E1).
 *
 * Intrebarea "cati agenti pun aici?" trebuie sa primeasca alt raspuns in functie
 * de forma contractului. Daca raspunsul ar fi mereu acelasi, jucatorul l-ar
 * invata o data si restul jocului ar fi repetitiv.
 */
describe('lectia centrala: raspunsul depinde de forma contractului', () => {
  const evantai = [1, 2, 3, 4].map((n) => ({ n, ...runContract('berlin-logistics', n) }));
  const lant = [1, 2, 3].map((n) => ({ n, ...runContract('nordic-bank', n) }));

  it('pe un contract in LANT, agentii suplimentari nu schimba absolut nimic', () => {
    const timpi = new Set(lant.map((r) => r.ticks));
    expect(timpi.size).toBe(1);
  });

  it('pe un contract EVANTAI, agentii suplimentari scad timpul', () => {
    expect(evantai[3]!.ticks).toBeLessThan(evantai[0]!.ticks);
    for (let i = 1; i < evantai.length; i++) {
      expect(evantai[i]!.ticks).toBeLessThanOrEqual(evantai[i - 1]!.ticks);
    }
  });

  it('optimul difera intre forme: lant = 1, evantai > 2', () => {
    const optim = (r: typeof evantai) => {
      const max = Math.max(...r.map((x) => x.profit));
      return r.find((x) => x.profit === max)!.n;
    };
    expect(optim(lant)).toBe(1);
    expect(optim(evantai)).toBeGreaterThan(2);
  });

  it('peste latimea arborelui, agentii in plus nu mai aduc nimic', () => {
    // Berlin are 4 ramuri: al 5-lea si al 6-lea agent nu au unde sa lucreze.
    const patru = runContract('berlin-logistics', 4);
    const sase = runContract('berlin-logistics', 6);
    expect(sase.ticks).toBe(patru.ticks);
  });
});

/**
 * Unde traieste acum pedeapsa pentru "prea multi agenti": nu in cati pui pe un
 * contract, ci in cati tii in firma. Un agent inactiv tot costa.
 */
describe('marimea firmei', () => {
  it('doi agenti in plus, care nu au ce lucra, scad profitul', () => {
    const firmaMica = runContract('berlin-logistics', 4, 4);
    const firmaMare = runContract('berlin-logistics', 4, 6);

    expect(firmaMare.ticks).toBe(firmaMica.ticks);
    expect(firmaMare.profit).toBeLessThan(firmaMica.profit);
  });
});
