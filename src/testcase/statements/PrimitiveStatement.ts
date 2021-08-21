import { Statement } from "./Statement";
import { TestCaseSampler } from "../sampling/TestCaseSampler";
import { Parameter } from "../../graph/parsing/Parameter";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveStatement<T> extends Statement {
  get type(): Parameter {
    return this.types[0];
  }

  get varName(): string {
    return this.varNames[0];
  }

  get value(): T {
    return this._value;
  }
  private _value: any;

  constructor(type: Parameter, uniqueId: string, value: T) {
    super([type], uniqueId);
    this._value = value;
  }

  abstract mutate(
    sampler: TestCaseSampler,
    depth: number
  ): PrimitiveStatement<T>;

  abstract copy(): PrimitiveStatement<T>;

  hasChildren(): boolean {
    return false;
  }

  getChildren(): Statement[] {
    return [];
  }

  static getRandom(): PrimitiveStatement<any> {
    throw new Error("Unimplemented function!");
  }
}
