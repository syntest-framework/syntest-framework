/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// import {
//   Fitness,
//   GeneticAlgorithm,
//   getLogger,
//   Objective,
//   TestCaseSampler,
//   AbstractTestCase,
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
//     getUserInterface().info("Initial population created");
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
//     getUserInterface().info(
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
//       getUserInterface().info(
//         `Generation: ${this.currentGeneration} done after ${
//           this.timePast / 1000
//         } seconds, current coverage: ${this.currentCoverage}`
//       );
//     }
//
//     getUserInterface().info(`The termination criteria have been satisfied.`);
//     getUserInterface().info(
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
//   public getFinalTestSuite(): Map<Objective, AbstractTestCase> {
//     const champions: Map<Objective, AbstractTestCase> = new Map<Objective, AbstractTestCase>();
//     for (const algorithm of this._subAlgorithms) {
//       for (const key of algorithm.getFinalTestSuite().keys()) {
//         champions.set(key, <AbstractTestCase>algorithm.getFinalTestSuite().get(key));
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
//   async generation(population: AbstractTestCase[]): Promise<AbstractTestCase[]> {
//     throw new Error(
//       "MultiGA's cannot use the generation function, use multiGeneration instead"
//     );
//   }
//
//   abstract multiGeneration(): Promise<void>;
// }
