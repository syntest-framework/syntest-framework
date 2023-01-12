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

import { UserInterface } from "./UserInterface";
import { getLogger } from "../util/logger";
import * as cliProgress from "cli-progress";

import chalk = require("chalk");
import figlet = require("figlet");

export class CommandLineInterface extends UserInterface {
  protected showProgressBar: boolean;
  protected progressValue: number;
  protected budgetValue: number;
  protected bar: cliProgress.SingleBar;

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
  }

  asciiArt(text: string): string {
    return chalk.yellow(figlet.textSync(text, { horizontalLayout: "full" }));
  }

  startProgressBar(): void {
    this.showProgressBar = true;

    this.bar = new cliProgress.SingleBar({
      format: "Coverage: {bar} {percentage}% | Remaining budget: {budget}%",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
      synchronousUpdate: false,
    });

    this.bar.start(100, this.progressValue, {
      budget: "100",
    });
  }

  updateProgressBar(value: number, budget: number): void {
    this.progressValue = value;
    this.budgetValue = budget;

    this.bar.update(value, {
      budget: `${budget}`,
    });
  }

  stopProgressBar(): void {
    this.showProgressBar = false;
    this.bar.stop();
  }

  log(type: string, text: string): void {
    getLogger()[type](text);
  }

  debug(text: string): void {
    this.log("debug", text);
  }

  info(text: string): void {
    this.log("info", text);
  }

  error(text: string): void {
    this.log("error", text);
  }

  report(text: string, args: string[]): void {
    this.info(`${text}: ${args.join(", ")}`);
  }
}
