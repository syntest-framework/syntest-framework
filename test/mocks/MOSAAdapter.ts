import { MOSA } from "../../src/search/metaheuristics/evolutionary/mosa/MOSA";
import { TestCase } from "../../src/testcase/TestCase";
import { DummySearchSubject } from "./DummySubject.mock";

export class MockedMOSA extends MOSA {
  setPopulation(population: TestCase[], size: number) {
    this._populationSize = size;
    population.forEach((test) => this._population.push(test));
  }

  getPopulation(): TestCase[] {
    return this._population;
  }

  public environmentalSelection(size: number): void {
    super._environmentalSelection(size);
  }

  public updateObjectives(subject: DummySearchSubject) {
    this._objectiveManager.load(subject);
  }
}
