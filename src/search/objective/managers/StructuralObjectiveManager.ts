import { ObjectiveManager } from "./ObjectiveManager";
import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { EncodingRunner } from "../../EncodingRunner";

/**
 * Objective manager that only evaluates an encoding on currently reachable objectives.
 *
 * @author Mitchell Olsthoorn
 */
export class StructuralObjectiveManager<
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

      // Add the child objectives to the current objectives
      this._subject
        .getChildObjectives(objectiveFunction)
        .forEach((objective) => {
          if (
            !this._coveredObjectives.has(objective) &&
            !this._currentObjectives.has(objective)
          )
            this._currentObjectives.add(objective);
        });
    }
  }

  /**
   * @inheritDoc
   */
  load(subject: SearchSubject<T>): void {
    // Set the subject
    this._subject = subject;

    // TODO: Reset the objective manager
    const objectives = subject.getObjectives();

    // Add all objectives to the uncovered objectives
    objectives.forEach((objective) => this._uncoveredObjectives.add(objective));

    // Set the current objectives
    const rootObjectiveNodes = this._subject.cfg.nodes.filter(
      (node) => node.absoluteRoot === true
    );
    const rootObjectiveIds = rootObjectiveNodes.map(
      (objective) => objective.id
    );
    let rootObjectives = [];
    for (const id of rootObjectiveIds) {
      rootObjectives = rootObjectives.concat(
        this._subject
          .getObjectives()
          .filter((objective) => objective.getIdentifier() === id)
      );
    }

    rootObjectives.forEach((objective) =>
      this._currentObjectives.add(objective)
    );
  }
}
