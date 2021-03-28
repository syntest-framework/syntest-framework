import { CFG } from "../graph/CFG";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";
import { Encoding } from "./Encoding";

/**
 * Subject of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class SearchSubject<T extends Encoding> {
  /**
   * Name of the subject.
   * @protected
   */
  protected readonly _name: string;

  /**
   * Control flow graph of the subject.
   * @protected
   */
  protected readonly _cfg: CFG;

  /**
   * Function map of the subject.
   * @protected
   */
  protected readonly _functionMap: any;

  /**
   * Constructor.
   *
   * @param name Name of the subject
   * @param cfg Control flow graph of the subject
   * @param functionMap Function map of the subject
   * @protected
   */
  protected constructor(name: string, cfg: CFG, functionMap: any) {
    this._name = name;
    this._cfg = cfg;
    this._functionMap = functionMap;
  }

  /**
   * Retrieve objectives.
   */
  public abstract getObjectives(): ObjectiveFunction<T>[];

  /**
   * Return possible actions on this subject.
   *
   * @param type
   * @param returnType
   */
  public abstract getPossibleActions(
    type?: string,
    returnType?: string
  ): ActionDescription[];

  get name(): string {
    return this._name;
  }

  get cfg(): CFG {
    return this._cfg;
  }

  get functionMap(): any {
    return this._functionMap;
  }
}

export interface ActionDescription {
  name: string;
  type: string;
  visibility: string;
}
