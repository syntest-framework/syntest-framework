import { Crossover } from "../../src";
import { DummyEncodingMock } from "./DummyEncoding.mock";

export class DummyCrossover implements Crossover<DummyEncodingMock> {
  crossOver(parents: DummyEncodingMock[]): DummyEncodingMock[] {
    if (parents.length < 2) {
      throw new Error("Expected atleast two parents!");
    }
    return [parents[0].copy(), parents[1].copy()];
  }
}
