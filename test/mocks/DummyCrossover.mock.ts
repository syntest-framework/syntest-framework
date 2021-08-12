import { AbstractTestCase, SearchSubject } from "../../src";
import { AbstractTreeCrossover } from "../../src";

export class DummyCrossover extends AbstractTreeCrossover {
  crossOver(
    parentA: AbstractTestCase,
    parentB: AbstractTestCase
  ): AbstractTestCase[] {
    return [parentA.copy(), parentB.copy()];
  }
}
