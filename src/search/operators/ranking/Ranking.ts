import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

export interface Ranking<T extends Encoding> {
  rank(front: T[], objectiveFunctions: Set<ObjectiveFunction<T>>);
}
