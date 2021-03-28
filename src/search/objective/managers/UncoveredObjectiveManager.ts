import { ObjectiveManager } from "./ObjectiveManager";
import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { EncodingRunner } from "../../EncodingRunner";

export class UncoveredObjectiveManager<
  T extends Encoding
> extends ObjectiveManager<T> {
  constructor(runner: EncodingRunner<T>) {
    super(runner);
  }

  protected _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
    distance: number
  ): void {
    if (distance === 0.0) {
      this._uncoveredObjectives.delete(objectiveFunction);

      this._currentObjectives.delete(objectiveFunction);

      this._coveredObjectives.add(objectiveFunction);
      if (!this._archive.has(objectiveFunction)) {
        this._archive.update(objectiveFunction, encoding);
      } else {
      }
    }
  }

  public load(subject: SearchSubject<T>): void {
    const objectives = subject.getObjectives();
    objectives.forEach((objective) => {
      this._uncoveredObjectives.add(objective);
      this._currentObjectives.add(objective);
    });
  }
}
