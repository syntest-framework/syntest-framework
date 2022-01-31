import { Crossover } from "../../src";
import { DummyEncodingMock } from "./DummyEncoding.mock";

export class DummyCrossover implements Crossover<DummyEncodingMock> {
  crossOver(parentA: DummyEncodingMock, parentB: DummyEncodingMock): DummyEncodingMock[] {
    return [parentA.copy(), parentB.copy()];
  }
}
