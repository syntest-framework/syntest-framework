import { JavaScriptTestCaseSampler } from "./JavaScriptTestCaseSampler";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import {
  ActionStatement,
  FunctionDescription,
  Parameter,
  prng,
  Properties,
  SearchSubject,
  Statement,
} from "@syntest/framework";
import { ConstructorCall } from "../statements/action/ConstructorCall";
import { FunctionCall } from "../statements/action/FunctionCall";
import { BoolStatement } from "../statements/primitive/BoolStatement";
import { StringStatement } from "../statements/primitive/StringStatement";
import { NumericStatement } from "../statements/primitive/NumericStatement";
import { StaticFunctionCall } from "../statements/action/StaticFunctionCall";


export class JavaScriptRandomSampler extends JavaScriptTestCaseSampler {

  constructor(subject: SearchSubject<JavaScriptTestCase>) {
    super(subject);
  }

  sample(): JavaScriptTestCase {
    const root = this.sampleConstructor(0)
    return new JavaScriptTestCase(root);
  }

  sampleStatement(depth: number, types: Parameter[], geneType = 'primitive'): Statement {
    if (geneType === "primitive") {
      if (types.length === 0) {
        throw new Error(
          "To sample a statement at least one type must be given!"
        );
      }

      if (types.length !== 1) {
        throw new Error(
          "Primitive can only have a single type, multiple where given."
        );
      }
      if (types[0].type === "bool") {
        return BoolStatement.getRandom(types[0]);
      } else if (types[0].type === "string") {
        return StringStatement.getRandom(types[0]);
      } else if (types[0].type === "number") {
        return NumericStatement.getRandom(types[0]);
      } else if (types[0].type == "") {
        throw new Error(
          `Type "" not recognized. It must be a bug in our parser!`
        );
      }
    } else if (geneType === "functionCall") {
      return this.sampleFunctionCallTypeBased(depth, types);
    } else if (geneType === "constructor") {
      return this.sampleConstructor(depth);
    }

    throw new Error(`Unknown types [${types.join(", ")}] ${geneType}!`);
  }

  sampleArgument(depth: number, type: Parameter): Statement {
    // check depth to decide whether to pick a variable

    let options = this._subject
      .getPossibleActions()
      .filter((a) => a.type === type.type)

    if (
      depth < Properties.max_depth &&
      options.length &&
      prng.nextBoolean(Properties.sample_func_as_arg)
    ) {
      // Take result from function call
      // TODO sample existing function call
      return this.sampleFunctionCallTypeBased(depth, [type]);
    }

    // Take regular primitive value
    // TODO sample existing primitive value
    return this.sampleStatement(depth, [type]);
  }

  sampleConstructor(depth: number): ConstructorCall {
    const constructors = this._subject.getPossibleActions("constructor");

    if (constructors.length > 0) {
      const action = <FunctionDescription>(
        prng.pickOne(constructors)
      );

      const args: Statement[] = []
      action.parameters
        .forEach((param) => {
          if (param.type != "") {
            args.push(
              this.sampleArgument(1, param)
            );
          }
        })

      // TODO this is stupid too much coupling
      const root = new ConstructorCall(
        [{ type: action.name, name: "contract" }],
        prng.uniqueId(),
        `${action.name}`,
        args,
        []
      );

      const nCalls = prng.nextInt(1, 5);
      for (let index = 0; index <= nCalls; index++) {
        const call = this.sampleFunctionCall(1, root);
        root.setMethodCall(index, call as ActionStatement);
      }
      return root;
    } {
      // if no constructors is available, we invoke the default (implicit) constructor
      const root = new ConstructorCall(
        [{ type: this._subject.name, name: "contract" }],
        prng.uniqueId(),
        `${this._subject.name}`,
        [],
        []
      );

      const nCalls = prng.nextInt(1, 5);
      for (let index = 0; index <= nCalls; index++) {
        const call = this.sampleFunctionCall(1, root);
        root.setMethodCall(index, call as ActionStatement);
      }

      return root;
    }
  }

  sampleFunctionCall(depth: number, root: ConstructorCall): FunctionCall {
    // TODO
    return undefined;
  }

  sampleFunctionCallTypeBased(depth: number, types: Parameter[]): FunctionCall {
    // TODO
    return undefined;
  }

  sampleStaticFunctionCallTypeBased(
    depth: number,
    types: Parameter[]
  ): StaticFunctionCall {
    // TODO
    return undefined
  }

}