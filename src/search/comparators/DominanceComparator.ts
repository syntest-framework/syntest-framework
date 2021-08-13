import { AbstractTestCase } from "../../testcase/AbstractTestCase";
import { ObjectiveFunction } from "../objective/ObjectiveFunction";

export class DominanceComparator {
  /**
   * Fast Dominance Comparator as discussed in
   * "Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic
   *  Selection of the Targets"
   */
  static compare(
    individual1: AbstractTestCase,
    individual2: AbstractTestCase,
    objectives: Set<ObjectiveFunction<AbstractTestCase>>
  ): number {
    let dominatesX = false;
    let dominatesY = false;

    for (const objective of objectives) {
      if (
        individual1.getDistance(objective) < individual2.getDistance(objective)
      )
        dominatesX = true;
      if (
        individual1.getDistance(objective) > individual2.getDistance(objective)
      )
        dominatesY = true;

      // if the both do not dominates each other, we don't
      // need to iterate over all the other objectives
      if (dominatesX && dominatesY) return 0;
    }

    if (dominatesX == dominatesY) return 0;
    else if (dominatesX) return -1;
    else dominatesY;
    return +1;
  }
}
