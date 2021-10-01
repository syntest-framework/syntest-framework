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
   * The size of the archive.
   */
  get size(): number {
    return this._map.size;
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

  /**
   * Merges the given archive into this archive.
   *
   * When there is overlap in the archives the current one will be overriden.
   * WARNING: this function does thus not use the secondary objectives to select the optimal solution.
   * TODO use the secondary objectives in this function
   *
   * @param other the other archive
   */
  merge(other: Archive<T>): void {
    for (const key of other.getObjectives()) {
      this.update(key, other.getEncoding(key));
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
  getEncoding(objective: ObjectiveFunction<T>): T {
    return this._map.get(objective);
  }
}
