import { initializeConfigSingleton, ArgumentValues } from "../src";
// globals

// setup
before(() => {
  initializeConfigSingleton(<ArgumentValues>(<unknown>{}));
});
// beforeEach();

// teardown
// after();
// afterEach();
