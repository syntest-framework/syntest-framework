import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { SearchSubject } from "../search/SearchSubject";

/**
 * Objective function for the function branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
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
   */
  calculateDistance(encoding: T): number {
    if (encoding.getExecutionResult() === undefined){
      return Number.MAX_VALUE;
    }

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

  /**
   * @inheritDoc
   */
  getSubject(): SearchSubject<T> {
    return this._subject;
  }
}
