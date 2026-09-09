// Toate numerele care decid daca jocul e interesant sau plictisitor.
// Traiesc intr-un singur loc, ca sa poata fi calibrate din scripts/calibrate.ts
// fara sa umbli prin logica.
//
// Valorile de aici sunt punctul de plecare, nu adevarul revelat. Se ajusteaza
// pe baza rezultatelor harness-ului de calibrare (E3 din plan.md).

export const BALANCE = {
  /** 1 tick = 1 minut in joc. */
  TICK_HOURS: 1 / 60,

  /** Cate tick-uri de simulare intra intr-o secunda reala, la viteza x1. */
  TICKS_PER_SECOND: 20,

  /** Coeficientul de coordonare din coordination.ts. Cel mai important numar din joc. */
  COORDINATION_K: 0.12,

  /** Bonus de viteza pentru fiecare nivel de skill peste minimul cerut de task. */
  SPEED_PER_LEVEL: 0.35,

  /** Cost orar de baza pentru un agent care lucreaza. */
  AGENT_COST_PER_HOUR: 26,

  /** Fiecare nivel de skill scumpeste agentul. In realitate: model mai capabil. */
  AGENT_COST_PER_SKILL_LEVEL_PER_HOUR: 5,

  /** Un agent inactiv costa mai putin, dar costa. */
  IDLE_COST_FACTOR: 0.3,

  /** Ore de munca dupa care agentul ofera un skill point. */
  HOURS_PER_SKILL_POINT: 24,

  STARTING_MONEY: 4000,

  /** Interval intre doua oferte de contract, in tick-uri. */
  OFFER_INTERVAL_TICKS: [70, 150] as const,

  /** Cat sta o oferta pe masa pana pleaca la alta firma. */
  OFFER_LIFETIME_TICKS: 300,

  /** Cate contracte pot fi active simultan. */
  MAX_ACTIVE_CONTRACTS: 3,
} as const;
