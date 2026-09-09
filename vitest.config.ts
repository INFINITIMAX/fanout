import { defineConfig } from 'vitest/config';

// Testele acopera motorul de simulare (src/sim), care e TypeScript pur.
// Nu au nevoie de browser - de aceea mediul e 'node' si ruleaza in milisecunde.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
