import { Encoding } from "../search/Encoding";
import { PluginManager } from "./PluginManager";

export interface PluginInterface<T extends Encoding> {
  name: string;
  register(pluginManager: PluginManager<T>): void;
  // TODO
  // configure?(): void
}
