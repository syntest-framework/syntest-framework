import { Configuration, ArgumentsObject } from "../src";
// globals

// setup
before(() => {
  const configuration = new Configuration("test-program");
  configuration.initializeConfigSingleton(<ArgumentsObject>(<unknown>{}));
});
// beforeEach();

// teardown
// after();
// afterEach();
