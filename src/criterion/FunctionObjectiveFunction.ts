import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { SearchSubject } from "../search/SearchSubject";

export class FunctionObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _line: number;

  constructor(subject: SearchSubject<T>, line: number) {
    this._subject = subject;
    this._line = line;
  }

  calculateDistance(encoding: T): number {
    if (encoding.getExecutionResult().coversLine(this._line)) {
      return 0;
    } else {
      return 1;
    }
  }

  getIdentifier(): string {
    return "";
  }
}
