import { Encoding } from "..";
import { PluginInterface } from "./PluginInterface";
import { Selection } from "../search/operators/selection/Selection";

export type SelectionOptions<T extends Encoding> = unknown;

export interface SelectionPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createSelectionOperator<O extends SelectionOptions<T>>(
    options: O
  ): Selection<T>;
}
