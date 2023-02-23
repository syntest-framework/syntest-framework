import { TerminationPlugin } from "../../plugin/TerminationPlugin";
import { Encoding, SignalTerminationTrigger } from "@syntest/core";

/**
 * Factory plugin for SignalTerminationTrigger
 *
 * @author Dimitri Stallenberg
 */
export class SignalTerminationTriggerFactory<T extends Encoding>
  implements TerminationPlugin<T>
{
  name = "signal";
  type: "Termination Trigger";

  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createTerminationTrigger(): SignalTerminationTrigger {
    return new SignalTerminationTrigger();
  }
}
