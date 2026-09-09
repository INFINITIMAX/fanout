import { describe, expect, it } from 'vitest';
import { assignAgent } from '../../src/sim/commands';
import { getTask, leavesOfContract } from '../../src/sim/tasks';
import { advance } from '../../src/sim/tick';
import { labState } from './helpers';

describe('arborele de task-uri', () => {
  it('un task cu dependente ramane blocat pana se termina ele', () => {
    const state = labState('nordic-bank', 6); // forma "lant"
    const contract = state.contracts[0];
    expect(contract).toBeDefined();

    const frunze = leavesOfContract(state, contract!.id);
    const primul = frunze.find((t) => t.dependsOn.length === 0);
    const alDoilea = frunze.find((t) => t.dependsOn.length > 0);

    expect(primul?.status).toBe('available');
    expect(alDoilea?.status).toBe('locked');
  });

  it('un agent sub nivelul minim nu poate prelua task-ul', () => {
    const state = labState('nordic-bank', 6);
    const contract = state.contracts[0]!;
    // "Audit al schemei existente" cere databases 3
    const audit = leavesOfContract(state, contract.id).find((t) => t.minLevel === 3);
    expect(audit).toBeDefined();

    // FARO are databases 2 - insuficient
    const faro = state.agents.find((a) => a.name === 'FARO')!;
    expect(assignAgent(state, faro.id, audit!.id)).toBe(false);

    // CERES are databases 3 - acceptat
    const ceres = state.agents.find((a) => a.name === 'CERES')!;
    expect(assignAgent(state, ceres.id, audit!.id)).toBe(true);
  });

  it('terminarea unui task deblocheaza dependentul lui', () => {
    const state = labState('nordic-bank', 6);
    const contract = state.contracts[0]!;
    const frunze = leavesOfContract(state, contract.id);
    const primul = frunze.find((t) => t.dependsOn.length === 0)!;
    const urmator = frunze.find((t) => t.dependsOn.includes(primul.id))!;

    const ceres = state.agents.find((a) => a.name === 'CERES')!;
    assignAgent(state, ceres.id, primul.id);
    advance(state, 2000);

    expect(getTask(state, primul.id).status).toBe('done');
    expect(getTask(state, urmator.id).status).not.toBe('locked');
  });

  it('contractul se livreaza cand toate frunzele sunt gata', () => {
    const state = labState('sao-paulo-retail', 6);
    const contract = state.contracts[0]!;

    for (let i = 0; i < 6000 && state.stats.delivered === 0; i++) {
      for (const frunza of leavesOfContract(state, contract.id)) {
        if (frunza.status === 'available') {
          for (const agent of state.agents) {
            if (agent.assignedTaskId === null && assignAgent(state, agent.id, frunza.id)) {
              break;
            }
          }
        }
      }
      advance(state, 1);
    }

    expect(state.stats.delivered).toBe(1);
    expect(state.stats.revenue).toBe(1800);
  });
});
