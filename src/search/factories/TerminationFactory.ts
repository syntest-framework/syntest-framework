import { TerminationManager } from "../termination/TerminationManager";
import { SignalTerminationTrigger } from "../termination/SignalTerminationTrigger";

/**
 * Function to set up the termination manager.
 *
 * @author Mitchell Olsthoorn
 */
export function configureTermination(): TerminationManager {
  const terminationManager = new TerminationManager();

  // TODO: make triggers configurable
  const signalTerminationTrigger = new SignalTerminationTrigger();
  terminationManager.addTrigger(signalTerminationTrigger);

  return terminationManager;
}
