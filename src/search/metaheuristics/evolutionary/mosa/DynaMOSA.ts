import { MOSA } from "./MOSA";
import { StructuralObjectiveManager } from "../../../objective/managers/StructuralObjectiveManager";
import { TestCase } from "../../../../testcase/TestCase";
import { EncodingSampler } from "../../../EncodingSampler";
import { EncodingRunner } from "../../../EncodingRunner";

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
    encodingSampler: EncodingSampler<TestCase>,
    runner: EncodingRunner<TestCase>
  ) {
    super(encodingSampler, runner);
    this._objectiveManager = new StructuralObjectiveManager<TestCase>(runner);
  }
}
