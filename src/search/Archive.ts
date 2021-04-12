import { Encoding } from "./Encoding";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";

/**
 * Archive of covered objectives with the fittest encoding for that objective.
 *
 * @author Mitchell Olsthoorn
 */
export class Archive<T extends Encoding> {
  /**
   * Mapping of objective to encoding.
   *
   * @protected
   */
  protected _map: Map<ObjectiveFunction<T>, T>;

  /**
   * Constructor.
   *
   * Initializes the map.
   */
  constructor() {
    this._map = new Map<ObjectiveFunction<T>, T>();
  }

  /**
   * Determines if the archive already contains this objective function.
   *
   * @param objectiveFunction The objective function to check for
   */
  has(objectiveFunction: ObjectiveFunction<T>): boolean {
    return this._map.has(objectiveFunction);
  }

  /**
   * Updates a mapping in the archive.
   *
   * @param objectiveFunction The objective to update
   * @param encoding The corresponding encoding
   */
  update(objectiveFunction: ObjectiveFunction<T>, encoding: T): void {
    if (this._map.has(objectiveFunction)){
       // if the objective is in the archive we save the shortest test
      const oldTest = this._map.get(objectiveFunction);
      if (oldTest.getLength() > encoding.getLength())
        this._map.set(objectiveFunction, encoding);
    } else {
      this._map.set(objectiveFunction, encoding);
    }
  }

  /**
   * Return the objective functions associated with the stored encodings.
   */
  getObjectives(): ObjectiveFunction<T>[] {
    return Array.from(this._map.keys());
  }

  /**
   * Return the encoding corresponding with the objective function.
   *
   * @param objective The objective to use.
   */
  getEncoding(objective: ObjectiveFunction<T>): Encoding {
    return this._map.get(objective);
  }
}
