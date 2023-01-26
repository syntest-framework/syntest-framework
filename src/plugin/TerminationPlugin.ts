import { Encoding } from "..";
import { TerminationTrigger } from "../search/termination/TerminationTrigger";
import { PluginInterface } from "./PluginInterface";

export type TerminationOptions<T extends Encoding> = unknown;

export interface TerminationPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createTerminationTrigger<O extends TerminationOptions<T>>(
    options: O
  ): TerminationTrigger;
}
