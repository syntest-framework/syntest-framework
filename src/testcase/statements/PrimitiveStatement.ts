import { Statement } from "./Statement";
import { Sampler } from "../../search/sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveStatement<T> extends Statement {
  get value(): T {
    return this._value;
  }
  private _value: any;

  constructor(type: string, uniqueId: string, value: T) {
    super(type, uniqueId);
    this._value = value;
  }

  abstract mutate(sampler: Sampler, depth: number): PrimitiveStatement<T>;

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
