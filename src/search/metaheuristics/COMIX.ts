// import { GeneticAlgorithm } from "./GeneticAlgorithm";
// import { TestCase } from "../..";
// import { MultiGA } from "./MultiGA";
//
// export class COMIX<T extends GeneticAlgorithm> extends MultiGA<T> {
//   async multiGeneration(): Promise<void> {
//     // pick champions
//     const champions: TestCase[] = [];
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
