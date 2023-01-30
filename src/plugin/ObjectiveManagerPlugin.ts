import { Encoding } from "..";
import { ObjectiveManager } from "../search/objective/managers/ObjectiveManager";
import { PluginInterface } from "./PluginInterface";

export type ObjectiveManagerOptions<T extends Encoding> = {
  runner?: EncodingRunner<T>;
};

export interface ObjectiveManagerPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createObjectiveManager<O extends ObjectiveManagerOptions<T>>(
    options: O
  ): ObjectiveManager<T>;
}
