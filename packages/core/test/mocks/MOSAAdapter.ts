import { MOSAFamily } from "../../lib/search/metaheuristics/evolutionary/MOSAFamily";
import { DummySearchSubject } from "./DummySubject.mock";
import { Encoding } from "../../lib/search/Encoding";

export class MockedMOSA<T extends Encoding> extends MOSAFamily<T> {
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
