/**
 * Interface for a termination trigger that stops the search process.
 *
 * @author Mitchell Olsthoorn
 */
export interface TerminationTrigger {
  /**
   * Return if the termination trigger has been triggered.
   */
  isTriggered(): boolean;
}
