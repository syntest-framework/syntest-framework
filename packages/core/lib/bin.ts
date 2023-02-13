#!/usr/bin/env node

import { CreatePluginTemplate } from ".";
import yargHelper = require("yargs/helpers");
import Yargs = require("yargs");

const programName = "syntest-core";

async function main() {
  let args = process.argv;
  // Remove binary call from args
  args = yargHelper.hideBin(args);

  const yargs = Yargs.usage(`Usage: ${programName} [options]`)
    .example(
      `${programName} create-core-plugin-template --plugin-name example-plugin --plugin-type Listener`,
      "Create a template core Listener plugin "
    )
    .epilog("visit https://syntest.org for more documentation")
    .command(
      "create-core-plugin-template",
      "This command creates a plugin template for the SynTest Core",
      {
        "plugin-name": {
          default: "plugin-core-example",
          type: "string",
          group: "Create plugin options:",
          demandOption: true,
        },
        "plugin-type": {
          default: "Listener",
          choices: [
            "CrossoverOperator",
            "Listener",
            "EncodingSampler",
            "SearchAlgorithm",
            "TerminationTrigger",
            "UserInterface",
          ],
          type: "string",
          group: "Create plugin options:",
          demandOption: true,
        },
      },
      CreatePluginTemplate
    );

  yargs.wrap(yargs.terminalWidth()).parseSync(args);

  console.log("SynTest Core is not supposed to be ran without commands.");
  process.exit(0);
}

main();
