import { MOSA } from "../../src/search/metaheuristics/evolutionary/mosa/MOSA";
import { AbstractTestCase } from "../../src/testcase/AbstractTestCase";
import { DummySearchSubject } from "./DummySubject.mock";

export class MockedMOSA extends MOSA {
  setPopulation(population: AbstractTestCase[], size: number) {
    this._populationSize = size;
    population.forEach((test) => this._population.push(test));
  }

  getPopulation(): AbstractTestCase[] {
    return this._population;
  }

  public environmentalSelection(size: number): void {
    super._environmentalSelection(size);
  }

  public updateObjectives(subject: DummySearchSubject) {
    this._objectiveManager.load(subject);
  }
}
