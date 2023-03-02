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
import { table } from "table";
import * as cliProgress from "cli-progress";

export class UserInterface {
  private barObject: cliProgress.MultiBar;
  private bars: Map<string, cliProgress.Bar>;

  private print(text: string): void {
    // If we are using progress bars, we need to print to above the bars
    if (this.barObject) {
      this.barObject.log(text);
      return;
    }
    console.log(text);
  }

  // Text manipulation methods
  indent(text: string, amount: number): string {
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
        format: this.barFormatter,
      },
      cliProgress.Presets.shades_grey
    );

    for (const bar of bars) {
      this.bars.set(bar.name, this.barObject.create(bar.maxValue, bar.value));
    }
  }

  updateProgressBar(bar: BarObject): void {
    if (!this.bars.has(bar.name)) {
      throw new Error(`Progress bar with name ${bar.name} does not exist`);
    }

    this.bars.get(bar.name).update(bar.value, { meta: bar.meta });
  }

  updateProgressBars(bars: BarObject[]): void {
    for (const bar of bars) {
      this.updateProgressBar(bar);
    }
  }

  stopProgressBars(): void {
    this.barObject.stop();
  }

  protected barFormatter(options, params, payload): string {
    return "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | {meta}";
    // if (params.value >= params.total){
    //   return '# ' + chalk.grey(payload.task) + '   ' + chalk.green(params.value + '/' + params.total) + ' --[' + bar + ']-- ';
    // }else{
    //     return '# ' + payload.task + '   ' + chalk.yellow(params.value + '/' + params.total) + ' --[' + bar + ']-- ';
    // }
  }

  // Private internal styling methods
  protected table(title: string, tableObject: TableObject): string {
    return table(
      [
        tableObject.headers.map(this.bold),
        ...tableObject.rows,
        tableObject.footers.map(this.bold),
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
        figlet.textSync(text, {
          horizontalLayout: "full",
          font: "rectangles",
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
