/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

import { Encoding } from "..";
import { ListenerInterface } from "./ListenerInterface";
import { ProgramState } from "./ProgramState";

export class EventManager<T extends Encoding> {
  private _state: ProgramState<T>;
  private listeners: ListenerInterface<T>[] = [];

  constructor(state: ProgramState<T>) {
    this._state = state;
  }

  registerListener(listener: ListenerInterface<T>) {
    this.listeners.push(listener);
  }

  deregisterListener(listener: ListenerInterface<T>) {
    this.listeners.splice(this.listeners.indexOf(listener));
  }

  emitEvent(event: keyof ListenerInterface<T>) {
    for (const listener of this.listeners) {
      if (!listener[event]) {
        continue;
      }
      if (typeof listener[event] !== "function") {
        continue;
      }
      listener[event](this.state);
    }
  }

  get state() {
    return this._state;
  }
}
