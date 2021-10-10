/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import * as cliProgress from "cli-progress";
import { CommandLineInterface } from "./CommandLineInterface";
import { getLogger } from "../util/logger";

const chalk = require("chalk");
const clear = require("clear");

export abstract class MonitorCommandLineInterface extends CommandLineInterface {
  protected logs: string[];

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
    this.logs = [];
    this.showProgressBar = false;
    this.progressValue = 0;
  }

  render() {
    clear();
    console.log(this.asciiArt("Syntest"));
    console.log(new Date().toLocaleTimeString());

    if (this.showProgressBar) {
      const bar = new cliProgress.SingleBar({
        format: "Coverage: {bar} {percentage}% | Remaining budget: {budget}%",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
        synchronousUpdate: false,
      });

      bar.start(100, this.progressValue, {
        budget: `${this.budgetValue}`,
      });

      bar.render();
      // bar.update(self.progressValue)

      bar.stop();
    }

    console.log("====================== LOGS ======================");
    console.log(this.logs.slice(Math.max(this.logs.length - 10, 0)).join("\n"));
  }

  log(type: string, text: string) {
    let color = chalk.red;
    switch (type) {
      case "error":
        color = chalk.red;
        break;
      case "info":
        color = chalk.blue;
        break;
      case "debug":
        color = chalk.magenta;
        break;
    }
    this.logs.push(
      `${new Date().toLocaleTimeString()} ${color(type)}: ${text}`
    );

    this.render();

    getLogger()[type](text);
  }

  startProgressBar() {
    this.showProgressBar = true;
    this.progressValue = 0;
    this.budgetValue = 100;
    this.render();
  }

  updateProgressBar(value: number, budget: number) {
    this.progressValue = value;
    this.budgetValue = budget;
    this.render();
  }

  stopProgressBar() {
    this.showProgressBar = false;
    this.render();
  }
}
