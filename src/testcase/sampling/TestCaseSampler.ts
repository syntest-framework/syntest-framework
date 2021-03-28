import { Statement } from "../statements/Statement";
import { TestCase } from "../TestCase";
import { EncodingSampler } from "../../search/EncodingSampler";
import { SearchSubject } from "../../search/SearchSubject";

/**
 * TestCaseSampler class
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 */
export abstract class TestCaseSampler implements EncodingSampler<TestCase> {
  private _subject: SearchSubject<TestCase>;

  /**
   * Constructor
   * @param subject     the subject
   */
  protected constructor(subject: SearchSubject<TestCase>) {
    this._subject = subject;
  }

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

  get subject(): SearchSubject<TestCase> {
    return this._subject;
  }

  set subject(value: SearchSubject<TestCase>) {
    this._subject = value;
  }

  /**
   * Should sample a test case.
   *
   * @return  a sampled test case
   */
  abstract sample(): TestCase;
}
