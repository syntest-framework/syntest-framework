import {
  Encoding,
  SearchAlgorithm,
  MOSAFamily,
  StructuralObjectiveManager,
} from "@syntest/core";
import { pluginRequiresOptions } from "@syntest/cli";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "../../plugin/SearchAlgorithmPlugin";

/**
 * Factory plugin for DynaMOSA
 *
 * Dynamic Many-Objective Sorting Algorithm (DynaMOSA).
 *
 * Based on:
 * Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic Selection of the Targets
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Dimitri Stallenberg
 */
export class DynaMOSAFactory<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "DynaMOSA";
  type: "Search Algorithm";

  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.eventManager) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "eventManager"));
    }
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "runner"));
    }
    if (!options.crossover) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "crossover"));
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
      new StructuralObjectiveManager<T>(options.runner),
      options.encodingSampler,
      options.crossover,
      options.populationSize,
      options.crossoverProbability
    );
  }
}
