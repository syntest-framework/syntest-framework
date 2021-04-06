import { Encoding } from "./Encoding";

/**
 * Sampler for encodings.
 *
 * @author Mitchell Olsthoorn
 */
export interface EncodingSampler<T extends Encoding> {
  /**
   * Sample an encoding.
   */
  sample(): T;
}
