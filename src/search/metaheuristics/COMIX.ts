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

// import { GeneticAlgorithm } from "./GeneticAlgorithm";
// import { AbstractTestCase } from "../..";
// import { MultiGA } from "./MultiGA";
//
// export class COMIX<T extends GeneticAlgorithm> extends MultiGA<T> {
//   async multiGeneration(): Promise<void> {
//     // pick champions
//     const champions: AbstractTestCase[] = [];
//     for (const algorithm of this.subAlgorithms) {
//       champions.push(algorithm.population[0]);
//     }
//
//     // migrate champions
//     for (const algorithm of this.subAlgorithms) {
//       algorithm.population.push(...champions);
//       // TODO might be able to parallelized
//       algorithm.population = await algorithm.generation(algorithm.population);
//     }
//   }
//
//   getCurrentCoverage(): number {
//     return 0; // TODO
//   }
// }
