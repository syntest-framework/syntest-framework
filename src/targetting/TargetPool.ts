import {TargetFile} from "./TargetFile";

export abstract class TargetPool {
  private _included: TargetFile[];
  private _excluded: TargetFile[];

  abstract getSource(targetPath: string): string;

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
    return [ ...this.included, ...this._included ]
  }
}
