import { ExecutionResult } from "./ExecutionResult";
import { Encoding } from "./Encoding";

/**
 * @author Mitchell Olsthoorn
 */
export interface EncodingRunner<T extends Encoding<T>> {
  /**
   * execute the encoding.
   */
  execute(encoding: T): Promise<ExecutionResult>;
}
