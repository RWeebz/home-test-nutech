/**
 * Custom test sequencer to run tests in alphabetical order
 * This ensures modules run sequentially: 01-membership, 02-information, 03-transaction
 */
export default class CustomSequencer {
  sort(tests) {
    // Sort tests alphabetically by path
    const sortedTests = Array.from(tests).sort((testA, testB) => {
      return testA.path.localeCompare(testB.path);
    });
    return sortedTests;
  }

  // Required method for Jest sequencer
  shard(tests, options) {
    return tests;
  }

  // Required method for Jest sequencer
  cacheResults(tests, results) {
    // No-op implementation
  }
}
