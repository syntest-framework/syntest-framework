import { Encoding } from "./Encoding";

export interface EncodingSampler<T extends Encoding<T>> {
  sample(): T;
}
