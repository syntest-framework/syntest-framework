/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Encoding, UserInterface } from ".";
import { EventManager } from "./event/EventManager";

export abstract class Launcher<T extends Encoding> {
  private _eventManager: EventManager<T>;
  private _programName: string;
  private _ui: UserInterface;

  get eventManager() {
    return this._eventManager;
  }

  get programState() {
    return this.eventManager.state;
  }

  get programName() {
    return this._programName;
  }

  get ui() {
    return this._ui;
  }

  constructor(
    programName: string,
    eventManager: EventManager<T>,
    ui: UserInterface
  ) {
    this._programName = programName;
    this._eventManager = eventManager;
    this._ui = ui;
  }

  public async run(args: string[]): Promise<void> {
    try {
      await this.configure(args);
      this.eventManager.emitEvent("onInitializeStart");
      await this.initialize();
      this.eventManager.emitEvent("onInitializeComplete");
      this.eventManager.emitEvent("onPreprocessStart");
      await this.preprocess();
      this.eventManager.emitEvent("onPreprocessComplete");
      this.eventManager.emitEvent("onProcessStart");
      await this.process();
      this.eventManager.emitEvent("onProcessComplete");
      this.eventManager.emitEvent("onPostprocessStart");
      await this.postprocess();
      this.eventManager.emitEvent("onPostprocessComplete");
      this.eventManager.emitEvent("onExit");
      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const { plugin } = await import(pluginPath);
      this.eventManager.registerListener(new plugin.default());
    } catch (e) {
      this.ui.error(`Could not load plugin: ${pluginPath}`);
      console.trace(e);
    }
  }

  abstract configure(args: string[]): Promise<void>;
  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
