const { compilerOptions } = require('./tsconfig.json');
const { map, concat, toPairs, pipe, replace, fromPairs } = require('ramda');

// const esModules = ['date-fns'].join('|');

const transformKey = replace(/\*/g, '(.*)');
const transformValue = pipe(replace(/\/\*$/, '/$1'), concat('<rootDir>/'));
const transformModuleMapper = pipe(
  toPairs,
  map(([key, vals]) => [transformKey(key), map(transformValue, vals)]),
  fromPairs,
);
const moduleNameMapper = transformModuleMapper(compilerOptions.paths);

const setupFilesAfterEnv = ['jest-extended/all', '@relmify/jest-fp-ts', 'dotenv/config'];

/** @type {import('jest').Config} */
const common = {
  transform: { '^.+\\.(t|j)sx?$': '@swc/jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  watchPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  modulePaths: ['<rootDir>/src/'],
  moduleNameMapper,
};

/** @type {import('jest').Config} */
module.exports = {
  passWithNoTests: true,
  maxWorkers: '50%',
  projects: [
    {
      ...common,
      displayName: { name: 'DOM', color: 'blue' },
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest/setup.cjs', ...setupFilesAfterEnv],
      moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
          '<rootDir>/jest/fileMock.cjs',
        '\\.css$': '<rootDir>/jest/styleMock.cjs',
        'strategyExecutorContextTypes\\/dist\\/index\\.d\\.cts\\?raw$':
          '<rootDir>/jest/strategyExecutorContextMock.cjs',
        ...moduleNameMapper,
      },
    },
    {
      ...common,
      displayName: { name: 'NODE', color: 'cyan' },
      testEnvironment: 'node',
      setupFilesAfterEnv,
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      ...common,
      displayName: { name: 'INTEGRATION', color: 'magenta' },
      testEnvironment: 'node',
      setupFilesAfterEnv,
      testMatch: ['<rootDir>/src/**/*.itest.ts'],
    },
  ],
};
