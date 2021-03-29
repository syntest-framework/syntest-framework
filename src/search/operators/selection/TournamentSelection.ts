import { prng, TestCase } from "../../..";
import { Selection } from "./Selection";

export class TournamentSelection implements Selection {
  get tournamentSize(): number {
    return this._tournamentSize;
  }

  set tournamentSize(value: number) {
    this._tournamentSize = value;
  }

  private _tournamentSize: number = 4;

  /**
   * This function selects the test cases using tournament selection
   * @param population the population from which to select a parent
   * @param amount the number of testcases to select
   * @returns TestCase selected individual
   *
   * @author Annibale Panichella
   */
  select(population: TestCase[], amount: number): TestCase[] {
    let selection = []

    for (let i = 0; i < amount; i++) {
      let winner = prng.pickOne(population);

      for (let tournament = 0; tournament < this._tournamentSize - 1; tournament++) {
        const solution = prng.pickOne(population);

        // the winner is the solution with the best (smaller) non-dominance rank
        if (solution.getRank() < winner.getRank()) winner = solution;

        // At the same level or ranking, the winner is the solution with the best (largest)
        // crowding distance
        if (solution.getCrowdingDistance() > winner.getCrowdingDistance())
          winner = solution;
      }

      selection.push(winner)
    }

    return selection;
  }
}
