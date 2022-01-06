import {
  BranchNode, BranchObjectiveFunction,
  CFG,
  Encoding,
  FunctionDescription,
  NodeType,
  Parameter,
  PublicVisibility,
  SearchSubject,
} from "@syntest/framework";
import { JavaScriptFunction } from "../analysis/static/map/JavaScriptFunction";


export class JavaScriptSubject<T extends Encoding> extends SearchSubject<T> {

  constructor(
    path: string,
    name: string,
    cfg: CFG,
    functions: FunctionDescription[]
  ) {
    super(path, name, cfg, functions);
  }

  protected _extractObjectives(): void {
    // Branch objectives
    this._cfg.nodes
      // Find all branch nodes
      .filter(
        (node) => node.type === NodeType.Branch
      )
      .forEach((branchNode) => {
        this._cfg.edges
          // Find all edges from the branch node
          .filter((edge) => edge.from === branchNode.id)
          .forEach((edge) => {
            this._cfg.nodes
              // Find nodes with incoming edge from branch node
              .filter((node) => node.id === edge.to)
              .forEach((childNode) => {
                // Add objective function
                this._objectives.set(
                  new BranchObjectiveFunction(
                    this,
                    childNode.id,
                    branchNode.lines[0],
                    edge.branchType
                  ),
                  []
                );
              });
          });
      });

  }

  getPossibleActions(
    type?: string,
    returnTypes?: Parameter[]
  ): JavaScriptFunction[] {
    return this.functions.filter((f) => {
      if (returnTypes) {
        if (returnTypes.length !== f.returnParameters.length) {
          return false;
        }
        for (let i = 0; i < returnTypes.length; i++) {
          if (returnTypes[i].type !== f.returnParameters[i].type) {
            return false;
          }
        }
      }
      return ((type === undefined || f.type === type) &&
        (f.visibility === PublicVisibility) &&
        f.name !== "" // fallback function has no name
      );
    });
  }

}
