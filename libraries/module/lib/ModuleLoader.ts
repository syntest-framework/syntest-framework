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

import { existsSync } from "node:fs";
import path = require("path");

import { getLogger, Logger } from "@syntest/logging";
import globalModules = require("global-modules");

import { Module } from "./extension/Module";
import { ExtensionManager } from "./ExtensionManager";
import {
  moduleAlreadyLoaded,
  moduleCannotBeLoaded,
  moduleNotCorrectlyImplemented,
  moduleNotInstalled,
  modulePathNotFound,
} from "./util/diagnostics";

export class ModuleLoader {
  protected static LOGGER: Logger;

  protected _extensionManager: ExtensionManager;

  constructor(extensionManager: ExtensionManager) {
    ModuleLoader.LOGGER = getLogger(ModuleLoader.name);
    this._extensionManager = extensionManager;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async loadModule(moduleId: string, internal = false) {
    try {
      ModuleLoader.LOGGER.info(`Loading module: ${moduleId}`);

      let modulePath = "";

      if (internal) {
        modulePath = moduleId;
      } else {
        if (moduleId.startsWith("file:")) {
          // It is a file path
          modulePath = path.resolve(moduleId.replace("file:", ""));
          if (!existsSync(modulePath)) {
            throw new Error(modulePathNotFound(moduleId));
          }
        } else {
          // It is a npm package
          modulePath = path.resolve(path.join("node_modules", moduleId));

          if (!existsSync(modulePath)) {
            // it is not locally installed lets try global
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            modulePath = path.resolve(path.join(globalModules, moduleId));
          }

          if (!existsSync(modulePath)) {
            // it is not installed locally nor globally
            // TODO maybe auto install?
            throw new Error(moduleNotInstalled(moduleId));
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { module } = await import(modulePath);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const moduleInstance: Module = new module.default();

      // check requirements
      if (!moduleInstance.name) {
        throw new Error(moduleNotCorrectlyImplemented("name", moduleId));
      }
      if (!moduleInstance.register) {
        throw new Error(moduleNotCorrectlyImplemented("register", moduleId));
      }
      if (this._extensionManager.modules.has(moduleInstance.name)) {
        throw new Error(moduleAlreadyLoaded(moduleInstance.name, moduleId));
      }

      // register module
      this._extensionManager.registerModule(moduleInstance);
      await moduleInstance.register(
        this._extensionManager.createRegistrationAPI(moduleInstance)
      );
    } catch (error) {
      console.log(error);
      throw new Error(moduleCannotBeLoaded(moduleId));
    }
  }
}
