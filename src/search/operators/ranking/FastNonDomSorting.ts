import { TestCase } from "../../../testcase/TestCase";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

/**
 * Sort the population using fast non-dominated sorting.
 *
 * @param population the population to sort
 * @param objectiveFunctions The objectives to consider
 * @returns {[]} the newly sorted population
 *
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function fastNonDomSorting(
  population: TestCase[],
  objectiveFunctions: Set<ObjectiveFunction<TestCase>>
) {
  const S: { [id: string]: TestCase[] } = {};
  const F: TestCase[][] = [[]];
  const n: { [id: string]: number } = {};
  const indices: { [id: string]: number } = {};

  for (let index = 0; index < population.length; index++) {
    const p = population[index];
    indices[p.id] = index;
    const Sp: TestCase[] = [];
    S[index] = Sp;
    n[index] = 0;
    for (const q of population) {
      let pDominatesQ = true;
      let qDominatesP = true;
      for (const key of objectiveFunctions) {
        if (p.getObjective(key)! === 0 && q.getObjective(key)! === 0) {
          continue;
        }
        if (p.getObjective(key)! >= q.getObjective(key)!) {
          pDominatesQ = false;
        }

        if (p.getObjective(key)! <= q.getObjective(key)!) {
          qDominatesP = false;
        }
      }

      if (pDominatesQ) {
        Sp.push(q);
      } else if (qDominatesP) {
        n[index] += 1;
      }
    }

    if (n[index] === 0) {
      F[0].push(p);
    }
  }

  let i = 0;
  while (F[i].length !== 0) {
    const H = [];
    for (const p of F[i]) {
      for (const q of S[indices[p.id]]) {
        n[indices[q.id]] -= 1;
        if (n[indices[q.id]] === 0) {
          H.push(q);
        }
      }
    }
    i += 1;
    F.push(H);
  }

  // let's save the ranks
  let index = 0;
  for (const front of F) {
    for (const p of front) {
      p.setRank(index);
    }
    index++;
  }

  return F;
}
