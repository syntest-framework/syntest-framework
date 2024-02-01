#!/usr/bin/env node
/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { UserInterface } from "@syntest/cli-graphics";
import { getLogger, LogVerbosity, setupLogger } from "@syntest/logging";
import { MetricManager } from "@syntest/metric";
import {
  EventListenerPlugin,
  ExtensionManager,
  ModuleLoader,
  PluginType,
} from "@syntest/module";
import { getSeed, initializePseudoRandomNumberGenerator } from "@syntest/prng";
import { StorageManager } from "@syntest/storage";
import * as uuid from "short-uuid";
import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";

import {
  GeneralConfig,
  GeneralOptions,
  LoggingConfig,
  LoggingOptions,
  MetricConfig,
  MetricOptions,
  ModuleConfig,
  ModuleOptions,
  PrngConfig,
  PrngOptions,
  StorageConfig,
  StorageOptions,
} from "./lib/Configuration";
import { findConfig } from "./lib/findConfig";
import { storeConfig } from "./lib/middlewares/configStorage";

// eslint-disable-next-line sonarjs/cognitive-complexity
async function main() {
  // Hide the bin name from the arguments
  const arguments_ = hideBin(process.argv);

  /**
   * Program arguments are defined in this order of precedence:
   * 1. Command line args
   * 2. Env vars
   * 3. Config file/objects
   * 4. Configured defaults
   */

  // Configure the base parser
  let parser = yargs.parserConfiguration({
    "boolean-negation": true,
    "camel-case-expansion": true,
    "combine-arrays": false,
    "dot-notation": true,
    "duplicate-arguments-array": true,
    "flatten-duplicate-arrays": true,
    "greedy-arrays": false, // true
    "halt-at-non-option": false,
    "nargs-eats-options": false,
    "negation-prefix": "no-",
    "parse-numbers": true,
    "parse-positional-numbers": true,
    "populate--": true, // false
    "set-placeholder-key": true, // false
    "short-option-groups": true,
    "strip-aliased": true, // false
    "strip-dashed": true, // false
    "unknown-options-as-args": false,
  });

  parser
    .usage(`Usage: $0 <command> [options]`)
    .epilog("visit https://syntest.org for more documentation")
    .env("SYNTEST")
    .pkgConf("syntest")
    .showHidden(false)
    // We disable help and version here as we don't want the help command to be triggered
    // when we did not configure the commands and options from the added modules yet.
    .help(false)
    .version(false);

  // Wrap CLI to the terminal width
  parser.wrap(parser.terminalWidth());

  // Configure the base options
  parser.options(GeneralOptions);
  parser.options(LoggingOptions);
  parser.options(MetricOptions);
  parser.options(ModuleOptions);
  parser.options(PrngOptions);
  parser.options(StorageOptions);

  // Configure the base config
  type BaseConfig = GeneralConfig &
    LoggingConfig &
    MetricConfig &
    ModuleConfig &
    PrngConfig &
    StorageConfig;

  let config;

  // Parse the arguments (first pass) and determine and apply the external configuration file
  config = <BaseConfig>(<unknown>parser.parseSync(arguments_));
  let invalidConfig = false;
  let invalidConfigPath = false;
  const configPath = config.config ? path.resolve(config.config) : findConfig();
  if (fs.statSync(configPath, { throwIfNoEntry: false })?.isFile()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      parser.config(JSON.parse(fs.readFileSync(configPath, "utf8")));
    } catch {
      // If the config file is invalid, we set the invalid config flag
      invalidConfig = true;
    }
  } else {
    // If the config file does not exist, we set the invalid config flag
    invalidConfigPath = true;
  }

  // Parse the arguments (second pass) using only the base options
  config = <BaseConfig>(<unknown>parser.parseSync(arguments_));

  // Initialize the Pseudo Random Number Generator (PRNG)
  const seed = config.randomSeed || getSeed();
  initializePseudoRandomNumberGenerator(seed);

  // Generate a flow id
  const flowId = `FID-${Date.now()}-${uuid.generate()}`;

  // Configure the console verbosity
  let consoleVerbosity: LogVerbosity;
  if (config.silent) {
    consoleVerbosity = "silent";
  } else if (config.quiet) {
    consoleVerbosity = "error";
  } else if (config.verbose >= 3) {
    consoleVerbosity = "trace";
  } else if (config.verbose >= 2) {
    consoleVerbosity = "debug";
  } else if (config.verbose >= 1) {
    consoleVerbosity = "info";
  } else {
    consoleVerbosity = "warn";
  }

  // Setup logger
  setupLogger(
    consoleVerbosity,
    path.join(config.syntestDirectory, flowId, config.logDirectory),
    config.fileLogLevel,
    { flowId: flowId }
  );
  const LOGGER = getLogger("cli");

  // Configure user interface
  const userInterface = new UserInterface();
  userInterface.printTitle("SynTest");
  userInterface.printSuccess("");
  userInterface.printSuccess(flowId);
  LOGGER.info(`Starting Flow with id: ${flowId}`, { flowId: flowId });

  // Print invalid config warning
  if (invalidConfigPath) {
    LOGGER.warn(`Config file not found: ${configPath}`);
  } else if (invalidConfig) {
    LOGGER.warn(`Invalid config: ${configPath}`);
  } else {
    LOGGER.info(`Using config: ${configPath}`);
  }

  // Enable help on fail
  parser.showHelpOnFail(true);

  // Load modules
  const extensionManager = new ExtensionManager();
  const moduleLoader = new ModuleLoader(extensionManager);
  const modules = config.modules;

  // Load standard modules
  LOGGER.info("Loading standard modules...");
  await moduleLoader.loadModule("@syntest/init", true);

  // Load user defined modules
  LOGGER.info(`Loading modules... [${modules.join(", ")}]`);
  for (const module of modules) {
    await moduleLoader.loadModule(module);
  }
  parser = extensionManager.configureModules(parser, config.preset);

  //moduleManager.printModuleVersionTable();

  const versions = [...extensionManager.modules.values()]
    .map((module) => `${module.name} (${module.version})`)
    .join("\n");

  const storageManager = new StorageManager(
    config.syntestDirectory,
    config.syntestTempDirectory,
    flowId
  );

  // Execute program
  LOGGER.info("Executing program...");
  await parser
    .help(true)
    .version(versions)
    .demandCommand()
    .middleware(async (argv) => {
      // Middlewares are only executed if a command is given

      // Parse the arguments (third pass) using the module options
      const config = <BaseConfig>(<unknown>argv);

      // Set the CI flag if the environment variable is set
      if (process.env["CI"]) {
        config.ci = true;
      }

      // Set the flow id and seed in the base arguments
      config.fid = flowId;
      config.randomSeed = seed;

      const metricManager = new MetricManager("global");

      // Set the metrics on the metric manager
      metricManager.metrics = await extensionManager.getMetrics();

      // Set the output metrics
      metricManager.setOutputMetrics(config.outputMetrics);

      // Set the arguments in the module manager
      await extensionManager.setup(
        argv,
        metricManager,
        userInterface,
        storageManager
      );

      // Register all listener plugins
      for (const plugin of extensionManager
        .getPluginsOfType(PluginType.EVENT_LISTENER)
        .values()) {
        await (<EventListenerPlugin>plugin).setupEventListener(metricManager);
      }

      // Prepare modules
      LOGGER.info("Preparing modules...");
      await extensionManager.prepare();
      LOGGER.info("Modules prepared!");
    })
    .middleware((argv) => storeConfig(extensionManager, storageManager, argv))
    .parse(arguments_);

  console.log("CLI finished!");
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void main();
