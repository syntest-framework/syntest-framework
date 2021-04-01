import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { SearchSubject } from "../search/SearchSubject";

/**
 *
 */
export class FunctionObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _id: string;
  protected _line: number;

  /**
   * Constructor.
   *
   * @param subject
   * @param id
   * @param line
   */
  constructor(subject: SearchSubject<T>, id: string, line: number) {
    this._subject = subject;
    this._id = id;
    this._line = line;
  }

  /**
   * @inheritDoc
   * @param encoding
   */
  calculateDistance(encoding: T): number {
    if (encoding.getExecutionResult().coversLine(this._line)) {
      return 0;
    } else {
      return 1;
    }
  }

  /**
   * @inheritDoc
   */
  getIdentifier(): string {
    return this._id;
  }
}
