import { Encoding } from "../search/Encoding";
import { PluginManager } from "./PluginManager";
import Yargs = require("yargs");

export interface PluginInterface<T extends Encoding> {
  name: string;
  register?(pluginManager: PluginManager<T>): void;
  configure?(yargs: Yargs.Argv<T>): Promise<Yargs.Argv<T>>;
}
