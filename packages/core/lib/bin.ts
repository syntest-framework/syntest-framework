#!/usr/bin/env node

import yargHelper = require("yargs/helpers");
import { Configuration } from "./Configuration";
import { RandomSearchFactory } from "./search/metaheuristics/RandomSearch";
import {
  MOSAFactory,
  DynaMOSAFactory,
} from "./search/metaheuristics/evolutionary/MOSAFamily";
import { NSGAIIFactory } from "./search/metaheuristics/evolutionary/NSGAII";
import { SignalTerminationTriggerFactory } from "./search/termination/SignalTerminationTrigger";
import { pluginManager } from "./plugin/PluginManager";

const name = "syntest-core";

async function main() {
  // Remove binary call from args
  const args = yargHelper.hideBin(process.argv);

  // Configure base usage
  let yargs = Configuration.configureUsage(name);
  // Configure general options
  yargs = Configuration.configureGeneralOptions(yargs);

  // Parse the arguments and config using only the base options
  const baseArguments = await Configuration.processArguments(yargs, args);

  // register standard search algorithms
  pluginManager.registerSearchAlgorithm(new RandomSearchFactory());
  pluginManager.registerSearchAlgorithm(new NSGAIIFactory());
  pluginManager.registerSearchAlgorithm(new MOSAFactory());
  pluginManager.registerSearchAlgorithm(new DynaMOSAFactory());

  // register standard termination triggers
  pluginManager.registerTermination(new SignalTerminationTriggerFactory());

  // Configure commands and sub options
  yargs = Configuration.configureCommands(yargs);

  // load external plugins
  for (const plugin of baseArguments.plugins) {
    await pluginManager.loadPlugin(plugin);
  }

  // add plugin options
  yargs = await pluginManager.addPluginOptions(yargs);

  // Parse the arguments and config using all options
  await Configuration.processArguments(yargs, args);
}

main();
