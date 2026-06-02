import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      reporters: [
        'default',
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ],
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,vue}'],
        exclude: [
          '**/*.d.ts',
          '**/node_modules/**',
          '**/dist/**',
          '**/coverage/**',
          'src/**/*.spec.ts',
          'src/**/*.test.ts',
          'src/test/**',
          'src/main.ts',
          'src/plugins/**',
          'src/router/**',
          'src/types/**',
          'src/i18n/locales/**',
          // Orchestrator views: pure wiring of well-tested composables and
          // child components. Real coverage for these belongs to E2E, not unit.
          'src/views/XRoadView.vue',
          'src/components/form/XRoadRequestForm.vue',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  })
);
