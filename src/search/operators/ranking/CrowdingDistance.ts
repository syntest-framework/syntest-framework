import { TestCase } from "../../../testcase/TestCase";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

/**
 * Compute the crowding distance for all individual int the front.
 *
 * @param front set of individual to consider for the crowding distance
 * @param objectiveFunctions The objectives to consider
 *
 * @author Annibale Panichella
 */
export function crowdingDistance(
  front: TestCase[],
  objectiveFunctions: Set<ObjectiveFunction<TestCase>>
) {
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

  for (const objective of objectiveFunctions) {
    // sort the front in ascending order of fitness value
    const orderedFront = front.sort(function (a, b) {
      return a.getObjective(objective) - b.getObjective(objective);
    });

    const objectiveMin = orderedFront[0].getObjective(objective);
    const objectiveMax = orderedFront[size - 1].getObjective(objective);

    if (objectiveMin == objectiveMax) continue;

    // set crowding distance for extreme points
    orderedFront[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
    orderedFront[size - 1].setCrowdingDistance(Number.POSITIVE_INFINITY);

    // set crowding distance for all other points
    for (let j = 1; j < size - 1; j++) {
      let distance =
        orderedFront[j + 1].getObjective(objective) -
        orderedFront[j - 1].getObjective(objective);
      const denominator = Math.abs(objectiveMin - objectiveMax);
      distance = distance / denominator;
      distance += orderedFront[j].getCrowdingDistance();
      orderedFront[j].setCrowdingDistance(distance);
    }
  }
}
