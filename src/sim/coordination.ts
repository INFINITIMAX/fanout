// Inima jocului.
//
// Cu cat mai multi agenti lucreaza simultan pe acelasi contract, cu atat mai
// mult timp se duce in coordonare intre ei in loc de munca efectiva.
//
// capacitateEfectiva = capacitateBruta / (1 + k * (n - 1))
//
// Consecinta: capacitatea creste SUB-liniar cu numarul de agenti, in timp ce
// costul creste liniar. De aici iese intreaga dilema a jocului - si a
// orchestrarii reale: al doilea agent aproape isi merita banii, al saselea
// aproape sigur nu.
//
// Un singur agent nu se coordoneaza cu nimeni: multiplicatorul e exact 1.

import { BALANCE } from '../data/balance';

/**
 * Fractiunea din capacitatea bruta care ajunge munca reala, pentru n agenti
 * care lucreaza in acelasi timp la acelasi contract.
 */
export function coordinationMultiplier(activeAgents: number): number {
  if (activeAgents <= 1) {
    return 1;
  }
  return 1 / (1 + BALANCE.COORDINATION_K * (activeAgents - 1));
}

/**
 * Cat la suta din efortul agentilor se pierde in coordonare. Doar pentru
 * afisare in interfata - jucatorul trebuie sa VADA pretul aglomerarii.
 */
export function coordinationLossPercent(activeAgents: number): number {
  return Math.round((1 - coordinationMultiplier(activeAgents)) * 100);
}
