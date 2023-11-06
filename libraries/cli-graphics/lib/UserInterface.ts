/*
 * Copyright 2020-2021 SynTest contributors
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

import chalk = require("chalk");
import * as cliProgress from "cli-progress";
import figlet = require("figlet");
import { table } from "table";

export class UserInterface {
  protected barObject: cliProgress.MultiBar | undefined = undefined;
  protected bars: Map<string, cliProgress.Bar> | undefined = undefined;

  protected print(text: string): void {
    // If we are using progress bars, we need to print to above the bars
    if (this.barObject) {
      this.barObject.log(text + "\n");
      return;
    }
    console.log(text);
  }

  // Text manipulation methods
  protected indent(text: string, amount: number): string {
    return " ".repeat(amount) + text;
  }

  // Direct print methods
  printTitle(text: string): void {
    this.print(this.title(text));
  }

  printHeader(text: string): void {
    this.print(this.header(text));
  }

  printError(text: string): void {
    this.print(this.error(text));
  }

  printWarning(text: string): void {
    this.print(this.warning(text));
  }

  printSuccess(text: string): void {
    this.print(this.success(text));
  }

  printBold(text: string): void {
    this.print(this.bold(text));
  }

  printTable(title: string, tableObject: TableObject): void {
    this.print(this.table(title, tableObject));
  }

  printItemization(title: string, items: ItemizationItem[]): void {
    this.print(this.header(title));
    this.print(this.itemization(items));
  }

  startProgressBars(bars: BarObject[]): void {
    this.bars = new Map();
    this.barObject = new cliProgress.MultiBar(
      {
        hideCursor: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        format: this.barFormatter,
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
      },
      cliProgress.Presets.shades_grey
    );

    for (const bar of bars) {
      this.bars.set(bar.name, this.barObject.create(bar.maxValue, bar.value));
    }
  }

  updateProgressBar(bar: BarObject): void {
    if (this.bars === undefined) {
      throw new Error("Progress bars have not been started yet");
    }
    if (this.bars.has(bar.name) === false) {
      throw new Error(`Progress bar with name ${bar.name} does not exist`);
    }

    this.bars
      .get(bar.name)
      .update(bar.value, { meta: bar.meta, name: bar.name });
  }

  updateProgressBars(bars: BarObject[]): void {
    for (const bar of bars) {
      this.updateProgressBar(bar);
    }
  }

  stopProgressBars(): void {
    if (this.barObject === undefined) {
      throw new Error("Progress bars have not been started yet");
    }
    this.barObject.stop();
    this.barObject = undefined;
    this.bars = undefined;
  }

  protected barFormatter(
    options: cliProgress.Options,
    parameters: cliProgress.Params,
    payload: Payload
  ): string {
    const bar =
      chalk.green(
        options.barCompleteString.slice(
          0,
          Math.max(0, Math.round(parameters.progress * options.barsize))
        )
      ) +
      options.barIncompleteString.slice(
        0,
        Math.max(
          0,
          options.barsize - Math.round(parameters.progress * options.barsize)
        )
      );

    const percentage = Math.round(parameters.progress * 100);
    const string_ = `${bar} ${percentage}% | ETA: ${parameters.eta}s | ${
      parameters.value
      // eslint-disable-next-line sonarjs/no-nested-template-literals, @typescript-eslint/restrict-template-expressions
    }/${parameters.total} ${payload.meta ? `| ${payload.meta}` : ""} | ${
      payload.name
    }`;

    if (parameters.value >= parameters.total) {
      return chalk.greenBright(string_);
    }

    return string_;
  }

  // Private internal styling methods
  protected table(title: string, tableObject: TableObject): string {
    return table(
      [
        tableObject.headers.map((element) => this.bold(element)),
        ...tableObject.rows,
        tableObject.footers.map((element) => this.bold(element)),
      ],
      {
        header: {
          alignment: "center",
          content: chalk.greenBright(chalk.bold(title)),
        },
      }
    );
  }

  protected itemization(items: ItemizationItem[], indentation = 2): string {
    let text = "";
    for (const item of items) {
      text += this.indent(`- ${item.text}`, indentation) + "\n";
      if (item.subItems) {
        text += this.itemization(item.subItems, indentation + 2);
      }
    }
    return text;
  }

  protected title(text: string): string {
    return chalk.bold(
      chalk.greenBright(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        figlet.textSync(text, {
          horizontalLayout: "full",
          font: "Rectangles",
        })
      )
    );
  }

  protected header(text: string): string {
    return chalk.bgGreen(chalk.black(chalk.bold(`\n ${text} \n`)));
  }

  protected error(text: string): string {
    return chalk.red(text);
  }

  protected warning(text: string): string {
    return chalk.yellow(text);
  }

  protected success(text: string): string {
    return chalk.green(text);
  }

  protected bold(text: string): string {
    return chalk.bold(text);
  }
}

export type ItemizationItem = {
  text: string;
  subItems?: ItemizationItem[];
};

export type TableObject = {
  headers: string[];
  rows: string[][];
  footers: string[];
};

export type BarObject = {
  name: string;
  value: number;
  maxValue: number;
  meta: string;
};

type Payload = {
  name: string;
  meta: string;
};
