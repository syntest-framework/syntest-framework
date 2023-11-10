/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { IOError, Result, success } from "@syntest/diagnostics";

export class SourceFactory {
  produce(filePath: string): Result<string> {
    const parsed = path.parse(filePath);

    if (!parsed.base) {
      throw new IOError("The given path is not a file", {
        context: { path: filePath },
      });
    }

    if (!parsed.ext) {
      throw new IOError("The given file does not have an extension", {
        context: { path: filePath },
      });
    }

    if (!existsSync(filePath)) {
      throw new IOError("The given file does not exist", {
        context: { path: filePath },
      });
    }

    return success(readFileSync(filePath, "utf8"));
  }
}
