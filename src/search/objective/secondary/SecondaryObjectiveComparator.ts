import { Encoding } from "../../Encoding";

export interface SecondaryObjectiveComparator<T extends Encoding> {
  compare(encoding1: Encoding, encoding2: Encoding): number;
}
