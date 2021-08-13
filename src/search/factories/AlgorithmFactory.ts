import {
  MOSA,
  NSGAII,
  TestCaseSampler,
  AbstractTestCase,
  TestCaseRunner,
  Crossover,
} from "../../";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { RandomSearch } from "../metaheuristics/RandomSearch";
import { DynaMOSA } from "../metaheuristics/evolutionary/mosa/DynaMOSA";
import { Properties } from "../../properties";

/**
 * Factory for creating an instance of a specific search algorithm from the config.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(
  sampler: TestCaseSampler,
  runner: TestCaseRunner,
  crossover: Crossover
): SearchAlgorithm<AbstractTestCase> {
  const algorithm = Properties.algorithm;

  switch (algorithm) {
    case "Random":
      return new RandomSearch(sampler, runner);
    case "NSGAII":
      return new NSGAII(sampler, runner, crossover);
    case "MOSA":
      return new MOSA(sampler, runner, crossover);
    case "DynaMOSA":
      return new DynaMOSA(sampler, runner, crossover);
  }
}
