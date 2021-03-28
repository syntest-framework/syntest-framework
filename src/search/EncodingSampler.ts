import { Encoding } from "./Encoding";

/**
 * Sampler for encodings.
 */
export interface EncodingSampler<T extends Encoding> {
  /**
   * Sample an encoding.
   */
  sample(): T;
}
