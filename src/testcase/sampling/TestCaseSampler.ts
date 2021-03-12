import { Target } from "../../search/objective/Target";
import { Statement } from "../statements/Statement";
import { TestCase } from "../TestCase";

/**
 * TestCaseSampler class
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 */
export abstract class TestCaseSampler {
  private _target: Target;

  /**
   * Constructor
   * @param target     the target
   */
  protected constructor(target: Target) {
    this._target = target;
  }

  /**
   * Should sample a test case.
   *
   * @return  a sampled test case
   */
  abstract sampleTestCase(): TestCase;

  /**
   * Should sample any statement based on the type.
   *
   * @param depth     the current depth of the statement tree
   * @param type      the return type of the statement to sample
   * @param geneType  the type of the statement
   * @return          a sampled statement
   */
  abstract sampleStatement(
    depth: number,
    type: string,
    geneType: string
  ): Statement;

  get target(): Target {
    return this._target;
  }

  set target(value: Target) {
    this._target = value;
  }
}
