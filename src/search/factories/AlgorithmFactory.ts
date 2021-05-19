import {
  MOSA,
  NSGAII,
  TestCaseSampler,
  TestCase,
  TestCaseRunner,
} from "../../";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { RandomSearch } from "../metaheuristics/RandomSearch";
import { DynaMOSA } from "../metaheuristics/evolutionary/mosa/DynaMOSA";
import {Properties} from "../../properties";

/**
 * Factory for creating an instance of a specific search algorithm from the config.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(
  sampler: TestCaseSampler,
  runner: TestCaseRunner
): SearchAlgorithm<TestCase> {
  const algorithm = Properties.algorithm

  switch (algorithm) {
    case "Random":
      return new RandomSearch(sampler, runner);
    case "NSGAII":
      return new NSGAII(sampler, runner);
    case "MOSA":
      return new MOSA(sampler, runner);
    case "DynaMOSA":
      return new DynaMOSA(sampler, runner);
  }
}
