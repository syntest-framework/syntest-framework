import { getProperty } from "../../config";
import {
  ObjectiveFunction,
  EvolutionaryAlgorithm,
  MOSA,
  NSGAII,
  TestCaseSampler,
  SearchSubject,
  TestCase,
  TestCaseRunner,
} from "../../";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { RandomSearch } from "../metaheuristics/RandomSearch";
import { DynaMOSA } from "../metaheuristics/evolutionary/mosa/DynaMOSA";

/**
 *
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(
  sampler: TestCaseSampler,
  runner: TestCaseRunner
): SearchAlgorithm<TestCase> {
  const algorithm = getProperty("algorithm");

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
