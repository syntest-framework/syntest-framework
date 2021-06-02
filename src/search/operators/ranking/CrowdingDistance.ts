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
    front[0].setCrowdingDistance(1.0);
    return;
  }
  if (size == 2) {
    front[0].setCrowdingDistance(1.0);
    front[1].setCrowdingDistance(1.0);
    return;
  }

  for (let index = 0; index < front.length; index++) {
    front[index].setCrowdingDistance(0.0);
  }

  for (const objective of objectiveFunctions) {
    // sort the front in ascending order of fitness value
    const orderedFront = front.sort(function (a, b) {
      return a.getDistance(objective) - b.getDistance(objective);
    });

    const objectiveMin = orderedFront[0].getDistance(objective);
    const objectiveMax = orderedFront[size - 1].getDistance(objective);

    if (objectiveMin == objectiveMax) continue;

    // set crowding distance for extreme points
    orderedFront[0].setCrowdingDistance(
      orderedFront[0].getCrowdingDistance() + 1
    );
    orderedFront[size - 1].setCrowdingDistance(
      orderedFront[size - 1].getCrowdingDistance() + 1
    );

    const denominator = Math.abs(objectiveMin - objectiveMax);

    // set crowding distance for all other points
    for (let j = 1; j < size - 1; j++) {
      let distance =
        orderedFront[j + 1].getDistance(objective) -
        orderedFront[j - 1].getDistance(objective);
      if (denominator != 0) {
        distance = distance / denominator;
        distance += orderedFront[j].getCrowdingDistance();
        orderedFront[j].setCrowdingDistance(distance);
      }
    }
  }
}
