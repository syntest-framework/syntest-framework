import {
  CFG,
  FunctionObjectiveFunction,
  NodeType,
  ObjectiveFunction,
  SearchSubject,
} from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { JavaScriptTargetMetaData } from "../analysis/static/JavaScriptTargetPool";
import { ActionDescription } from "../analysis/static/parsing/ActionDescription";
import { IdentifierDescription } from "../analysis/static/parsing/IdentifierDescription";
import { ActionVisibility } from "../analysis/static/parsing/ActionVisibility";
import { ActionType } from "../analysis/static/parsing/ActionType";
import { JavaScriptBranchObjectiveFunction } from "../criterion/JavaScriptBranchObjectiveFunction";

export enum SubjectType {
  class,
  function,
  object
}

export interface TypeScore {
  types: string[],
  failed: boolean
}

export class JavaScriptSubject extends SearchSubject<JavaScriptTestCase> {

  private _functions: ActionDescription[]
  private _type: SubjectType

  private _typeScores: Map<string, TypeScore[]>



  reevaluateTypes() {
    // TODO find correlations
    // maybe look at bayesian inference
  }

  get functions(): ActionDescription[] {
    return this._functions;
  }

  constructor(
    path: string,
    targetMeta: JavaScriptTargetMetaData,
    cfg: CFG,
    functions: ActionDescription[],
  ) {
    super(path, targetMeta.name, cfg);
    // TODO SearchSubject should just use the targetMetaData
    this._type = targetMeta.type
    this._functions = functions
    this._typeScores = new Map()
  }

  protected _extractObjectives(): void {
    // Branch objectives
    // Find all branch nodes
    const branches = this._cfg.nodes
      .filter(
        (node) => node.type === NodeType.Branch
      )

    branches
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
                  new JavaScriptBranchObjectiveFunction(
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

    for (const objective of this._objectives.keys()) {
      const childrenObj = this.findChildren(objective);
      this._objectives.get(objective).push(...childrenObj);
    }

    // FUNCTION objectives
    this._cfg.nodes
      // Find all root function nodes
      .filter((node) => node.type === NodeType.Root)
      .forEach((node) => {
        // Add objective
        const functionObjective = new FunctionObjectiveFunction(
          this,
          node.id,
          node.lines[0]
        );
        const childrenObj = this.findChildren(functionObjective);
        this._objectives.set(functionObjective, childrenObj);
      });
  }

  findChildren(
    obj: ObjectiveFunction<JavaScriptTestCase>
  ): ObjectiveFunction<JavaScriptTestCase>[] {
    let childrenObj = [];

    let edges2Visit = this._cfg.edges.filter(
      (edge) => edge.from === obj.getIdentifier()
    );
    const visitedEdges = [];

    while (edges2Visit.length > 0) {
      const edge = edges2Visit.pop();

      if (visitedEdges.includes(edge))
        // this condition is made to avoid infinite loops
        continue;

      visitedEdges.push(edge);

      const found = this.getObjectives().filter(
        (child) => child.getIdentifier() === edge.to
      );
      if (found.length == 0) {
        const additionalEdges = this._cfg.edges.filter(
          (nextEdge) => nextEdge.from === edge.to
        );
        edges2Visit = edges2Visit.concat(additionalEdges);
      } else {
        childrenObj = childrenObj.concat(found);
      }
    }

    return childrenObj;
  }

  getPossibleActions(
    type?: ActionType,
    returnType?: IdentifierDescription
  ): ActionDescription[] {
    return this.functions.filter((f) => {
      if (returnType) {
        // TODO this will not work (comparing typeprobability maps)
        if (returnType.typeProbabilityMap !== f.returnParameter.typeProbabilityMap) {
          return false;
        }
      }

      return ((type === undefined || f.type === type) &&
        (f.visibility === ActionVisibility.PUBLIC) &&
        f.name !== "" // fallback function has no name
      );
    });
  }

  get type(): SubjectType {
    return this._type;
  }
}
