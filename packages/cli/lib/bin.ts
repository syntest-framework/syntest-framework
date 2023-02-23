#!/usr/bin/env node

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
