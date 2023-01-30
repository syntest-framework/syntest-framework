import { MOSA } from "../../src/search/metaheuristics/evolutionary/MOSAFamily";
import { DummySearchSubject } from "./DummySubject.mock";
import { Encoding } from "../../src/search/Encoding";

export class MockedMOSA<T extends Encoding> extends MOSA<T> {
  setPopulation(population: T[], size: number) {
    this._populationSize = size;
    population.forEach((test) => this._population.push(test));
  }

  getPopulation(): T[] {
    return this._population;
  }

  public environmentalSelection(size: number): void {
    super._environmentalSelection(size);
  }

  public updateObjectives(subject: DummySearchSubject<T>) {
    this._objectiveManager.load(subject);
  }
}
