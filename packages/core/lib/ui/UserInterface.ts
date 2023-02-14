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
import { format } from "winston";
import { ListenerInterface } from "../event/ListenerInterface";
import { Encoding } from "../search/Encoding";
import Transport = require("winston-transport");
import { CONFIG } from "../Configuration";
import clear = require("clear");

export abstract class UserInterface<T extends Encoding>
  extends Transport
  implements ListenerInterface<T>
{
  // This empty function is required because typescripts weak type detection requires atleast one overlapping property.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onEvent(): void {}

  format = format.cli();
  level = CONFIG.consoleLogLevel;
  stderrLevels = ["fatal", "error", "warn"];
  debugStdout = false;

  clear(): void {
    clear();
  }

  abstract asciiArt(text: string): void;
  // abstract showProperties(): void;
  abstract header(header: string): void;

  abstract subheader(subheader: string): void;
  abstract property(property: string, value: string): void;
}
