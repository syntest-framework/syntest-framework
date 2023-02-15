#!/usr/bin/env node

import yargHelper = require("yargs/helpers");
import { Configuration } from "./Configuration";

const name = "syntest-core";

async function main() {
  // Remove binary call from args
  const args = yargHelper.hideBin(process.argv);

  // Configure base options
  const yargs1 = Configuration.configureUsage(name);
  const yargs2 = Configuration.configureCommands(yargs1);

  // TODO do some kind of dry run, parse without exceuting commands

  // Parse the arguments and config using only the base options
  const baseArguments = await Configuration.processArguments(yargs2, args);
  // Add the language specific tool options
  const yargs3 = await this.addOptions(yargs2);
  // Register the plugins and add the plugin options
  const yargs4 = await this.registerPlugins(baseArguments.plugins, yargs3);
  // Parse the arguments and config using all options
  const argValues = await this.configuration.processArguments(yargs4, args);
  // Initialize the configuration object
  this.configuration.initialize(argValues);
}

main();
