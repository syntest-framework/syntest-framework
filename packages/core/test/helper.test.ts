import {
  Configuration,
  ArgumentsObject,
  setupLogger,
  PluginManager,
  UserInterface,
} from "../lib";
// globals

// setup
// This will run before all test cases.
before(() => {
  // This will set the configuration singleton for all test cases.
  // The configuration singleton is required for running certain parts of the code.
  const configuration = new Configuration();
  configuration.initialize(<ArgumentsObject>(<unknown>{
    fileLogLevel: ["debug"],
    consoleLogLevel: "debug",
    logDirectory: "syntest",
  }));
  setupLogger();
});
