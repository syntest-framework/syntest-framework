import { ObjectiveManager } from "./ObjectiveManager";
import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { EncodingRunner } from "../../EncodingRunner";

/**
 * A simple objective manager that always evaluates an encoding on all objectives.
 *
 * @author Mitchell Olsthoorn
 */
export class SimpleObjectiveManager<
  T extends Encoding
> extends ObjectiveManager<T> {
  /**
   * Constructor.
   *
   * @param runner Encoding runner
   */
  public constructor(runner: EncodingRunner<T>) {
    super(runner);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
    distance: number
  ): void {
    // When objective is covered update objectives
    if (distance === 0.0) {
      // Remove objective from the uncovered objectives
      this._uncoveredObjectives.delete(objectiveFunction);

      // Add objective to the covered objectives and update the archive
      this._coveredObjectives.add(objectiveFunction);
      if (!this._archive.has(objectiveFunction)) {
        this._archive.update(objectiveFunction, encoding);
      }
    }
  }

  /**
   * @inheritDoc
   */
  public load(subject: SearchSubject<T>): void {
    // TODO: Reset the objective manager
    const objectives = subject.getObjectives();

    objectives.forEach((objective) => {
      // Add all objectives to both the uncovered objectives and the current objectives
      this._uncoveredObjectives.add(objective);
      this._currentObjectives.add(objective);
    });
  }
}
