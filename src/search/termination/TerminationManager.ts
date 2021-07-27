import { TerminationTrigger } from "./TerminationTrigger";

/**
 * Manager for the termination triggers of the search process.
 *
 * Keeps track if any of the termination triggers have been triggered.
 *
 * @author Mitchell Olsthoorn
 */
export class TerminationManager implements TerminationTrigger {
  /**
   * List of currently active termination triggers.
   * @protected
   */
  protected _terminationTriggers: TerminationTrigger[];

  constructor() {
    this._terminationTriggers = [];
  }

  /**
   * @inheritDoc
   */
  isTriggered(): boolean {
    return !this._terminationTriggers.every(
      (trigger) => !trigger.isTriggered()
    );
  }

  /**
   * Add trigger to the list of active termination triggers.
   *
   * @param trigger The trigger to add
   */
  public addTrigger(trigger: TerminationTrigger): TerminationManager {
    this._terminationTriggers.push(trigger);
    return this;
  }

  /**
   * Remove trigger from the list of active termination triggers.
   *
   * @param trigger The trigger to remove
   */
  public removeTrigger(trigger: TerminationTrigger): TerminationManager {
    this._terminationTriggers.slice(
      this._terminationTriggers.indexOf(trigger),
      1
    );
    return this;
  }
}
