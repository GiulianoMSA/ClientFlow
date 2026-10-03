module.exports = {
  rootDir: '.',

  moduleFileExtensions: ['js', 'json', 'ts'],

  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        useESM: true,
      },
    ],
  },

  extensionsToTreatAsEsm: ['.ts'],

  testEnvironment: 'node',

  collectCoverageFrom: ['src/**/*.(t|j)s'],

  coverageDirectory: './coverage',

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};