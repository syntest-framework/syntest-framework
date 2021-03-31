import { CFG } from "../graph/CFG";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";
import { Encoding } from "./Encoding";
import { Edge } from "../graph/Edge";
import { getLogger } from "../util/logger";

const { Graph, alg } = require("@dagrejs/graphlib");

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
   * Mapping of objective identifier to objective function
   * @protected
   */
  protected _objectives: Map<string, ObjectiveFunction<T>>;

  /**
   *
   * @protected
   */
  protected _paths: any;

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
    this._extractObjectives();
    this._extractPaths();
  }

  /**
   * Extract objectives from the subject
   * @protected
   */
  protected abstract _extractObjectives(): void;

  /**
   *
   * @protected
   */
  protected _extractPaths(): void {
    const g = new Graph();

    for (const node of this._cfg.nodes) {
      g.setNode(node.id);
    }

    for (const edge of this._cfg.edges) {
      g.setEdge(edge.from, edge.to);
      g.setEdge(edge.to, edge.from);
    }

    this._paths = alg.dijkstraAll(g, (e: any) => {
      const edge = this._cfg.edges.find((edge: Edge) => {
        if (
          String(edge.from) === String(e.v) &&
          String(edge.to) === String(e.w)
        ) {
          return true;
        }

        return (
          String(edge.from) === String(e.w) && String(edge.to) === String(e.v)
        );
      });
      if (!edge) {
        getLogger().error(`Edge not found during dijkstra operation.`);
        process.exit(1);
      }

      return edge.type === "-" ? 2 : 1;
    });
  }

  /**
   * Retrieve objectives.
   */
  public getObjectives(): ObjectiveFunction<T>[] {
    return Array.from(this._objectives.values());
  }

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

  public getPath(from: string, to: string) {
    return this._paths[from][to].distance;
  }

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
