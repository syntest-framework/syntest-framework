import { TestCaseDecoder } from "./TestCaseDecoder";
import { TestCase } from "../TestCase";
import { getLogger } from "../../util/logger";
import { Archive } from "../../search/Archive";
import { getUserInterface } from "../../ui/UserInterface";

const fs = require("fs");
const path = require("path");

/**
 * SuiteBuilder class
 *
 * @author Dimitri Stallenberg
 */
export abstract class SuiteBuilder {
  protected _decoder: TestCaseDecoder;

  /**
   * Constructor.
   *
   * @param testCaseDecoder   a testCaseDecoder object
   */
  protected constructor(testCaseDecoder: TestCaseDecoder) {
    this._decoder = testCaseDecoder;
  }

  /**
   * Writes a test file using an testCase.
   *
   * @param filePath             the filepath to write the test to
   * @param testCase             the testCase to write a test for
   * @param targetName
   * @param addLogs              whether to add log statements to the testCase
   * @param additionalAssertions a dictionary of additional assertions to put in the testCase
   */
  abstract writeTestCase(
    filePath: string,
    testCase: TestCase,
    targetName: string,
    addLogs?: boolean,
    additionalAssertions?: Map<TestCase, { [p: string]: string }>
  ): Promise<void>;

  /**
   * Writes tests for all individuals in the given population.
   *
   * @param population    the population of individuals to write tests for
   */
  abstract createSuite(archive: Archive<TestCase>): Promise<void>;

  /**
   * Deletes a certain file.
   *
   * @param filepath  the filepath of the file to delete
   */
  async deleteTestCase(filepath: string) {
    try {
      await fs.unlinkSync(filepath);
    } catch (error) {
      getUserInterface().debug(error);
    }
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

  get decoder(): TestCaseDecoder {
    return this._decoder;
  }
}
