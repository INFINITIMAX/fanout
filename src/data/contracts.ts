// Sabloane de contracte.
//
// Formele arborelui sunt cele care fac jocul interesant: raspunsul la intrebarea
// "cati agenti pun aici?" trebuie sa DIFERE de la un contract la altul.
//
//   evantai  - ramuri independente, suporta paralelizare
//   lant     - fiecare pas asteapta pasul anterior, al doilea agent nu ajuta
//   mixt     - doua ramuri paralele, apoi o integrare care le asteapta pe ambele
//
// Daca toate contractele ar avea aceeasi forma, jucatorul ar invata un singur
// numar si s-ar plictisi.

import type { SkillId } from '../sim/types';

export interface TaskTemplate {
  label: string;
  skill: SkillId;
  minLevel: number;
  effortHours: number;
  /** Indici (in lista `tasks`) ai task-urilor care trebuie terminate inainte. */
  after?: readonly number[];
}

export interface ContractTemplate {
  key: string;
  clientName: string;
  shape: 'evantai' | 'lant' | 'mixt';
  payout: number;
  tasks: readonly TaskTemplate[];
}

export const CONTRACT_TEMPLATES: readonly ContractTemplate[] = [
  {
    key: 'tokyo-shop',
    clientName: 'Tokyo Systems',
    shape: 'evantai',
    payout: 2600,
    tasks: [
      { label: 'Database schema', skill: 'databases', minLevel: 2, effortHours: 6 },
      { label: 'Orders API', skill: 'backend', minLevel: 2, effortHours: 7 },
      { label: 'Checkout UI', skill: 'frontend', minLevel: 1, effortHours: 5 },
    ],
  },
  {
    key: 'nordic-bank',
    clientName: 'Nordic Bank',
    shape: 'lant',
    payout: 2200,
    tasks: [
      { label: 'Audit of existing schema', skill: 'databases', minLevel: 3, effortHours: 5 },
      { label: 'Data migration', skill: 'databases', minLevel: 2, effortHours: 6, after: [0] },
      { label: 'Verification report', skill: 'backend', minLevel: 1, effortHours: 4, after: [1] },
    ],
  },
  {
    key: 'lisboa-media',
    clientName: 'Lisboa Media',
    shape: 'mixt',
    payout: 3100,
    tasks: [
      { label: 'Ingestion pipeline', skill: 'backend', minLevel: 2, effortHours: 6 },
      { label: 'Recommendation model', skill: 'ai_integration', minLevel: 3, effortHours: 8 },
      { label: 'Product integration', skill: 'frontend', minLevel: 2, effortHours: 5, after: [0, 1] },
    ],
  },
  {
    key: 'berlin-logistics',
    clientName: 'Berlin Logistics',
    shape: 'evantai',
    payout: 3400,
    tasks: [
      { label: 'Routing service', skill: 'backend', minLevel: 3, effortHours: 8 },
      { label: 'Tracking dashboard', skill: 'frontend', minLevel: 2, effortHours: 6 },
      { label: 'Geographic indexing', skill: 'databases', minLevel: 3, effortHours: 7 },
      { label: 'Delay estimation', skill: 'ai_integration', minLevel: 2, effortHours: 6 },
    ],
  },
  {
    key: 'sao-paulo-retail',
    clientName: 'Sao Paulo Retail',
    shape: 'lant',
    payout: 1800,
    tasks: [
      { label: 'Data cleaning', skill: 'databases', minLevel: 1, effortHours: 4 },
      { label: 'Product classifier', skill: 'ai_integration', minLevel: 2, effortHours: 6, after: [0] },
    ],
  },
  {
    key: 'oslo-health',
    clientName: 'Oslo Health',
    shape: 'mixt',
    payout: 2900,
    tasks: [
      { label: 'Anonymization', skill: 'databases', minLevel: 3, effortHours: 6 },
      { label: 'Query service', skill: 'backend', minLevel: 2, effortHours: 5 },
      { label: 'Triage assistant', skill: 'ai_integration', minLevel: 3, effortHours: 7, after: [0, 1] },
    ],
  },
];
