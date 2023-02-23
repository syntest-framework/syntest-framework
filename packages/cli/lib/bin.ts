#!/usr/bin/env node

import yargHelper = require("yargs/helpers");
import { Configuration } from "./util/Configuration";
import { ModuleManager } from "./ModuleManager";

async function main() {
  // Remove binary call from args
  const args = yargHelper.hideBin(process.argv);

  // Configure base usage
  let yargs = Configuration.configureUsage().help(false).version(false);

  // Configure general options
  yargs = Configuration.configureOptions(yargs);

  // Parse the arguments and config using only the base options
  const baseArguments = yargs.wrap(yargs.terminalWidth()).parseSync(args);

  // import defined applications
  const applications = <string[]>baseArguments.applications;
  ModuleManager.instance.loadApplications(applications);
  ModuleManager.instance.configureApplicationCommands(yargs);

  // import defined plugins
  const plugins = <string[]>baseArguments.plugins;
  ModuleManager.instance.loadPlugins(plugins);
  ModuleManager.instance.configurePluginOptions(yargs);

  yargs = yargs
    .help(true)
    .version(true) // TODO should be the versions of all plugins and packages
    .showHidden(false);

  // execute program
  await ModuleManager.instance.prepare();
  yargs.wrap(yargs.terminalWidth()).parseSync(args);
  console.log("cleanup");
  await ModuleManager.instance.cleanup();
}

main();
