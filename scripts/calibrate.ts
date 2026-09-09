// Harness de calibrare (E3 din plan.md).
//
// Ruleaza simularea headless, fara browser, si tipareste pentru fiecare forma
// de contract cum se schimba timpul, costul si profitul in functie de numarul
// de agenti pusi pe el.
//
// Rolul lui: sa NU ghicim numerele din src/data/balance.ts. Daca optimul iese
// mereu la aceeasi valoare, indiferent de forma contractului, jocul nu are
// dilema si balansul trebuie schimbat.
//
//   npm run calibrate

import { BALANCE } from '../src/data/balance';
import { CONTRACT_TEMPLATES } from '../src/data/contracts';
import { runContract } from '../tests/sim/helpers';

const AGENTI = [1, 2, 3, 4, 5, 6];

function bara(valoare: number, maxim: number, latime = 22): string {
  if (maxim <= 0) {
    return '';
  }
  const n = Math.max(0, Math.round((valoare / maxim) * latime));
  return '#'.repeat(n);
}

console.log('\n=== CALIBRARE fabricaai ===');
console.log(`k (coordonare) = ${BALANCE.COORDINATION_K}`);
console.log(`cost/ora = ${BALANCE.AGENT_COST_PER_HOUR} + ${BALANCE.AGENT_COST_PER_SKILL_LEVEL_PER_HOUR}/nivel`);
console.log(`factor inactivitate = ${BALANCE.IDLE_COST_FACTOR}`);
console.log(`bani de start = ${BALANCE.STARTING_MONEY}\n`);

const optimePeForma = new Map<string, number[]>();

for (const template of CONTRACT_TEMPLATES) {
  const rezultate = AGENTI.map((n) => ({ n, ...runContract(template.key, n) }));
  const livrate = rezultate.filter((r) => r.delivered);
  const maxProfit = livrate.length > 0 ? Math.max(...livrate.map((r) => r.profit)) : 0;
  const optim = livrate.find((r) => r.profit === maxProfit)?.n ?? 0;

  console.log(`${template.clientName}  [${template.shape}]  plata ${template.payout}`);
  console.log('  agenti   tick-uri     cost    profit');
  for (const r of rezultate) {
    const stare = r.delivered ? '' : '  FALIMENT';
    const profit = r.delivered ? r.profit.toFixed(0).padStart(7) : '      -';
    const marcaj = r.delivered && r.n === optim ? '  <-- optim' : '';
    console.log(
      `  ${String(r.n).padStart(6)}  ${String(r.ticks).padStart(9)}  ${r.spent
        .toFixed(0)
        .padStart(7)}  ${profit}  ${bara(Math.max(0, r.profit), maxProfit)}${marcaj}${stare}`,
    );
  }
  console.log('');

  const lista = optimePeForma.get(template.shape) ?? [];
  lista.push(optim);
  optimePeForma.set(template.shape, lista);
}

console.log('=== Optim pe forma de contract ===');
for (const [forma, optime] of optimePeForma) {
  console.log(`  ${forma.padEnd(8)} -> ${optime.join(', ')}`);
}

const toate = [...optimePeForma.values()].flat();
const distincte = new Set(toate);
console.log('');
if (distincte.size === 1) {
  console.log(`ATENTIE: optimul e ${[...distincte][0]} peste tot. Jocul nu are dilema.`);
  console.log('Raspunsul "cati agenti?" trebuie sa depinda de contract, altfel se invata o singura data.');
} else {
  console.log(`OK: optimul variaza (${[...distincte].sort().join(', ')}) in functie de contract.`);
}
console.log('');

// --- A doua intrebare: cat de mare sa fie firma? ---
//
// Cu regula "un agent per sub-task", pedeapsa pentru exces nu mai e la nivel de
// contract (nu ai unde sa-i pui), ci la nivel de firma: agentii pe care ii tii
// si care n-au ce lucra costa in continuare.

console.log('=== Marimea firmei: acelasi contract, roster diferit ===');
for (const key of ['berlin-logistics', 'nordic-bank']) {
  console.log(`\n  ${key}`);
  console.log('  roster  agenti_folositi  tick-uri     cost   profit');
  for (const roster of [1, 2, 3, 4, 5, 6]) {
    const r = runContract(key, roster, roster);
    const stare = r.delivered ? '' : '  FALIMENT';
    console.log(
      `  ${String(roster).padStart(6)}  ${String(roster).padStart(15)}  ${String(r.ticks).padStart(8)}  ${r.spent
        .toFixed(0)
        .padStart(7)}  ${r.profit.toFixed(0).padStart(7)}${stare}`,
    );
  }
}
console.log('');
