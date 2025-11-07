export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/integration/**/*.test.js'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  transform: {},
  moduleNameMapper: {
    '^#lib/(.*)$': '<rootDir>/../lib/$1'
  },
  rootDir: '.',
  maxWorkers: 1,
  testSequencer: '<rootDir>/sequencer.js',
  bail: 1  // Stop running tests after the first failure
};
