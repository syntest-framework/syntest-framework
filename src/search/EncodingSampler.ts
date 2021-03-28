import { Encoding } from "./Encoding";

/**
 * Sampler for encodings.
 */
export interface EncodingSampler<T extends Encoding<T>> {
  /**
   * Sample an encoding.
   */
  sample(): T;
}
