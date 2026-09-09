# fanout

A 2D simulation game where you run a company of AI agents — and learn, by playing, why orchestration is never free.

> **Status: early development.** The simulation engine works and is calibrated. The rendering is coloured rectangles. There is no art yet, and no playable link yet.

## What it is

Contracts arrive from clients around the world. Each one breaks down into a tree of sub-tasks. You decide who picks up what, and how many agents you keep on the payroll.

Every agent costs money for as long as you keep it. Two agents finish faster than one — but a chain of dependent tasks doesn't get any faster with six, and every agent you keep without work is pure loss.

That is the whole game:

> **The shape of the work decides how much you can parallelise; the capacity you hold and cannot use costs you.**

Everything else exists to serve that one lesson.

## Why it exists

Multi-agent orchestration is invisible. If you have never built such a system, there is no way to see why delegation costs, why two agents that don't talk to each other duplicate work, or why one agent trying to do everything alone is slower than a team — while a team that is too large is more expensive than the speed it buys.

Articles explain this in prose. Prose does not build intuition. Intuition comes from paying, with your own resources, the price of a bad decision.

## Two deliverables

| Deliverable | What it is |
|---|---|
| **The game** | A simulator playable in the browser. The visual demonstration. |
| **`skills/orchestration-protocol/SKILL.md`** | The orchestration protocol in text — roles, handoff format, rules for when to decompose a task and when not to. The skeleton you build your own factory from. |

Both share the same conceptual model, deliberately. The game shows it; the skill executes it.

## The core mechanic

Work is a tree. A contract's shape decides how many agents can usefully touch it:

| Shape | Optimal agents |
|---|---|
| Chain — each step waits for the previous one | **1** |
| Mixed — two parallel branches, then an integration | **2** |
| Fan-out — independent branches | **3–4** |

One agent per sub-task: parallelism comes from the width of the tree, not from crowding people onto the same work. On top of that, coordination overhead grows with the number of agents working on the same contract, so effective capacity grows sub-linearly while cost grows linearly.

These numbers are not hand-written. They come out of a headless calibration harness (`npm run calibrate`) that runs the simulation thousands of times.

## Architecture

The one rule everything else follows: **the simulation does not know a game exists.**

```
src/sim/       deterministic engine — pure TypeScript, no Phaser, no DOM
src/game/      Phaser rendering
src/ui/        HUD
src/data/      content and balance numbers
scripts/       headless calibration harness
tests/         engine and layout tests
```

`src/sim/` never imports from `src/game/`. Randomness goes through a seeded generator, so the same seed and the same sequence of commands replay an identical run. That is what makes the balance testable without a browser.

## Stack

TypeScript · Phaser 4 · Vite · Vitest · static deploy.

No backend. No LLM calls. No API keys. It runs from a link.

## Commands

```
npm install
npm run dev        local dev server
npm run build      static bundle
npm run test       engine and layout tests
npm run typecheck  strict TypeScript
npm run calibrate  headless balance calibration
```

## Licence

MIT — see [LICENSE](LICENSE).

Art assets, once added, will be CC0. Each one's source and licence is recorded in [`assets/README.md`](assets/README.md) **before** it is used.
