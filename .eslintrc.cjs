/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Next.js specific
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'warn',

    // Prevent server-side imports in tests and shared utilities
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'next/server',
          message: 'Use only inside route handlers. For tests, use @shared utilities.',
        },
        {
          name: 'next-auth',
          message: 'Server-only; do not import in tests or shared utilities.',
        },
        {
          name: 'next/headers',
          message: 'Server-only; do not import in tests or shared utilities.',
        },
      ],
      patterns: [
        {
          group: ['**/src/app/api/**'],
          message: 'Do not import route handlers. Extract utilities to @shared if needed.',
        },
      ],
    }],
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts',
    'next-env.d.ts',
  ],
};
