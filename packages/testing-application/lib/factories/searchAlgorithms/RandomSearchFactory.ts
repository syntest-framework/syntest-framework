import {
  Encoding,
  RandomSearch,
  SearchAlgorithm,
  SimpleObjectiveManager,
} from "@syntest/core";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "../../plugin/SearchAlgorithmPlugin";
import { pluginRequiresOptions } from "@syntest/cli";
/**
 * Factory plugin for RandomSearch
 *
 * @author Dimitri Stallenberg
 */
export class RandomSearchFactory<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "RandomSearch";
  type: "Search Algorithm";
  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.eventManager) {
      throw new Error(pluginRequiresOptions("RandomSearch", "eventManager"));
    }
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("RandomSearch", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("RandomSearch", "runner"));
    }
    return new RandomSearch(
      options.eventManager,
      new SimpleObjectiveManager<T>(options.runner),
      options.encodingSampler
    );
  }
}
