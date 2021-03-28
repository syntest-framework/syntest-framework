import { Encoding } from "../Encoding";

/**
 * Function that models the objective.
 */
export interface ObjectiveFunction<T extends Encoding> {
  /**
   * Calculate distance from the objective to an encoding.
   *
   * @param encoding Encoding
   */
  calculateDistance(encoding: T): number;

  /**
   * Return the identifier of the objective.
   */
  getIdentifier(): string;
}
