import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

export interface Ranking<T extends Encoding> {
  rank(population: T[], objectiveFunctions: Set<ObjectiveFunction<T>>);
}
