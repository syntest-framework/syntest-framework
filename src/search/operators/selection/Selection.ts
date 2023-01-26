import { Encoding } from "../../Encoding";

export interface Selection<T extends Encoding> {
  select(population: T[]);
}
