import { EventManager } from "../event/EventManager";
import { Encoding } from "../search/Encoding";
import { CrossoverPlugin } from "./CrossoverPlugin";
import { ListenerPlugin } from "./ListenerPlugin";
import { ObjectiveManagerPlugin } from "./ObjectiveManagerPlugin";
import { PluginInterface } from "./PluginInterface";
import { SamplerPlugin } from "./SamplerPlugin";
import { SearchAlgorithmPlugin } from "./SearchAlgorithmPlugin";
import { TerminationPlugin } from "./TerminationPlugin";
import { UserInterfacePlugin } from "./UserInterfacePlugin";
import Yargs = require("yargs");

export class PluginManager<T extends Encoding> {
  private _listenerPlugins: Map<string, ListenerPlugin<T>>;
  private _searchAlgorithmPlugins: Map<string, SearchAlgorithmPlugin<T>>;
  private _crossoverPlugins: Map<string, CrossoverPlugin<T>>;
  private _samplerPlugins: Map<string, SamplerPlugin<T>>;
  private _terminationPlugins: Map<string, TerminationPlugin<T>>;
  private _objectiveManagerPlugins: Map<string, ObjectiveManagerPlugin<T>>;
  private _userInterfacePlugins: Map<string, UserInterfacePlugin<T>>;

  constructor() {
    this._listenerPlugins = new Map();
    this._searchAlgorithmPlugins = new Map();
    this._crossoverPlugins = new Map();
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
    } catch (e) {
      console.trace(e);
    }
  }

  async addPluginOptions<Y>(yargs: Yargs.Argv<Y>) {
    yargs = await this._addPluginOptionsSpecific(yargs, this._listenerPlugins);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._searchAlgorithmPlugins
    );
    yargs = await this._addPluginOptionsSpecific(yargs, this._crossoverPlugins);
    yargs = await this._addPluginOptionsSpecific(yargs, this._samplerPlugins);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._terminationPlugins
    );
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._objectiveManagerPlugins
    );
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._userInterfacePlugins
    );

    return yargs;
  }

  private async _addPluginOptionsSpecific<Y, X extends PluginInterface<T>>(
    yargs: Yargs.Argv<Y>,
    plugins: Map<string, X>
  ) {
    for (const plugin of plugins.values()) {
      if (plugin.getConfig) {
        const options = await plugin.getConfig();

        for (const option of options.keys()) {
          yargs = yargs.option(option, options.get(option));
        }
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
