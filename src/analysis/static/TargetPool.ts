import { TargetFile } from "./TargetFile";
import { CFG } from "./graph/CFG";

export abstract class TargetPool {
  private _included: TargetFile[];
  private _excluded: TargetFile[];

  abstract getSource(targetPath: string): string;
  abstract getTargetMap(targetPath: string): Map<string, any>;
  abstract getFunctionMap(
    targetPath: string,
    targetName: string
  ): Map<string, any>;

  abstract getCFG(targetPath: string): CFG;
  abstract getAST(targetPath: string): any;

  set included(value: TargetFile[]) {
    this._included = value;
  }

  get included(): TargetFile[] {
    return this._included;
  }

  set excluded(value: TargetFile[]) {
    this._excluded = value;
  }

  get excluded(): TargetFile[] {
    return this._excluded;
  }

  get targetFiles(): TargetFile[] {
    return [...this.included, ...this._included];
  }
}
