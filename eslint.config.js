import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Build output, test output and wrangler dev's temporary files.
    ignores: [
      'dist',
      'node_modules',
      'playwright-report',
      'test-results',
      'blob-report',
      '.wrangler',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
  },
  // The Worker runs on Cloudflare (web APIs); its unit tests in Node.
  {
    files: ['worker/**/*.ts'],
    languageOptions: { globals: { ...globals.serviceworker, ...globals.node } },
  },
  // Browser tests and their config run in Node.
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },
  // Keep last: turns off rules that conflict with Prettier.
  prettier,
);
