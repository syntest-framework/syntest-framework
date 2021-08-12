import { MOSA } from "./MOSA";
import { StructuralObjectiveManager } from "../../../objective/managers/StructuralObjectiveManager";
import { AbstractTestCase } from "../../../../testcase/AbstractTestCase";
import { EncodingSampler } from "../../../EncodingSampler";
import { EncodingRunner } from "../../../EncodingRunner";
import { AbstractTreeCrossover } from "../../../operators/crossover/AbstractTreeCrossover";

/**
 * Dynamic Many-Objective Sorting Algorithm (DynaMOSA).
 *
 * Based on:
 * Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic Selection of the Targets
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Mitchell Olsthoorn
 */
export class DynaMOSA extends MOSA {
  constructor(
    encodingSampler: EncodingSampler<AbstractTestCase>,
    runner: EncodingRunner<AbstractTestCase>,
    crossover: AbstractTreeCrossover
  ) {
    super(encodingSampler, runner, crossover);
    this._objectiveManager = new StructuralObjectiveManager<AbstractTestCase>(runner);
  }
}
