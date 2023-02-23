// globals

import { initializePseudoRandomNumberGenerator } from "../lib";

// setup
// This will run before all test cases.
before(() => {
  // This will set the configuration singleton for all test cases.
  // The configuration singleton is required for running certain parts of the code.
  initializePseudoRandomNumberGenerator();
});
