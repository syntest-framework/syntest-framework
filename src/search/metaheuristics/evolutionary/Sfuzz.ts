import { AbstractTestCase } from "../../../testcase/AbstractTestCase";
import { EncodingSampler } from "../../EncodingSampler";
import { EncodingRunner } from "../../EncodingRunner";
import { Crossover } from "../../operators/crossover/Crossover";
import { SfuzzObjectiveManager } from "../../objective/managers/SfuzzObjectiveManager";
import { getUserInterface } from "../../../ui/UserInterface";
import { MOSA } from "./mosa/MOSA";

/**
 * sFuzz
 *
 * Based on:
 * sFuzz: An Efficient Adaptive Fuzzer for Solidity Smart Contracts
 * Tai D. Nguyen, Long H. Pham, Jun Sun, Yun Lin, Quang Tran Minh
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class Sfuzz extends MOSA {
  constructor(
    encodingSampler: EncodingSampler<AbstractTestCase>,
    runner: EncodingRunner<AbstractTestCase>,
    crossover: Crossover
  ) {
    super(encodingSampler, runner, crossover);
    this._objectiveManager = new SfuzzObjectiveManager<AbstractTestCase>(
      runner
    );
  }

  protected _environmentalSelection(size: number): void {
    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size != 0
    )
      throw Error(
        "This should never happen. There is a likely bug in the objective manager"
      );

    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size == 0
    )
      return; // the search should end

    // non-dominated sorting
    getUserInterface().debug(
      "Number of objectives = " +
      this._objectiveManager.getCurrentObjectives().size
    );

    const F = this.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );

    getUserInterface().debug("First front size = " + F[0].length);

    // select new population
    this._population = F[0];
  }
}
