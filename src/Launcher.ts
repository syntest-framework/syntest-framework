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

import { EventManager } from "./event/EventManager";
import { ProgramState } from "./event/ProgramState";

export abstract class Launcher {
  private _programState: ProgramState;
  private programName: string;

  get programState() {
    return this._programState;
  }

  constructor(programName: string) {
    this.programName = programName;
    this._programState = {};
    EventManager.setState(this.programState);
  }

  public async run(args: string[]): Promise<void> {
    try {
      await this.processArguments(args);
      EventManager.emitEvent("onSetupStart");
      await this.setup();
      EventManager.emitEvent("onSetupComplete");
      EventManager.emitEvent("onPreprocessStart");
      await this.preprocess();
      EventManager.emitEvent("onPreprocessComplete");
      EventManager.emitEvent("onProcessStart");
      await this.process();
      EventManager.emitEvent("onProcessComplete");
      EventManager.emitEvent("onPostprocessStart");
      await this.postprocess();
      EventManager.emitEvent("onPostprocessComplete");
      EventManager.emitEvent("onExit");
      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  abstract processArguments(args: string[]): Promise<void>;
  abstract setup(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
