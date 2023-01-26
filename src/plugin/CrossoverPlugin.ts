import { Crossover, Encoding } from "..";
import { PluginInterface } from "./PluginInterface";

export type CrossoverOptions<T extends Encoding> = unknown;

export interface CrossoverPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createCrossoverOperator<O extends CrossoverOptions<T>>(
    options: O
  ): Crossover<T>;
}
