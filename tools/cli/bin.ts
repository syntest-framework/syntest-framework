#!/usr/bin/env node
/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

import * as path from "node:path";

import { UserInterface } from "@syntest/cli-graphics";
import {
  getLogger,
  Configuration as LoggingConfiguration,
  LoggingOptions,
  setupLogger,
} from "@syntest/logging";
import {
  Configuration as MetricConfiguration,
  MetricManager,
  MetricOptions,
} from "@syntest/metric";
import {
  EventListenerPlugin,
  Configuration as ModuleConfiguration,
  ModuleManager,
  ModuleOptions,
  PluginType,
  PresetOptions,
} from "@syntest/module";
import {
  getSeed,
  initializePseudoRandomNumberGenerator,
  Configuration as PrngConfiguration,
  PrngOptions,
} from "@syntest/prng";
import {
  Configuration as StorageConfiguration,
  StorageManager,
  StorageOptions,
} from "@syntest/storage";
import * as uuid from "short-uuid";
import * as yargs from "yargs";
import { hideBin } from "yargs/helpers";

import {
  Configuration as CliConfiguration,
  ConfigOptions,
} from "./lib/Configuration";
import { storeConfig } from "./lib/middlewares/configStorage";

async function main() {
  // Hide the bin name from the arguments
  const arguments_ = hideBin(process.argv);

  // Configure the base parser
  let config = yargs
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
  config = config.wrap(config.terminalWidth());

  // Configure the base options
  config = CliConfiguration.configureOptions(config);
  config = PrngConfiguration.configureOptions(config);
  config = LoggingConfiguration.configureOptions(config);
  config = StorageConfiguration.configureOptions(config);
  config = MetricConfiguration.configureOptions(config);
  config = ModuleConfiguration.configureOptions(config);

  type BaseOptions = ConfigOptions &
    PrngOptions &
    LoggingOptions &
    StorageOptions &
    PresetOptions &
    ModuleOptions;

  // Parse the arguments and config using only the base options
  const baseArguments = <BaseOptions>(<unknown>config.parseSync(arguments_));

  // Initialize the pseudo random number generator
  const seed = baseArguments.randomSeed || getSeed();
  initializePseudoRandomNumberGenerator(seed);

  // Generate a flow id
  const flowId = `FID-${Date.now()}-${uuid.generate()}`;

  // Configure the console log level
  let consoleLogLevel;
  if (baseArguments.verbose >= 3) {
    consoleLogLevel = "debug";
  } else if (baseArguments.verbose >= 2) {
    consoleLogLevel = "info";
  } else if (baseArguments.verbose >= 1) {
    consoleLogLevel = "warn";
  } else {
    consoleLogLevel = baseArguments.consoleLogLevel;
  }

  // Setup logger
  setupLogger(
    path.join(
      baseArguments.syntestDirectory,
      flowId,
      baseArguments.logDirectory
    ),
    baseArguments.fileLogLevel,
    consoleLogLevel
  );
  const LOGGER = getLogger("cli");

  // Configure module system
  const metricManager = new MetricManager("global");
  const storageManager = new StorageManager(
    baseArguments.syntestDirectory,
    baseArguments.tempSyntestDirectory,
    flowId
  );
  const userInterface = new UserInterface();
  const moduleManager = new ModuleManager(
    metricManager,
    storageManager,
    userInterface
  );

  userInterface.printTitle("SynTest");
  userInterface.printSuccess("");
  userInterface.printSuccess(flowId);
  LOGGER.info(`Starting Flow with id: ${flowId}`);

  // Enable help on fail
  config = config.showHelpOnFail(true);

  // Import defined modules
  const modules = baseArguments.modules;

  // Load standard modules
  LOGGER.info("Loading standard modules...");
  await moduleManager.loadModule("@syntest/init", "@syntest/init");

  // Load user defined modules
  LOGGER.info(`Loading modules... [${modules.join(", ")}]`);
  await moduleManager.loadModules(modules);
  config = moduleManager.configureModules(config, baseArguments.preset);

  moduleManager.printModuleVersionTable();

  const versions = [...moduleManager.modules.values()]
    .map((module) => `${module.name} (${module.version})`)
    .join("\n");

  // Execute program
  LOGGER.info("Executing program...");
  await config
    .help(true)
    .version(versions)
    .demandCommand()
    .middleware(async (argv) => {
      const baseArguments = <BaseOptions>(<unknown>argv);

      // Set the flow id and seed in the base arguments
      baseArguments.fid = flowId;
      baseArguments.randomSeed = seed;

      // Set the arguments in the module manager
      moduleManager.args = argv;

      // Set the metrics on the metric manager
      metricManager.metrics = await moduleManager.getMetrics();

      // Set the output metrics
      metricManager.setOutputMetrics(
        (<MetricOptions>(<unknown>argv)).outputMetrics
      );

      // Register all listener plugins
      for (const plugin of moduleManager
        .getPluginsOfType(PluginType.EVENT_LISTENER)
        .values()) {
        await (<EventListenerPlugin>plugin).setupEventListener(metricManager);
      }

      // Prepare modules
      LOGGER.info("Preparing modules...");
      await moduleManager.prepare();
      LOGGER.info("Modules prepared!");
    })
    .middleware((argv) => storeConfig(moduleManager, storageManager, argv))
    .parse(arguments_);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void main();
