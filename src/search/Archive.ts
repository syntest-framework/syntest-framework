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
    this._map.set(objectiveFunction, encoding);
  }

  getObjectives(): ObjectiveFunction<T>[] {
    return Array.from(this._map.keys());
  }

  getEncoding(objective: ObjectiveFunction<T>): Encoding {
    return this._map.get(objective);
  }
}
