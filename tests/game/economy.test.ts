// burnRatePerHour (src/sim/economy.ts) e folosit de HUD dar nu avea niciun
// test in tests/sim/. Il acoperim aici pentru ca e consumat direct de
// src/ui/hud.ts.

import { describe, expect, it } from 'vitest';
import { burnRatePerHour } from '../../src/sim';
import { createInitialState } from '../../src/sim/state';

describe('burnRatePerHour', () => {
  it('un agent activ costa mai mult decat unul inactiv', () => {
    const state = createInitialState(1, 1);
    const agentId = state.agents[0]!.id;

    const rataActiva = burnRatePerHour(state, new Set([agentId]));
    const rataInactiva = burnRatePerHour(state, new Set());

    expect(rataActiva).toBeGreaterThan(rataInactiva);
  });

  it('rata creste cu numarul de agenti activi', () => {
    const state = createInitialState(1, 3);
    const [a, b, c] = state.agents.map((a) => a.id) as [string, string, string];

    const rataUnul = burnRatePerHour(state, new Set([a]));
    const rataToti = burnRatePerHour(state, new Set([a, b, c]));

    expect(rataToti).toBeGreaterThan(rataUnul);
  });

  it('un agent mai calificat costa mai mult decat unul cu skill-uri de baza', () => {
    const state = createInitialState(1, 2);
    const [slab, bun] = state.agents;
    slab!.skills = { frontend: 0, backend: 0, databases: 0, ai_integration: 0 };
    bun!.skills = { frontend: 5, backend: 5, databases: 5, ai_integration: 5 };

    const costSlab = burnRatePerHour(state, new Set([slab!.id]));
    // Izolam costul lui `bun` dezactivand pe `slab`, ca sa comparam direct.
    const totalCuBun = burnRatePerHour(
      { ...state, agents: [bun!] },
      new Set([bun!.id]),
    );

    expect(totalCuBun).toBeGreaterThan(costSlab);
  });
});
