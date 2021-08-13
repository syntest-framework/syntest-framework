import { AbstractTestCase, SearchSubject } from "../../src";
import { Crossover } from "../../src";

export class DummyCrossover extends Crossover {
  crossOver(
    parentA: AbstractTestCase,
    parentB: AbstractTestCase
  ): AbstractTestCase[] {
    return [parentA.copy(), parentB.copy()];
  }
}