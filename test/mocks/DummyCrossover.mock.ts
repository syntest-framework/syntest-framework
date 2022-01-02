import { Crossover } from "../../src";
import { TestCaseMock } from "./TestCase.mock";

export class DummyCrossover implements Crossover<TestCaseMock> {
  crossOver(
    parentA: TestCaseMock,
    parentB: TestCaseMock
  ): TestCaseMock[] {
    return [parentA.copy(), parentB.copy()];
  }
}
