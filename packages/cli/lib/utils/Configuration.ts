import Yargs = require("yargs");

export class Configuration {
  static configureUsage() {
    return (
      Yargs.usage(`Usage: syntest <command> [options]`)
        // TODO examples
        .epilog("visit https://syntest.org for more documentation")
    );
  }

  static configureOptions(yargs: Yargs.Argv) {
    return (
      yargs
        .option("config", {
          alias: ["c"],
          default: ".syntest.json",
          description: "The syntest configuration file",
          group: "General options:",
          hidden: false,
          config: true,
          type: "string",
        })
        .option("applications", {
          alias: ["a"],
          array: true,
          default: [],
          description: "List of dependencies or paths to applications to load",
          group: "General options:",
          hidden: false,
          type: "string",
        })
        .option("plugins", {
          alias: ["p"],
          array: true,
          default: [],
          description: "List of dependencies or paths to plugins to load",
          group: "General options:",
          hidden: false,
          type: "string",
        })
        // ui
        .option("user-interface", {
          alias: [],
          default: "regular",
          description: "The user interface you use",
          group: "General options:",
          hidden: false,
          type: "string",
        })
        // directories
        .options("syntest-directory", {
          alias: [],
          default: "syntest",
          description: "The path where everything should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .options("temp-syntest-directory", {
          alias: [],
          default: ".syntest",
          description: "The path where all temporary files should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
    );
    // TODO log directory?
    // TODO log settings?
  }
}
