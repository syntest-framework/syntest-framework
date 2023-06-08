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
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";

import { getLogger, Logger } from "@syntest/logging";
import { copySync } from "fs-extra";
import Yargs = require("yargs");

import { StorageOptions } from "./util/Configuration";

export class StorageManager {
  private static LOGGER: Logger;
  private _arguments: Yargs.ArgumentsCamelCase;

  get args() {
    return this._arguments;
  }

  set args(_arguments) {
    this._arguments = _arguments;
    StorageManager.LOGGER = getLogger("StorageManager");
  }

  private getFullPath(directoryName: string, temporary = false): string {
    if (temporary) {
      return path.resolve(
        path.join(
          (<StorageOptions>(<unknown>this.args)).tempSyntestDirectory,
          (<StorageOptions>(<unknown>this.args)).fid,
          directoryName
        )
      );
    }
    return path.resolve(
      path.join(
        (<StorageOptions>(<unknown>this.args)).syntestDirectory,
        (<StorageOptions>(<unknown>this.args)).fid,
        directoryName
      )
    );
  }

  createDirectory(directory: string, temporary = false) {
    directory = this.getFullPath(directory, temporary);

    if (existsSync(directory)) {
      return;
    }
    mkdirSync(directory, { recursive: true });
  }

  deleteTemporaryDirectory(directory: string) {
    directory = this.getFullPath(directory, true);

    if (!existsSync(directory)) {
      return;
    }
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }

  clearTemporaryDirectory(directory: string) {
    directory = this.getFullPath(directory, true);

    if (!existsSync(directory)) {
      return;
    }
    const files = readdirSync(directory);
    for (const file of files) {
      unlinkSync(path.join(directory, file));
    }
  }

  createDirectories(directories: string[], temporary = false) {
    for (const directory of directories) {
      this.createDirectory(directory, temporary);
    }
  }

  deleteTemporaryDirectories(directories: string[]) {
    for (const directory of directories) {
      this.deleteTemporaryDirectory(directory);
    }
  }

  deleteMainTemporary() {
    const directory = (<StorageOptions>(<unknown>this.args))
      .tempSyntestDirectory;
    if (!existsSync(directory)) {
      return;
    }
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }

  clearTemporaryDirectories(directories: string[]) {
    for (const directory of directories) {
      this.clearTemporaryDirectory(directory);
    }
  }

  /**
   *
   * @param directoryName
   * @param fileName
   * @param data
   * @param temporary
   * @param append
   *
   * @returns the path we saved to
   */
  store(
    directoryName: string,
    fileName: string,
    data: string,
    temporary = false,
    append = false
  ): string {
    if (fileName.includes("/") || fileName.includes("\\")) {
      throw new Error(
        "filename cannot contain any of the following characters /\\"
      );
    }

    this.createDirectory(directoryName, temporary);
    const fullPath = path.join(
      this.getFullPath(directoryName, temporary),
      fileName
    );

    if (append && existsSync(fullPath)) {
      appendFileSync(fullPath, data);
    } else {
      writeFileSync(fullPath, data);
    }

    return fullPath;
  }

  deleteTemporary(directoryName: string, fileName: string) {
    // check if temporary
    const fullPath = path.join(this.getFullPath(directoryName, true), fileName);

    if (!existsSync(fullPath)) {
      return;
    }

    try {
      unlinkSync(fullPath);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      StorageManager.LOGGER.debug(error);
    }
  }

  copyToTemporaryDirectory(originalPath: string, destinationDirectory: string) {
    const destinationPath = this.getFullPath(destinationDirectory, true);
    copySync(originalPath, destinationPath);
  }
}
