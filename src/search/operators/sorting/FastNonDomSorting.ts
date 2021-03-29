import { TestCase } from "../../../testcase/TestCase";
import {Sorting} from "./Sorting";

export class FastNonDomSorting implements Sorting {
  /**
   * Sort the population using fast non-dominated sorting
   * @param population the population to sort
   * @returns {[]} the newly sorted population
   *
   * @author Dimitri Stallenberg and Annibale Panichella
   */
  sort(population: TestCase[]): TestCase[][] {
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
        for (const key of p.getEvaluation().keys()) {
          // TODO maybe add this
          // if (!q.getEvaluation().has(key)) {
          //     getLogger().debug("You cannot use fast non dominated sorting on individuals that have different objectives")
          //     process.exit(1)
          //     continue
          // }

          if (
              p.getEvaluation().get(key)! === 0 &&
              q.getEvaluation().get(key)! === 0
          ) {
            continue;
          }
          if (p.getEvaluation().get(key)! >= q.getEvaluation().get(key)!) {
            pDominatesQ = false;
          }

          if (p.getEvaluation().get(key)! <= q.getEvaluation().get(key)!) {
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
}

