/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    // General rules - turned off for production build
    'no-console': 'off',
    'prefer-const': 'off',
    'no-var': 'error',
    'object-shorthand': 'off',
    'prefer-template': 'off',

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',

    // Next.js specific
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-page-custom-font': 'off',

    // Prevent server-side imports - disabled for build
    'no-restricted-imports': 'off',
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
