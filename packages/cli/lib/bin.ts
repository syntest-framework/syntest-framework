#!/usr/bin/env node
/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core Graphing Plugin.
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

import yargHelper = require("yargs/helpers");
import { BaseOptions, Configuration } from "./util/Configuration";
import { ModuleManager } from "./ModuleManager";
import { setupLogger } from "./util/logger";

async function main() {
  // Setup module manager
  ModuleManager.initializeModuleManager();

  // Remove binary call from args
  const args = yargHelper.hideBin(process.argv);

  // Configure base usage
  let yargs = Configuration.configureUsage().help(false).version(false);

  // Configure general options
  yargs = Configuration.configureOptions(yargs);

  // Parse the arguments and config using only the base options
  const baseArguments = yargs.wrap(yargs.terminalWidth()).parseSync(args);

  // Import defined applications
  const applications = (<BaseOptions>(<unknown>baseArguments)).applications;
  await ModuleManager.instance.loadApplications(applications);
  await ModuleManager.instance.configureApplicationCommands(yargs);

  // Import defined plugins
  const plugins = (<BaseOptions>(<unknown>baseArguments)).plugins;
  await ModuleManager.instance.loadPlugins(plugins);
  await ModuleManager.instance.configurePluginOptions(yargs);

  // Finalize yargs object
  yargs = yargs
    .help(true)
    .version(true) // TODO should be the versions of all plugins and packages
    .showHidden(false);

  // setup logger
  setupLogger(
    (<BaseOptions>(<unknown>baseArguments)).logDirectory,
    (<BaseOptions>(<unknown>baseArguments)).logToFile
  );

  // setup cleanup on exit handler
  process.on("exit", () => {
    console.log("cleanup");
    ModuleManager.instance.cleanup();
  });

  // execute program
  await ModuleManager.instance.prepare();
  await yargs.wrap(yargs.terminalWidth()).parse(args);
}

main();
