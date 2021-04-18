import { ExecutionResult } from "./ExecutionResult";
import { Encoding } from "./Encoding";
import {SearchSubject} from "./SearchSubject";

/**
 * @author Mitchell Olsthoorn
 */
export interface EncodingRunner<T extends Encoding> {
  /**
   * execute the encoding.
   */
  execute(subject: SearchSubject<T>, encoding: T): Promise<ExecutionResult>;
}
