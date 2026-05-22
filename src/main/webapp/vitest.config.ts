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
          'src/**/*.d.ts',
          'src/**/*.spec.ts',
          'src/**/*.test.ts',
          'src/test/**',
          'src/main.ts',
          'src/plugins/**',
          'src/router/**',
        ],
      },
    },
  })
);
