import { Encoding } from "../search/Encoding";
import { PluginManager } from "./PluginManager";
import Yargs = require("yargs");

export interface PluginInterface<T extends Encoding> {
  name: string;
  register?(pluginManager: PluginManager<T>): void;
  /**
   * Should return a map of optionName -> yargsConfig
   */
  getConfig?(): Promise<Map<string, Yargs.Options>>;
}
