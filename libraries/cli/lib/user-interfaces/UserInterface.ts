/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import chalk = require("chalk");
import figlet = require("figlet");
import { Module } from "@syntest/module";

export class UserInterface {
  async printModules(modules: Module[]): Promise<void> {
    for (const module of modules) {
      this.print(`- Module: ${module.name} (${module.version})`);
      this.print(`  - Tools:`);
      for (const tool of await module.getTools()) {
        this.print(`    - ${tool.name}: ${tool.describe}`);
      }
      this.print(`  - Plugins:`);
      for (const plugin of await module.getPlugins()) {
        this.print(`    - ${plugin.name}: ${plugin.describe}`);
      }
    }
  }

  print(text: string): void {
    console.log(text);
  }

  printTitle(): void {
    this.print(
      chalk.bold(
        chalk.greenBright(
          figlet.textSync("SynTest", {
            horizontalLayout: "full",
            font: "rectangles",
          })
        )
      )
    );
  }

  printHeader(text: string): void {
    this.print(chalk.bgGreen(chalk.black(chalk.bold(`\n ${text} `))));
  }

  printError(text: string): void {
    this.print(chalk.red(text));
  }

  printWarning(text: string): void {
    this.print(chalk.yellow(text));
  }
}
