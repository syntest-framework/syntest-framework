/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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
import { existsSync, readFileSync } from "node:fs";
import path = require("node:path");

import {
  fileDoesNotExist,
  fileDoesNotHaveExtension,
  fileIsNotAFile,
} from "../diagnostics";

export class SourceFactory {
  produce(filePath: string): string {
    const parsed = path.parse(filePath);

    if (!parsed.base) {
      throw new Error(fileIsNotAFile(filePath));
    }

    if (!parsed.ext) {
      throw new Error(fileDoesNotHaveExtension(filePath));
    }

    if (!existsSync(filePath)) {
      throw new Error(fileDoesNotExist(filePath));
    }

    return readFileSync(filePath, "utf8");
  }
}
