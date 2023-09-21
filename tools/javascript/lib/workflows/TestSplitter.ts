/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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

import { Target } from "@syntest/analysis-javascript";
import { getLogger, Logger } from "@syntest/logging";
import {
  ActionStatement,
  JavaScriptExecutionResult,
  JavaScriptRunner,
  JavaScriptTestCase,
} from "@syntest/search-javascript";

export class TestSplitting {
  protected static LOGGER: Logger;
  protected runner: JavaScriptRunner;

  constructor(runner: JavaScriptRunner) {
    TestSplitting.LOGGER = getLogger("TestSplitting");
    this.runner = runner;
  }

  public async testSplitting(encodingMap: Map<Target, JavaScriptTestCase[]>) {
    const finalEncodings = new Map<Target, JavaScriptTestCase[]>();
    let total = 0;

    // eslint-disable-next-line prefer-const
    for (let [target, encodings] of encodingMap.entries()) {
      // TODO this can be done multiple times since the splitting function only splits an encoding in two parts
      // so an encoding of length 4 could be split into two encodings of length 2 and those 2 can be split into 4 encodings of length 1
      let round = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const splitEncodings = await this._testSplitting(encodings);
        if (encodings.length === splitEncodings.length) {
          // nothing changed
          break;
        }
        encodings = splitEncodings;

        round += 1;

        TestSplitting.LOGGER.info(`Split found, repeating. Round ${round}`);
      }
      finalEncodings.set(target, encodings);
      total += finalEncodings.size;
    }

    if (total === 0) {
      throw new Error("Zero tests were created");
    }

    return finalEncodings;
  }

  private async _testSplitting(originalEncodings: JavaScriptTestCase[]) {
    const finalEncodings: JavaScriptTestCase[] = [];

    for (const encoding of originalEncodings) {
      const executionResult = encoding.getExecutionResult();

      if (!executionResult) {
        throw new Error("Invalid encoding without executionResult");
      }

      // maximum of 2^(|roots| - 1) - 1 pairs
      const childEncodingPairs = this._splitEncoding(encoding);
      // TODO in the interest of saving time we could pick random child encodings
      // TODO or we could execute them in order of balance and then simply stop when we have one that works

      const possiblePairs: JavaScriptTestCase[][] = [];
      for (const pair of childEncodingPairs) {
        // evaluate
        await this.runner.executeMultiple(pair);
        // are they equal?
        if (
          this._equalResults(
            <JavaScriptExecutionResult>executionResult,
            pair.map(
              (child) => <JavaScriptExecutionResult>child.getExecutionResult()
            )
          )
        ) {
          possiblePairs.push(pair);
        }
      }

      if (possiblePairs.length === 0) {
        // no possible pairs so we use the original one
        finalEncodings.push(encoding);
        continue;
      }

      // // prefer more balanced splits (i.e. 2-2 over 1-3)
      // let bestBalance = Number.MAX_VALUE;
      // let bestPair: JavaScriptTestCase[] = possiblePairs[0];
      // for (const pair of possiblePairs) {
      //   const [encodingA, encodingB] = pair;
      //   const balance = Math.abs(encodingA.getLength() - encodingB.getLength());

      //   if (balance < bestBalance) {
      //     bestBalance = balance;
      //     bestPair = pair;
      //   }
      // }

      // TestSplitting.LOGGER.debug(
      //   `Split found: ${encoding.getLength()} -> ${bestPair[0].getLength()} + ${bestPair[1].getLength()}`
      // );

      // finalEncodings.push(...bestPair));

      for (const pair of possiblePairs) {
        TestSplitting.LOGGER.debug(
          `Split found: ${encoding.getLength()} -> ${pair[0].getLength()} + ${pair[1].getLength()}`
        );
      }
      finalEncodings.push(...possiblePairs.flat());
    }

    return finalEncodings;
  }

  /**
   * This function splits the encoding into two encodings in every unique possible way
   * More than two splits are not considered (would require calling the function again)
   *
   * 1-23, 2-13, 3-12
   * 001, 010, 011
   * 110, 101, 100
   * 1-234, 2-134, 3-124, 4-123, 12-34, 13-24, 14-23
   * 1110, 1101, 1011, 1000, 1100, 1010, 1001
   * 0001, 0010, 0100, 0111, 0011, 0101, 0110
   * So if an encoding exists of 4 roots the splits are: 1-234, 2-134, 3-124, 4-123, 12-34, 13-24, 14-23
   * @param encoding
   * @returns
   */
  private _splitEncoding(encoding: JavaScriptTestCase): JavaScriptTestCase[][] {
    const roots = encoding.roots;

    const childEncodings: JavaScriptTestCase[][] = [];

    // only consider in order combinations
    for (
      let orderedCombination = 1;
      orderedCombination < Math.pow(2, roots.length - 1);
      orderedCombination++
    ) {
      const childRoots: ActionStatement[] = [];
      const oppositeChildRoots: ActionStatement[] = [];

      const binary = [
        ...orderedCombination.toString(2).padStart(roots.length, "0"),
      ];
      binary.reverse();
      for (const [index, root] of roots.entries()) {
        if (binary[index] === "0") {
          childRoots.push(root);
        } else {
          oppositeChildRoots.push(root);
        }
      }
      childEncodings.push([
        new JavaScriptTestCase(childRoots),
        new JavaScriptTestCase(oppositeChildRoots),
      ]);
    }

    return childEncodings;
  }

  private _equalResults(
    originalResult: JavaScriptExecutionResult,
    splitResults: JavaScriptExecutionResult[]
  ): boolean {
    // compare errors
    if (originalResult.hasError()) {
      let notEqual = true;
      for (const result of splitResults) {
        if (
          result.hasError() &&
          this._equalErrors(originalResult.getError(), result.getError())
        ) {
          notEqual = false;
        }
      }
      if (notEqual) {
        return false;
      }
    }

    // compare traces
    const traceMap = new Map<string, boolean>();
    for (const trace of originalResult.getTraces()) {
      if (trace.hits > 0) {
        traceMap.set(trace.id, false);
      }
    }
    for (const result of splitResults) {
      for (const trace of result.getTraces()) {
        if (trace.hits > 0) {
          if (!traceMap.has(trace.id)) {
            // ?? we covered a new trace??
            continue;
          }
          traceMap.set(trace.id, true);
        }
      }
    }

    return [...traceMap.values()].some(Boolean);
  }

  private _equalErrors(errorA: Error, errorB: Error) {
    return (
      errorA.name === errorB.name &&
      errorA.message === errorB.message &&
      errorA.stack === errorB.stack
    );
  }
}
