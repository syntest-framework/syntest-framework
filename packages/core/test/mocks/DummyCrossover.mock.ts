import { Crossover } from "../../lib";
import { minimumValue } from "../../lib/Diagnostics";
import { DummyEncodingMock } from "./DummyEncoding.mock";

export class DummyCrossover implements Crossover<DummyEncodingMock> {
  crossOver(parents: DummyEncodingMock[]): DummyEncodingMock[] {
    if (parents.length < 2) {
      throw new Error(minimumValue("number of parents", 2, parents.length));
    }
    return [parents[0].copy(), parents[1].copy()];
  }
}
