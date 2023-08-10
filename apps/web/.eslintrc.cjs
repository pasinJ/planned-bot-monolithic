module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  ignorePatterns: ['dist', '*.cjs', '*.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json', './cypress/tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:promise/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/no-confusing-void-expression': 'off',
  },
  overrides: [
    {
      files: ['src/**/*.ts?(x)', 'cypress/**/*.ts'],
    },
    {
      files: ['src/**/!(*.*test).ts?(x)'],
      settings: {
        'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
        'import/resolver': { typescript: { alwaysTryTypes: true } },
      },
      extends: [
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:fp-ts/recommended',
        'plugin:fp-ts/recommended-requiring-type-checking',
      ],
      plugins: ['import', 'react-refresh'],
      rules: {
        'import/no-cycle': 'error',
        'import/no-deprecated': 'error',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'fp-ts/no-lib-imports': 'off',
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    {
      files: ['src/**/!(*.*test).tsx'],
      extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],
      settings: { react: { version: 'detect' } },
    },
    {
      files: ['src/**/+(*.*test).tsx'],
      extends: ['plugin:testing-library/react', 'plugin:jest-dom/recommended'],
    },
    {
      files: ['src/**/+(*.*test).ts'],
      extends: ['plugin:jest/recommended', 'plugin:jest/style'],
    },
    {
      files: ['cypress/e2e/**'],
      extends: ['plugin:cypress/recommended'],
    },
  ],
};
