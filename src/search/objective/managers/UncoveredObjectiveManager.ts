import { ObjectiveManager } from "./ObjectiveManager";
import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { EncodingRunner } from "../../EncodingRunner";

/**
 * Objective manager that only evaluates an encoding on uncovered objectives.
 *
 * @author Mitchell Olsthoorn
 */
export class UncoveredObjectiveManager<
  T extends Encoding
> extends ObjectiveManager<T> {
  /**
   * Constructor.
   *
   * @param runner Encoding runner
   */
  constructor(runner: EncodingRunner<T>) {
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
    if (distance === 0.0) {
      // Remove objective from the current and uncovered objectives
      this._uncoveredObjectives.delete(objectiveFunction);
      this._currentObjectives.delete(objectiveFunction);

      // Add objective to the covered objectives and update the archive
      this._coveredObjectives.add(objectiveFunction);
      if (!this._archive.has(objectiveFunction)) {
        this._archive.update(objectiveFunction, encoding);
      } else {
        // If the objective is already in the archive we save the shortest encoding
        const currentEncoding = this._archive.getEncoding(objectiveFunction);
        if (currentEncoding.getLength() > encoding.getLength())
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
