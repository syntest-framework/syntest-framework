import { Argv } from "yargs";

export const command = "setup";

export const aliases: string[] = [];
export const describe = "Setup the requirements for the SynTest tool";

export const builder = (yargs: Argv) => {
  return yargs
    .options({
      "syntest-directory": {
        alias: [],
        default: "syntest",
        description: "The path where everything should be saved",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
    })
    .usage("Usage: $0 setup [options]")
    .version(false)
    .help(true);
};

export const handler = (argv) => {
  console.log("called with args", argv);
  setTimeout(() => {
    console.log("time");
  }, 2000);
  //   Configuration.initialize(argv);
  // example
  // const eventManager = new EventManager({})
  // const pluginManager = new PluginManager()
  // const launcher = new Launcher(eventManager, pluginManager)
  // launcher.run()
};
