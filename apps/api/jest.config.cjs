const { compilerOptions } = require('./tsconfig.json');
const { map, concat, toPairs, pipe, replace, fromPairs, includes, filter } = require('ramda');

const esModules = ['fp-ts-std/dist/esm'].join('|');

const transformKey = replace(/\*/g, '(.*)\\.js');
const transformValue = pipe(replace(/\/\*$/, '/$1'), concat('<rootDir>/'));
const transformModuleMapper = pipe(
  toPairs,
  map(([key, vals]) => [transformKey(key), map(transformValue, vals)]),
  filter(([key]) => !includes('fp-ts-std', key)),
  fromPairs,
);
const moduleNameMapper = transformModuleMapper(compilerOptions.paths);

/** @type {import('jest').Config} */
const common = {
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.[jt]s$': '@swc/jest' },
  transformIgnorePatterns: [`/node_modules/(?!(${esModules})/)`],
  setupFilesAfterEnv: [
    '<rootDir>/jest/setup.ts',
    'jest-extended/all',
    '@relmify/jest-fp-ts',
    'jest-expect-message',
    'dotenv/config',
  ],
  watchPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  modulePaths: ['<rootDir>/src/', '<rootDir>/e2e/'],
  moduleNameMapper: { ...moduleNameMapper, '^(\\.{1,2}/.*)\\.js$': '$1' },
};

/** @type {import('jest').Config} */
module.exports = {
  passWithNoTests: true,
  maxWorkers: '50%',
  projects: [
    {
      ...common,
      displayName: { name: 'UNIT', color: 'blue' },
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      ...common,
      displayName: { name: 'INTEGRATION', color: 'magenta' },
      // globalSetup: '<rootDir>/jest/integration-setup.cjs',
      testMatch: ['<rootDir>/src/**/*.itest.ts'],
    },
    {
      ...common,
      displayName: { name: 'E2E', color: 'yellow' },
      // globalSetup: '<rootDir>/jest/e2e-setup.cjs',
      // globalTeardown: '<rootDir>/jest/e2e-teardown.cjs',
      testMatch: ['<rootDir>/e2e/**/*.test.ts'],
    },
  ],
};
