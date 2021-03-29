import { prng, TestCase, Selection } from "../../..";

export class TournamentSelection implements Selection  {
  private tournamentSize: number;

  /**
   * Constructor
   * @param tournamentSize size of the tournament (minimum 2)
   */
  constructor(tournamentSize: number) {
    if (tournamentSize < 2)
      throw new Error("The tournament size should be greater than 1 ");

    this.tournamentSize = tournamentSize
  }

  /**
   * This function selects the individual for reproduction using tournament selection
   * @param population the population from which to select a parent
   * @returns TestCase selected individual
   *
   * @author Annibale Panichella
   */
  select(population: TestCase[]): TestCase[] {
    let winner = prng.pickOne(population);

    for (let tournament = 0; tournament < this.tournamentSize - 1; tournament++) {
      const solution = prng.pickOne(population);

      // the winner is the solution with the best (smaller) non-dominance rank
      if (solution.getRank() < winner.getRank()) winner = solution;

      // At the same level or ranking, the winner is the solution with the best (largest)
      // crowding distance
      if (solution.getCrowdingDistance() > winner.getCrowdingDistance())
        winner = solution;
    }

    return [winner];
  }
}
