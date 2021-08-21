import { ActionDescription } from "./ActionDescription";
import { Parameter } from "./Parameter";

/**
 * Interface for a Function Description.
 *
 * @author Dimitri Stallenberg
 */
export interface FunctionDescription extends ActionDescription {
  /**
   * If the function is a constructor.
   */
  isConstructor: boolean;

  /**
   * Parameters of the function.
   */
  parameters: Parameter[];

  /**
   * Return parameters of the function
   */
  returnParameters: Parameter[];
}
