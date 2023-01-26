import { ListenerInterface } from "../event/ListenerInterface";
import { Encoding } from "../search/Encoding";
import { SearchAlgorithm } from "../search/metaheuristics/SearchAlgorithm";
import { ObjectiveManager } from "../search/objective/managers/ObjectiveManager";
import { PluginManager } from "./PluginManager";

export interface PluginInterface<T extends Encoding> {
  name: string;
  register(pluginManager: PluginManager<T>): void;
  // TODO
  // configure()
}

export interface ListenerPlugin<T extends Encoding> extends PluginInterface<T> {
  createListener(): ListenerInterface<T>;
}

export interface SearchAlgorithmPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createSearchAlgorithm(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface CrossoverPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createCrossoverOperator(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface RankingPlugin<T extends Encoding> extends PluginInterface<T> {
  createRankingOperator(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface SelectionPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createSelectionOperator(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface SamplerPlugin<T extends Encoding> extends PluginInterface<T> {
  createSampler(objectiveManager: ObjectiveManager<T>): SearchAlgorithm<T>;
}

export interface TerminationPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createTerminationCriteria(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface ObjectiveManagerPlugin<T extends Encoding>
  extends PluginInterface<T> {
  createObjectiveManager(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}

export interface UserInterfacePlugin<T extends Encoding>
  extends PluginInterface<T> {
  createUserInterface(
    objectiveManager: ObjectiveManager<T>
  ): SearchAlgorithm<T>;
}
