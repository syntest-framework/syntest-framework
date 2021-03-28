// import {
//   Fitness,
//   GeneticAlgorithm,
//   getLogger,
//   Objective,
//   TestCaseSampler,
//   TestCase,
// } from "../..";
// import { Target } from "../objective/Target";
//
// /**
//  * Genetic Algorithm BaseClass
//  *
//  * @author Dimitri Stallenberg
//  */
// export abstract class MultiGA<
//   T extends GeneticAlgorithm
// > extends GeneticAlgorithm {
//   get subAlgorithms(): GeneticAlgorithm[] {
//     return this._subAlgorithms;
//   }
//
//   set subAlgorithms(value: GeneticAlgorithm[]) {
//     this._subAlgorithms = value;
//   }
//
//   private _subAlgorithms: GeneticAlgorithm[];
//
//   /**
//    * Constructor
//    * @param targets
//    * @param fitness the fitness object
//    * @param sampler the sampler object
//    * @param GAtype the class of the sub algorithms to run (cannot be a MultiGA)
//    */
//   constructor(
//     targets: Target[],
//     fitness: Fitness,
//     sampler: TestCaseSampler,
//     GAtype: {
//       new (
//         target: Target,
//         fitness: Fitness,
//         sampler: TestCaseSampler
//       ): GeneticAlgorithm;
//     }
//   ) {
//     super(targets[0], fitness, sampler);
//
//     this._subAlgorithms = [];
//
//     for (const target of targets) {
//       const ga: GeneticAlgorithm = new GAtype(target, fitness, sampler);
//
//       this._subAlgorithms.push(ga);
//     }
//   }
//
//   /**
//    * The main search function which performs a certain amount of generations and writes the resulting test-suite to the folder.
//    *
//    * @param terminationCriteriaMet the function that decides whether the genetic algorithm is done or not
//    */
//   async search(
//     terminationCriteriaMet: (algorithmInstance: GeneticAlgorithm) => boolean
//   ) {
//     for (const algorithm of this.subAlgorithms) {
//       algorithm.population = algorithm.createInitialPopulation();
//     }
//     getLogger().info("Initial population created");
//
//     for (const algorithm of this.subAlgorithms) {
//       await algorithm.fitness.evaluateMany(
//         algorithm.population,
//         algorithm.objectives
//       );
//     }
//
//     this.currentGeneration = 0;
//     this.startTime = Date.now();
//
//     getLogger().info(
//       `Search process started at ${new Date(
//         this.startTime
//       ).toLocaleTimeString()}`
//     );
//
//     while (!terminationCriteriaMet(this)) {
//       await this.multiGeneration();
//
//       this.currentGeneration += 1;
//       this.timePast = Date.now() - this.startTime;
//       this.currentCoverage = this.getCurrentCoverage();
//       getLogger().info(
//         `Generation: ${this.currentGeneration} done after ${
//           this.timePast / 1000
//         } seconds, current coverage: ${this.currentCoverage}`
//       );
//     }
//
//     getLogger().info(`The termination criteria have been satisfied.`);
//     getLogger().info(
//       `Ending the search process at ${new Date(
//         Date.now()
//       ).toLocaleTimeString()}`
//     );
//     return this.getFinalTestSuite();
//   }
//
//   /**
//    * List of test cases that will for the final test suite
//    * @protected
//    */
//   public getFinalTestSuite(): Map<Objective, TestCase> {
//     const champions: Map<Objective, TestCase> = new Map<Objective, TestCase>();
//     for (const algorithm of this._subAlgorithms) {
//       for (const key of algorithm.getFinalTestSuite().keys()) {
//         champions.set(key, <TestCase>algorithm.getFinalTestSuite().get(key));
//       }
//     }
//     return champions;
//   }
//
//   /**
//    * The function to implement in child classes
//    *
//    * @param population the current population
//    * @returns {[]} the population of the next generation
//    */
//   async generation(population: TestCase[]): Promise<TestCase[]> {
//     throw new Error(
//       "MultiGA's cannot use the generation function, use multiGeneration instead"
//     );
//   }
//
//   abstract multiGeneration(): Promise<void>;
// }
