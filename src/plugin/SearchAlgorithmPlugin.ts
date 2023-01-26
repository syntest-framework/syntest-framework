import { EncodingRunner } from "../search/EncodingRunner";
import { EncodingSampler } from "../search/EncodingSampler";
import { Crossover, Encoding } from "..";
import { SearchAlgorithm } from "../search/metaheuristics/SearchAlgorithm";
import { ObjectiveManager } from "../search/objective/managers/ObjectiveManager";
import { PluginInterface } from "./PluginInterface";

export type SearchAlgorithmOptions<T extends Encoding> = {
  objectiveManager?: ObjectiveManager<T>;
  encodingSampler?: EncodingSampler<T>;
  runner?: EncodingRunner<T>;
  crossover?: Crossover<T>;
};

export interface SearchAlgorithmPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createSearchAlgorithm<O extends SearchAlgorithmOptions<T>>(
    options: O
  ): SearchAlgorithm<T>;
}
