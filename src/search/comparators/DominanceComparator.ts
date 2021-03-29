import { TestCase } from "../../testcase/TestCase";
import { Objective } from "../../index";

export class DominanceComparator {
  /**
   * Fast Dominance Comparator as discussed in
   * "Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic
   *  Selection of the Targets"
   */
  static compare(
    individual1: TestCase,
    individual2: TestCase,
    targets: Set<Objective>
  ): number {
    let dominatesX = false;
    let dominatesY = false;

    for (const objective of targets) {
      if (
        individual1.getEvaluation().get(objective) <
        individual2.getEvaluation().get(objective)
      )
        dominatesX = true;
      if (
        individual1.getEvaluation().get(objective) >
        individual2.getEvaluation().get(objective)
      )
        dominatesY = true;

      // if the both do not dominates each other, we don't
      // need to iterate over all the other targets
      if (dominatesX && dominatesY) return 0;
    }

    if (dominatesX == dominatesY) return 0;
    else if (dominatesX) return -1;
    else dominatesY;
    return +1;
  }
}
