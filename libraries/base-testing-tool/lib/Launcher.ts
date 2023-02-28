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

import { Events } from "@syntest/core";
import TypedEventEmitter from "typed-emitter";

export abstract class Launcher {
  private _programName: string;

  get programName() {
    return this._programName;
  }

  constructor(programName: string) {
    this._programName = programName;
  }

  public async run(): Promise<void> {
    try {
      (<TypedEventEmitter<Events>>process).emit("initializeStart");
      await this.initialize();
      (<TypedEventEmitter<Events>>process).emit("initializeComplete");
      (<TypedEventEmitter<Events>>process).emit("preprocessStart");
      await this.preprocess();
      (<TypedEventEmitter<Events>>process).emit("preprocessComplete");
      (<TypedEventEmitter<Events>>process).emit("processStart");
      await this.process();
      (<TypedEventEmitter<Events>>process).emit("processComplete");
      (<TypedEventEmitter<Events>>process).emit("postprocessStart");
      await this.postprocess();
      (<TypedEventEmitter<Events>>process).emit("postprocessComplete");
      (<TypedEventEmitter<Events>>process).emit("exit");
      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
