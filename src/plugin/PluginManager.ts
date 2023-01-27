import { EventManager } from "../event/EventManager";
import { Encoding } from "../search/Encoding";
import { CrossoverPlugin } from "./CrossoverPlugin";
import { ListenerPlugin } from "./ListenerPlugin";
import { ObjectiveManagerPlugin } from "./ObjectiveManagerPlugin";
import { PluginInterface } from "./PluginInterface";
import { RankingPlugin } from "./RankingPlugin";
import { SamplerPlugin } from "./SamplerPlugin";
import { SearchAlgorithmPlugin } from "./SearchAlgorithmPlugin";
import { SelectionPlugin } from "./SelectionPlugin";
import { TerminationPlugin } from "./TerminationPlugin";
import { UserInterfacePlugin } from "./UserInterfacePlugin";
import Yargs = require("yargs");

export class PluginManager<T extends Encoding> {
  private plugins: PluginInterface<T>[];
  private _listenerPlugins: Map<string, ListenerPlugin<T>>;
  private _searchAlgorithmPlugins: Map<string, SearchAlgorithmPlugin<T>>;
  private _crossoverPlugins: Map<string, CrossoverPlugin<T>>;
  private _rankingPlugins: Map<string, RankingPlugin<T>>;
  private _selectionPlugins: Map<string, SelectionPlugin<T>>;
  private _samplerPlugins: Map<string, SamplerPlugin<T>>;
  private _terminationPlugins: Map<string, TerminationPlugin<T>>;
  private _objectiveManagerPlugins: Map<string, ObjectiveManagerPlugin<T>>;
  private _userInterfacePlugins: Map<string, UserInterfacePlugin<T>>;

  constructor() {
    this.plugins = [];
    this._listenerPlugins = new Map();
    this._searchAlgorithmPlugins = new Map();
    this._crossoverPlugins = new Map();
    this._rankingPlugins = new Map();
    this._selectionPlugins = new Map();
    this._samplerPlugins = new Map();
    this._terminationPlugins = new Map();
    this._objectiveManagerPlugins = new Map();
    this._userInterfacePlugins = new Map();
  }

  get listenerPlugins() {
    return this._listenerPlugins;
  }

  get searchAlgorithmPlugins() {
    return this._searchAlgorithmPlugins;
  }

  get crossoverPlugins() {
    return this._crossoverPlugins;
  }

  get rankingPlugins() {
    return this._rankingPlugins;
  }

  get selectionPlugins() {
    return this._selectionPlugins;
  }

  get samplerPlugins() {
    return this._samplerPlugins;
  }

  get terminationPlugins() {
    return this._terminationPlugins;
  }

  get objectiveManagerPlugins() {
    return this._objectiveManagerPlugins;
  }

  get userInterfacePlugins() {
    return this._userInterfacePlugins;
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const { plugin } = await import(pluginPath);
      const pluginInstance: PluginInterface<T> = new plugin.default();

      if (!pluginInstance.register) {
        throw new Error(
          `Could not load plugin\nPlugin has no register function\nPlugin: ${pluginPath}`
        );
      }

      pluginInstance.register(this);
      this.plugins.push(pluginInstance);
    } catch (e) {
      console.trace(e);
    }
  }

  async addPluginOptions<Y>(yargs: Yargs.Argv<Y>) {
    for (const plugin of this.plugins) {
      if (plugin.configure) {
        yargs = await plugin.configure(yargs);
      }
    }
    return yargs;
  }

  async registerListener(plugin: ListenerPlugin<T>): Promise<void> {
    this.listenerPlugins.set(plugin.name, plugin);
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
