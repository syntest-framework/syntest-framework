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
  private _listeners: Map<string, ListenerPlugin<T>>;
  private _searchAlgorithms: Map<string, SearchAlgorithmPlugin<T>>;
  private _crossoverOperators: Map<string, CrossoverPlugin<T>>;
  private _samplers: Map<string, SamplerPlugin<T>>;
  private _terminationTriggers: Map<string, TerminationPlugin<T>>;
  private _objectiveManagers: Map<string, ObjectiveManagerPlugin<T>>;
  private _userInterfaces: Map<string, UserInterfacePlugin<T>>;

  constructor() {
    this._listeners = new Map();
    this._searchAlgorithms = new Map();
    this._crossoverOperators = new Map();
    this._samplers = new Map();
    this._terminationTriggers = new Map();
    this._objectiveManagers = new Map();
    this._userInterfaces = new Map();
  }

  get listeners() {
    return this._listeners;
  }

  get searchAlgorithms() {
    return this._searchAlgorithms;
  }

  get crossoverOperators() {
    return this._crossoverOperators;
  }

  get samplers() {
    return this._samplers;
  }

  get terminationTriggers() {
    return this._terminationTriggers;
  }

  get objectiveManagers() {
    return this._objectiveManagers;
  }

  get userInterfaces() {
    return this._userInterfaces;
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
    yargs = await this._addPluginOptionsSpecific(yargs, this._listeners);
    yargs = await this._addPluginOptionsSpecific(yargs, this._searchAlgorithms);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._crossoverOperators
    );
    yargs = await this._addPluginOptionsSpecific(yargs, this._samplers);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._terminationTriggers
    );
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._objectiveManagers
    );
    yargs = await this._addPluginOptionsSpecific(yargs, this._userInterfaces);

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
          yargs = yargs.option(`${plugin.name}-${option}`, options.get(option));
        }
      }
    }
    return yargs;
  }

  async registerListener(plugin: ListenerPlugin<T>): Promise<void> {
    this.listeners.set(plugin.name, plugin);
  }

  async registerSearchAlgorithm(
    plugin: SearchAlgorithmPlugin<T>
  ): Promise<void> {
    this.searchAlgorithms.set(plugin.name, plugin);
  }

  async registerCrossover(plugin: CrossoverPlugin<T>): Promise<void> {
    this.crossoverOperators.set(plugin.name, plugin);
  }

  async registerSampler(plugin: SamplerPlugin<T>): Promise<void> {
    this.samplers.set(plugin.name, plugin);
  }

  async registerTermination(plugin: TerminationPlugin<T>): Promise<void> {
    this.terminationTriggers.set(plugin.name, plugin);
  }

  async registerObjectiveManager(
    plugin: ObjectiveManagerPlugin<T>
  ): Promise<void> {
    this.objectiveManagers.set(plugin.name, plugin);
  }

  async registerUserInterface(plugin: UserInterfacePlugin<T>): Promise<void> {
    this.userInterfaces.set(plugin.name, plugin);
  }
}
