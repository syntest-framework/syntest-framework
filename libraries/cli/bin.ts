#!/usr/bin/env node
/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
  Configuration as LogConfiguration,
  setupLogger,
} from "@syntest/logging";
import { MetricManager, MetricOptions } from "@syntest/metric";
import {
  BaseOptions,
  ListenerPlugin,
  Configuration as ModuleConfiguration,
  ModuleManager,
  PluginType,
} from "@syntest/module";
import yargHelper = require("yargs/helpers");

async function main() {
  // Setup user interface
  const userInterface = new UserInterface();
  userInterface.printTitle("SynTest");

  // Remove binary call from args
  const arguments_ = yargHelper.hideBin(process.argv);

  /**
   * Configure base usage
   *
   * We disable help and version here because, we don't want the help command to be triggered.
   * When we did not configure the commands and options from the added modules yet.
   */
  let yargs = ModuleConfiguration.configureUsage().help(false).version(false);

  // Configure general options
  yargs = ModuleConfiguration.configureOptions(yargs);
  yargs = LogConfiguration.configureOptions(yargs);

  // Parse the arguments and config using only the base options
  const baseArguments = yargs
    .wrap(yargs.terminalWidth())
    .env("SYNTEST")
    .parseSync(arguments_);

  // Setup logger
  setupLogger(
    path.join(
      (<BaseOptions>(<unknown>baseArguments)).syntestDirectory,
      (<BaseOptions>(<unknown>baseArguments)).logDirectory
    ),
    (<BaseOptions>(<unknown>baseArguments)).fileLogLevel,
    (<BaseOptions>(<unknown>baseArguments)).consoleLogLevel
  );
  const LOGGER = getLogger("cli");

  // Setup metric manager
  const metricManager = new MetricManager("global");

  // Setup module manager
  const moduleManager = new ModuleManager(metricManager, userInterface);

  // Enable help on fail
  yargs = yargs.showHelpOnFail(true);

  // Import defined modules
  const modules = (<BaseOptions>(<unknown>baseArguments)).modules;
  LOGGER.info("Loading standard modules...");
  await moduleManager.loadModule("@syntest/init", "@syntest/init");
  LOGGER.info("Loading modules...", modules);
  await moduleManager.loadModules(modules);
  yargs = await moduleManager.configureModules(
    yargs,
    (<BaseOptions>(<unknown>baseArguments)).preset
  );

  // Set the metrics on the metric manager
  metricManager.metrics = await moduleManager.getMetrics();

  // Setup cleanup on exit handler
  process.on("exit", (code) => {
    if (code !== 0) {
      LOGGER.error(`Process exited with code: ${code}`);
      userInterface.printError(`Process exited with code: ${code}`);
    }
    LOGGER.info("Cleaning up...");
    moduleManager
      .cleanup()
      .then(() => {
        LOGGER.info("Cleanup done! Exiting...");
        return;
      })
      .catch((error) => {
        LOGGER.error("Cleanup failed!", error);
        userInterface.printError("Cleanup failed!");
      });
  });

  moduleManager.printModuleVersionTable();

  // Register all listener plugins
  for (const plugin of moduleManager
    .getPluginsOfType(PluginType.LISTENER)
    .values()) {
    (<ListenerPlugin>plugin).setupEventListener(metricManager);
  }

  const versions = [...moduleManager.modules.values()]
    .map((module) => `${module.name} (${module.version})`)
    .join("\n");

  // Execute program
  LOGGER.info("Executing program...");
  await yargs
    .wrap(yargs.terminalWidth())
    .help(true)
    .version(versions)
    .showHidden(false)
    .demandCommand()
    .env("SYNTEST")
    .middleware(async (argv) => {
      // Set the arguments in the module manager
      moduleManager.args = argv;
      metricManager.setOutputMetrics(
        (<MetricOptions>(<unknown>argv)).outputMetrics
      );

      // Prepare modules
      LOGGER.info("Preparing modules...");
      await moduleManager.prepare();
      LOGGER.info("Modules prepared!");
    })
    .parse(arguments_);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void main();
