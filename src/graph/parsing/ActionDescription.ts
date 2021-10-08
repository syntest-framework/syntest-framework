import { Visibility } from "./Visibility";

/**
 * Interface for a Action Description.
 *
 * @author Dimitri Stallenberg
 */
export interface ActionDescription {
  /**
   * Name of the action
   */
  name: string;

  /**
   * The type of action
   */
  type: string;

  /**
   * Visibility of the action.
   */
  visibility: Visibility;
}
