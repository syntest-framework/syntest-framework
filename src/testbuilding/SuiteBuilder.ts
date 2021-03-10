import { TestCase } from "../testcase/TestCase";
import { Stringifier } from "./Stringifier";
import { Objective, Target } from "..";

const fs = require("fs");
const path = require("path");

/**
 * SuiteBuilder class
 *
 * @author Dimitri Stallenberg
 */
export abstract class SuiteBuilder {
  get stringifier(): Stringifier {
    return this._stringifier;
  }

  private _stringifier: Stringifier;

  /**
   * Constructor
   * @param stringifier   a stringifier object
   */
  constructor(stringifier: Stringifier) {
    this._stringifier = stringifier;
  }

  /**
   * Writes a test file using an individual
   * @param filePath              the filepath to write the test to
   * @param individual            the individual to write a test for
   * @param targetName
   * @param addLogs               whether to add log statements to the individual
   * @param additionalAssertions  a dictionary of additional assertions to put in the individual
   */
  abstract writeTest(
    filePath: string,
    individual: TestCase,
    targetName: string,
    addLogs?: boolean,
    additionalAssertions?: Map<TestCase, { [p: string]: string }>
  ): Promise<void>;

  /**
   * Writes tests for all individuals in the given population
   * @param population    the population of individuals to write tests for
   */
  abstract createSuite(population: Map<Objective, TestCase>): Promise<void>;

  /**
   * Deletes a certain file
   * @param filepath  the filepath of the file to delete
   */
  async deleteTest(filepath: string) {
    await fs.unlinkSync(filepath);
  }

  /**
   * Removes all files that match the given regex within a certain directory
   * @param dirPath   the directory to clear
   * @param match     the regex to which the files must match
   */
  async clearDirectory(dirPath: string, match = /.*\.(js)/g) {
    const dirContent = await fs.readdirSync(dirPath);

    for (const file of dirContent.filter((el: string) => el.match(match))) {
      await fs.unlinkSync(path.resolve(dirPath, file));
    }
  }
}
