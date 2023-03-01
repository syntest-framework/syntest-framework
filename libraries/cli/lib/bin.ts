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

import yargHelper = require("yargs/helpers");
import { BaseOptions, Configuration } from "./util/Configuration";
import { ModuleManager } from "./ModuleManager";
import { getLogger, setupLogger } from "../../logging/dist";
import * as path from "path";
import { UserInterfacePlugin } from "./module/plugins/UserInterfacePlugin";
import { ListenerPlugin } from "./module/plugins/ListenerPlugin";

async function main() {
  // remove binary call from args
  const args = yargHelper.hideBin(process.argv);

  // Configure base usage
  // We disable help and version here because,
  // we don't want the help command to be triggered
  // when we did not configure the commands and options from the added modules yet
  let yargs = Configuration.configureUsage().help(false).version(false);

  // configure general options
  yargs = Configuration.configureOptions(yargs);

  // [arse the arguments and config using only the base options
  const baseArguments = yargs.wrap(yargs.terminalWidth()).parseSync(args);

  // setup logger
  setupLogger(
    path.join(
      (<BaseOptions>(<unknown>baseArguments)).syntestDirectory,
      (<BaseOptions>(<unknown>baseArguments)).logDirectory
    ),
    (<BaseOptions>(<unknown>baseArguments)).fileLogLevel,
    (<BaseOptions>(<unknown>baseArguments)).consoleLogLevel
  );
  const LOGGER = getLogger("cli");

  // setup module manager
  ModuleManager.initializeModuleManager();

  yargs = yargs.showHelpOnFail(true);

  // import defined modules
  const modules = (<BaseOptions>(<unknown>baseArguments)).modules;
  LOGGER.info("Loading modules...", modules);
  await ModuleManager.instance.loadModules(modules);
  yargs = await ModuleManager.instance.configureModules(yargs);

  // setup user interface
  const userInterfacePlugin = ModuleManager.instance.getPlugin(
    "User Interface",
    (<BaseOptions>(<unknown>baseArguments)).userInterface
  );
  const userInterface = (<UserInterfacePlugin>(
    userInterfacePlugin
  )).createUserInterface();
  userInterface.printTitle();
  userInterface.setupEventListener();

  // setup cleanup on exit handler
  process.on("exit", (code) => {
    if (code !== 0) {
      LOGGER.error("Process exited with code: " + code);
      userInterface.printError("Process exited with code: " + code);
    }
    LOGGER.info("Cleaning up...");
    ModuleManager.instance.cleanup();
    LOGGER.info("Cleanup done! Exiting...");
  });

  userInterface.printHeader("Modules loaded:");

  for (const module of ModuleManager.instance.modules.values()) {
    LOGGER.info("Module loaded: " + module.name);
    userInterface.print(`- Module: ${module.name} (${module.version})`);
    userInterface.print(`  - Tools:`);
    for (const tool of await module.getTools()) {
      LOGGER.info(`- Tool loaded: ${tool.name}`);
      userInterface.print(`  - ${tool.name}`);
    }
    userInterface.print(`  - Plugins:`);
    for (const plugin of await module.getPlugins()) {
      LOGGER.info(`- Plugin loaded: ${plugin.name}`);
      userInterface.print(`  - ${plugin.name}`);
    }
  }

  // register all listener plugins
  for (const plugin of ModuleManager.instance
    .getPluginsOfType("Listener")
    .values()) {
    (<ListenerPlugin>plugin).setupEventListener();
  }

  // prepare modules
  LOGGER.info("Preparing modules...");
  await ModuleManager.instance.prepare();
  LOGGER.info("Modules prepared!");

  // execute program
  LOGGER.info("Executing program...");
  await yargs
    .wrap(yargs.terminalWidth())
    .help(true)
    .version(true) // TODO should be the versions of all plugins and packages
    .showHidden(false)
    .demandCommand()
    .parse(args);
}

main();
