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

import { LOGGER } from "../util/logger";
import { ListenerPlugin } from "../plugin/ListenerPlugin";
import { Encoding } from "../search/Encoding";
import { ListenerInterface } from "./ListenerInterface";

export class EventLogger<T extends Encoding>
  implements ListenerInterface<T>, ListenerPlugin<T>
{
  name = "EventLogger";
  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createListener(): ListenerInterface<T> {
    return this;
  }

  onEvent(event: string): void {
    LOGGER.silly(event);
  }
}
