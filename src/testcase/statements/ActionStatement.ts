import { Statement } from "./Statement";
import { EncodingSampler } from "../../search/EncodingSampler";
import { AbstractTestCase } from "../AbstractTestCase";
import {Parameter} from "../../graph/parsing/Parameter";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ActionStatement extends Statement {
  get args(): Statement[] {
    return this._args;
  }

  set args(value: Statement[]) {
    this._args = value;
  }
  private _args: Statement[];

  protected constructor(types: Parameter[], uniqueId: string, args: Statement[]) {
    super(types, uniqueId);
    this._args = args;
  }

  abstract mutate(
    sampler: EncodingSampler<AbstractTestCase>,
    depth: number
  ): ActionStatement;

  abstract copy(): ActionStatement;

  hasChildren(): boolean {
    return !!this._args.length;
  }

  getChildren(): Statement[] {
    return [...this._args];
  }

  setChild(index: number, child: Statement) {
    this._args[index] = child;
  }
}
