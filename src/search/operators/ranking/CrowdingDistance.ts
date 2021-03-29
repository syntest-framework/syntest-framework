import { TestCase } from "../../../testcase/TestCase";
import { Ranking } from "./Ranking";

export class CrowdingDistance implements Ranking {

  /**
   * Compute the crowding distance for all individual int the front
   * @param front set of individual to consider for the crowding distance
   *
   * @author Annibale Panichella
   */
  rank(front: TestCase[]): void {
    const size = front.length;

    if (size == 0) return;

    if (size == 1) {
      front[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
      return;
    }
    if (size == 2) {
      front[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
      front[1].setCrowdingDistance(Number.POSITIVE_INFINITY);
      return;
    }

    for (let index = 0; index < front.length; index++) {
      front[index].setCrowdingDistance(0.0);
    }

    //throw new Error('Front = '+ front + ' size = ' + size)

    for (const objective of front[0].getEvaluation().keys()) {
      // sort the front in ascending order of fitness value
      const orderedFront = front.sort(function (a, b) {
        return (
            a.getEvaluation().get(objective) - b.getEvaluation().get(objective)
        );
      });

      const objectiveMin = orderedFront[0].getEvaluation().get(objective);
      const objectiveMax = orderedFront[size - 1].getEvaluation().get(objective);

      if (objectiveMin == objectiveMax) continue;

      // set crowding distance for extreme points
      orderedFront[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
      orderedFront[size - 1].setCrowdingDistance(Number.POSITIVE_INFINITY);

      // set crowding distance for all other points
      for (let j = 1; j < size - 1; j++) {
        let distance =
            orderedFront[j + 1].getEvaluation().get(objective) -
            orderedFront[j - 1].getEvaluation().get(objective);
        const denominator = Math.abs(objectiveMin - objectiveMax);
        distance = distance / denominator;
        distance += orderedFront[j].getCrowdingDistance();
        orderedFront[j].setCrowdingDistance(distance);
      }
    }
  }
}
