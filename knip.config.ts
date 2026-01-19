import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['**/*.test.ts', '**/*.test.tsx'],
  ignoreDependencies: [
    // Used via PostCSS and CSS imports
    'tailwindcss',
    'tw-animate-css',
    // Peer dependency of @tailwindcss/postcss
    'postcss',
    // Optional vitest coverage (not installed, but knip detects as potential)
    '@vitest/coverage-v8',
  ],
};

export default config;
