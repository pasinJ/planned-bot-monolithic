module.exports = {
  root: true,
  env: { node: true, es2022: true },
  ignorePatterns: ['dist', '*.js', '*.cjs', '*.mjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json',
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
    '@typescript-eslint/ban-types': ['error', { types: { Symbol: false }, extendDefaults: true }],
  },
  overrides: [
    {
      files: ['src/**/!(*.*test).ts'],
      settings: {
        'import/parsers': { '@typescript-eslint/parser': ['.ts'] },
        'import/resolver': { typescript: { alwaysTryTypes: true } },
      },
      extends: [
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:fp-ts/recommended',
        'plugin:fp-ts/recommended-requiring-type-checking',
        'plugin:security/recommended',
      ],
      plugins: ['import'],
      rules: {
        'import/no-cycle': 'error',
        'import/no-deprecated': 'error',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'fp-ts/no-lib-imports': 'off',
      },
    },
    {
      files: ['src/**/+(*.*test).ts', 'e2e/**/*.test.ts', 'test-utils/**/*.ts'],
      extends: ['plugin:jest/recommended', 'plugin:jest/style'],
      plugins: ['@typescript-eslint'],
      rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
    },
  ],
};
