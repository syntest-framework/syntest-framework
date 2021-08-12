import { TerminationTrigger } from "./TerminationTrigger";

/**
 * Termination trigger for interrupt signals.
 *
 * @author Mitchell Olsthoorn
 */
export class SignalTerminationTrigger implements TerminationTrigger {
  protected _triggered: boolean;

  constructor() {
    this._triggered = false;
    process.on("SIGINT", this.handle);
    process.on("SIGTERM", this.handle);
    process.on("SIGQUIT", this.handle);
  }

  /**
   * Handle the interrupt signal.
   *
   * @param signal the type of signal
   */
  public handle(signal: string): void {
    // TODO: use framework logger
    console.log(
      `Received ${signal}. Stopping search. Press Control-D to exit.`
    );
    this._triggered = true;
  }

  /**
   * @inheritDoc
   */
  public isTriggered(): boolean {
    return this._triggered;
  }
}
