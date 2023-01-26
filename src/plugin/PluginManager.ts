import { EventManager } from "../event/EventManager";
import { Encoding } from "../search/Encoding";
import {
  CrossoverPlugin,
  ListenerPlugin,
  ObjectiveManagerPlugin,
  PluginInterface,
  RankingPlugin,
  SamplerPlugin,
  SearchAlgorithmPlugin,
  SelectionPlugin,
  TerminationPlugin,
  UserInterfacePlugin,
} from "./PluginInterface";

export class PluginManager<T extends Encoding> {
  private eventManager: EventManager<T>;

  private listenerPlugins: Map<string, ListenerPlugin<T>>;
  private searchAlgorithmPlugins: Map<string, SearchAlgorithmPlugin<T>>;
  private crossoverPlugins: Map<string, CrossoverPlugin<T>>;
  private rankingPlugins: Map<string, RankingPlugin<T>>;
  private selectionPlugins: Map<string, SelectionPlugin<T>>;
  private samplerPlugins: Map<string, SamplerPlugin<T>>;
  private terminationPlugins: Map<string, TerminationPlugin<T>>;
  private objectiveManagerPlugins: Map<string, ObjectiveManagerPlugin<T>>;
  private userInterfacePlugins: Map<string, UserInterfacePlugin<T>>;

  constructor(eventManager: EventManager<T>) {
    this.eventManager = eventManager;
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const { plugin } = await import(pluginPath);
      const pluginInstance = <SearchAlgorithmPlugin<T>>new plugin.default();
      pluginInstance.register(this);
    } catch (e) {
      console.trace(e);
    }
  }

  async registerListener(plugin: ListenerPlugin<T>): Promise<void> {
    this.listenerPlugins.set(plugin.name, plugin);

    this.eventManager.registerListener(plugin.createListener());
  }

  async registerSearchAlgorithm(
    plugin: SearchAlgorithmPlugin<T>
  ): Promise<void> {
    this.searchAlgorithmPlugins.set(plugin.name, plugin);
  }

  async registerCrossover(plugin: CrossoverPlugin<T>): Promise<void> {
    this.crossoverPlugins.set(plugin.name, plugin);
  }

  async registerRanking(plugin: RankingPlugin<T>): Promise<void> {
    this.rankingPlugins.set(plugin.name, plugin);
  }

  async registerSelection(plugin: SelectionPlugin<T>): Promise<void> {
    this.selectionPlugins.set(plugin.name, plugin);
  }

  async registerSampler(plugin: SamplerPlugin<T>): Promise<void> {
    this.samplerPlugins.set(plugin.name, plugin);
  }

  async registerTermination(plugin: TerminationPlugin<T>): Promise<void> {
    this.terminationPlugins.set(plugin.name, plugin);
  }

  async registerObjectiveManager(
    plugin: ObjectiveManagerPlugin<T>
  ): Promise<void> {
    this.objectiveManagerPlugins.set(plugin.name, plugin);
  }

  async registerUserInterface(plugin: UserInterfacePlugin<T>): Promise<void> {
    this.userInterfacePlugins.set(plugin.name, plugin);
  }
}
