import { defineConfig, loadEnv } from 'vite';

// Build static, servibil de pe GitHub Pages.
// `base` vine din VITE_BASE_PATH (vezi .env.example), implicit '/'.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: env['VITE_BASE_PATH'] ?? '/',
    build: {
      outDir: 'dist',
      target: 'es2022',
      sourcemap: mode !== 'production',
    },
    server: {
      open: true,
    },
  };
});
