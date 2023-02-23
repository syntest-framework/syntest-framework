import { pluginRequiresOptions } from "@syntest/cli";
import {
  Encoding,
  SearchAlgorithm,
  MOSAFamily,
  UncoveredObjectiveManager,
} from "@syntest/core";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "../../plugin/SearchAlgorithmPlugin";

/**
 * Factory plugin for MOSA
 *
 * @author Dimitri Stallenberg
 */
export class MOSAFactory<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "MOSA";
  type: "Search Algorithm";

  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.eventManager) {
      throw new Error(pluginRequiresOptions("MOSA", "eventManager"));
    }
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("MOSA", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("MOSA", "runner"));
    }
    if (!options.crossover) {
      throw new Error(pluginRequiresOptions("MOSA", "crossover"));
    }
    if (!options.populationSize) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "populationSize"));
    }
    if (!options.crossoverProbability) {
      throw new Error(
        pluginRequiresOptions("DynaMOSA", "crossoverProbability")
      );
    }
    return new MOSAFamily<T>(
      options.eventManager,
      new UncoveredObjectiveManager<T>(options.runner),
      options.encodingSampler,
      options.crossover,
      options.populationSize,
      options.crossoverProbability
    );
  }
}
