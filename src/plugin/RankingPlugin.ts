import { Encoding } from "..";
import { Ranking } from "../search/operators/ranking/Ranking";
import { PluginInterface } from "./PluginInterface";

export type RankingOptions<T extends Encoding> = unknown;

export interface RankingPlugin<T extends Encoding> extends PluginInterface<T> {
  createRankingOperator<O extends RankingOptions<T>>(options: O): Ranking<T>;
}
