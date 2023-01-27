import { EncodingRunner } from "../search/EncodingRunner";
import { EncodingSampler } from "../search/EncodingSampler";
import { Crossover, Encoding, Ranking, Selection } from "..";
import { SearchAlgorithm } from "../search/metaheuristics/SearchAlgorithm";
import { ObjectiveManager } from "../search/objective/managers/ObjectiveManager";
import { PluginInterface } from "./PluginInterface";
import { ParentSelection } from "../search/operators/parentSelection/ParentSelection";

export type SearchAlgorithmOptions<T extends Encoding> = {
  objectiveManager?: ObjectiveManager<T>;
  encodingSampler?: EncodingSampler<T>;
  runner?: EncodingRunner<T>;
  crossover?: Crossover<T>;
  selection?: Selection<T>;
  parentSelection?: ParentSelection<T>;
  ranking?: Ranking<T>;
};

export interface SearchAlgorithmPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createSearchAlgorithm<O extends SearchAlgorithmOptions<T>>(
    options: O
  ): SearchAlgorithm<T>;
}
