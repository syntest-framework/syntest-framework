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
import { writeFileSync } from "node:fs";
import * as path from "node:path";

import { Command, ExtensionManager } from "@syntest/module";
import shell = require("shelljs");
import Yargs = require("yargs");

export type ModuleOptions = {
  moduleName: string;
};

export function getModuleCommand(
  tool: string,
  moduleManager: ExtensionManager
): Command {
  const options = new Map<string, Yargs.Options>();

  options.set("module-name", {
    type: "string",
    group: "Create module options:",
    demandOption: true,
  });

  return new Command(
    moduleManager,
    tool,
    "module",
    "Create a module for the syntest tool.",
    options,
    (arguments_: Yargs.ArgumentsCamelCase) => {
      if (!shell.which("git")) {
        shell.echo("Sorry, this script requires git");
        shell.exit(1);
      }

      if (!shell.which("npm")) {
        shell.echo("Sorry, this script requires npm");
        shell.exit(1);
      }

      shell.exec(
        "git clone git@github.com:syntest-framework/syntest-plugin-template.git"
      );

      shell.mv(
        "syntest-plugin-template",
        (<ModuleOptions>(<unknown>arguments_)).moduleName
      );
      shell.cd((<ModuleOptions>(<unknown>arguments_)).moduleName);
      shell.rm("-rf", ".git");
      shell.exec("npm install");

      writeFileSync(
        path.join("lib", "index.ts"),
        getIndexFile(`./${(<ModuleOptions>(<unknown>arguments_)).moduleName}`)
      );
      writeFileSync(
        path.join(
          "lib",
          `${(<ModuleOptions>(<unknown>arguments_)).moduleName}.ts`
        ),
        getModuleFile((<ModuleOptions>(<unknown>arguments_)).moduleName)
      );
    }
  );
}

function getIndexFile(modulePath: string) {
  return `
  export * as module from "${modulePath}";
  `;
}

function getModuleFile(moduleName: string) {
  return `
  import { Module } from "@syntest/module";
  import { getTools } from "./tools";
  
  export default class ${moduleName} extends Module {
    
    constructor() {
      super("${moduleName}", require("../package.json").version);
    }

    async prepare(): Promise<void> {
      // Optional: Add your preparation code here
    }

    async cleanup(): Promise<void> {
      // Optional: Add your cleanup code here
    }

    async getTools(): Promise<Tool[]> {
      return [
        // Add your tools here
      ]
    }

    async getPlugins(): Promise<Plugin[]> {
      return [
        // Add your plugins here
      ]
    }
  };
  `;
}
