/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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

import * as chalk from "chalk";
import {textSync} from "figlet";

/**
 * This class contains standardized functions that create colored and formatted messages to be used by the user-interface.
 * @author Dimitri
 */
export default class Messages {
  private ct: string = chalk.bold.green(">");
  private ds: string = chalk.bold.yellow(">");

  asciiArt(text: string): string {
    return chalk.yellow(textSync(text, { horizontalLayout: "full" }));
  }

  version(syntestJavaScript: string): string {
    return `\n${this.ct} ${chalk.bold(
      "syntest-javascript"
    )}: v${syntestJavaScript}`;
  }

  skipFiles(files: string[]): string {
    return (
      `\n${chalk.bold("Excluded:")}` +
      `\n${chalk.bold("=====================")}\n` +
      files.map((t) => `${this.ds} ${chalk.grey(t)}`).join("\n") +
      `\n${chalk.bold("=====================")}`
    );
  }

  targets(targets: string[]): string {
    return (
      `${chalk.bold("Included:")}` +
      `\n${chalk.bold("=====================")}\n` +
      targets.map((t) => `${this.ct} ${t}`).join("\n") +
      `\n${chalk.bold("=====================")}`
    );
  }

  singleProperty(property: string, value: string): string {
    return chalk.bold(`${property}: `) + `${value}`;
  }

  propertySet(setName: string, props: [string, string][]): string {
    return (
      `\n${chalk.bold(setName)}: \n` +
      props.map((p) => `${this.ct} ${p[0]}: ${p[1]}`).join("\n")
    );
  }

  header(header: string): string {
    return "\n" + chalk.green(chalk.bold(`${header}`)) + "\n";
  }

  reportCoverage(name: string, report: any, bold = false): string {
    if (bold) {
      return chalk.bold(`${String(report['branch']).padStart(20, ' ')} | ${String(report['statement']).padStart(20, ' ')} | ${String(report['function']).padStart(20, ' ')} | ${name}`)
    }
    return `${String(report['branch']).padStart(20, ' ')} | ${String(report['statement']).padStart(20, ' ')} | ${String(report['function']).padStart(20, ' ')} | ${name}`
  }
}
