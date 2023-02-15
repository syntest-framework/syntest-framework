import { Argv } from "yargs";
import { Configuration } from "../Configuration";
// import { EventManager, Launcher, PluginManager } from "..";

export const command = "run";

export const aliases: string[] = ["start", "r"];
export const description = "Run the tool";

export const builder = (yargs: Argv) => {
  yargs = yargs.usage("Usage: $0 run [options]").version(false);
  return Configuration.configureBaseOptions(yargs);
};

export const handler = (argv) => {
  Configuration.initialize(argv);
  // example
  // const eventManager = new EventManager({})
  // const pluginManager = new PluginManager()
  // const launcher = new Launcher(eventManager, pluginManager)
  // launcher.run()
};
