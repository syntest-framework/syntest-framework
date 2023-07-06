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

export class StorageManager {
  private static LOGGER: Logger;
  private syntestDirectory: string;
  private tempSyntestDirectory: string;
  private fid: string;

  constructor(
    syntestDirectory: string,
    temporarySynTestDirectory: string,
    fid: string
  ) {
    StorageManager.LOGGER = getLogger("StorageManager");
    this.syntestDirectory = syntestDirectory;
    this.tempSyntestDirectory = temporarySynTestDirectory;
    this.fid = fid;
  }

  private getFullPath(directoryPath: string[], temporary = false): string {
    for (const pathPart of directoryPath) {
      if (pathPart.includes("/") || pathPart.includes("\\")) {
        throw new Error(
          "Storage path cannot contain any of the following characters /\\"
        );
      }
    }

    if (temporary) {
      return path.resolve(
        path.join(this.tempSyntestDirectory, this.fid, ...directoryPath)
      );
    }
    return path.resolve(
      path.join(this.syntestDirectory, this.fid, ...directoryPath)
    );
  }

  createDirectory(directoryPath: string[], temporary = false) {
    const fullPath = this.getFullPath(directoryPath, temporary);

    if (existsSync(fullPath)) {
      return;
    }
    mkdirSync(fullPath, { recursive: true });
  }

  deleteTemporaryDirectory(directoryPath: string[]) {
    const fullPath = this.getFullPath(directoryPath, true);

    if (!existsSync(fullPath)) {
      return;
    }
    rmSync(fullPath, {
      recursive: true,
      force: true,
    });
  }

  clearTemporaryDirectory(directoryPath: string[]) {
    const fullPath = this.getFullPath(directoryPath, true);

    if (!existsSync(fullPath)) {
      return;
    }
    const files = readdirSync(fullPath);
    for (const file of files) {
      unlinkSync(path.join(fullPath, file));
    }
  }

  createDirectories(directoriesPaths: string[][], temporary = false) {
    for (const directoryPath of directoriesPaths) {
      this.createDirectory(directoryPath, temporary);
    }
  }

  deleteTemporaryDirectories(directoriesPaths: string[][]) {
    for (const directoryPath of directoriesPaths) {
      this.deleteTemporaryDirectory(directoryPath);
    }
  }

  deleteMainTemporary() {
    const directory = this.tempSyntestDirectory;
    if (!existsSync(directory)) {
      return;
    }
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }

  clearTemporaryDirectories(directoriesPaths: string[][]) {
    for (const directoryPath of directoriesPaths) {
      this.clearTemporaryDirectory(directoryPath);
    }
  }

  /**
   *
   * @param storagePath
   * @param fileName
   * @param data
   * @param temporary
   * @param append
   *
   * @returns the path we saved to
   */
  store(
    storagePath: string[],
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

    for (const pathPart of storagePath) {
      if (pathPart.includes("/") || pathPart.includes("\\")) {
        throw new Error(
          "Storage path cannot contain any of the following characters /\\"
        );
      }
    }

    this.createDirectory(storagePath, temporary);
    const fullPath = path.join(
      this.getFullPath(storagePath, temporary),
      fileName
    );

    if (append && existsSync(fullPath)) {
      appendFileSync(fullPath, data);
    } else {
      writeFileSync(fullPath, data);
    }

    return fullPath;
  }

  deleteTemporary(directoryPath: string[], fileName: string) {
    // check if temporary
    const fullPath = path.join(this.getFullPath(directoryPath, true), fileName);

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

  copyToTemporaryDirectory(
    originalDirectoryPath: string[],
    destinationDirectoryPath: string[]
  ) {
    const originalPath = path.join(...originalDirectoryPath);
    const destinationPath = this.getFullPath(destinationDirectoryPath, true);
    copySync(originalPath, destinationPath);
  }
}
