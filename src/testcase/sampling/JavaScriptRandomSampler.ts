import { JavaScriptTestCaseSampler } from "./JavaScriptTestCaseSampler";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { prng, Properties } from "@syntest/framework";
import { ConstructorCall } from "../statements/root/ConstructorCall";
import { MethodCall } from "../statements/action/MethodCall";
import { BoolStatement } from "../statements/primitive/BoolStatement";
import { StringStatement } from "../statements/primitive/StringStatement";
import { NumericStatement } from "../statements/primitive/NumericStatement";
import { RootStatement } from "../statements/root/RootStatement";
import { Statement } from "../statements/Statement";
import { FunctionCall } from "../statements/root/FunctionCall";
import { JavaScriptSubject, SubjectType } from "../../search/JavaScriptSubject";
import { ArrowFunctionStatement } from "../statements/complex/ArrowFunctionStatement";
import { ActionDescription } from "../../analysis/static/parsing/ActionDescription";
import { ActionType } from "../../analysis/static/parsing/ActionType";
import { Parameter } from "../../analysis/static/parsing/Parameter";
import { TypeProbabilityMap } from "../../analysis/static/types/resolving/TypeProbabilityMap";
import { TypingType } from "../../analysis/static/types/resolving/Typing";


export class JavaScriptRandomSampler extends JavaScriptTestCaseSampler {

  constructor(subject: JavaScriptSubject) {
    super(subject);
  }


  sample(): JavaScriptTestCase {
    let root: RootStatement

    if ((<JavaScriptSubject>this._subject).type === SubjectType.function) {
      root = this.sampleFunctionCall(0)
    } else if ((<JavaScriptSubject>this._subject).type === SubjectType.class) {
      root = this.sampleConstructor(0)
    }

    // TODO could also be static access object

    return new JavaScriptTestCase(root);
  }

  sampleFunctionCall(depth: number): FunctionCall {
    const action = <ActionDescription>(
      prng.pickOne((<JavaScriptSubject>this._subject).getPossibleActions(ActionType.FUNCTION))
    );

    const args: Statement[] = action.parameters.map((param) => this.sampleArgument(depth + 1, param));

    return new FunctionCall(
      action.returnParameter,
      prng.uniqueId(),
      action.name,
      args
    );
  }

  sampleConstructor(depth: number): ConstructorCall {
    const constructors = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.CONSTRUCTOR);

    const typeMap = new TypeProbabilityMap()
    typeMap.addType({
      type: TypingType.OBJECT,
      name: this.subject.name,
      import: '' // TODO
    }, 1)

    if (constructors.length > 0) {
      const action = <ActionDescription>(
        prng.pickOne(constructors)
      );

      const args: Statement[] = action.parameters.map((param) => this.sampleArgument(depth + 1, param));

      const calls: Statement[] = []
      const methods = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.METHOD)
      const nCalls = methods.length && prng.nextInt(1, Math.min(Properties.max_action_statements, methods.length));
      for (let i = 0; i < nCalls; i++) {
        calls.push(this.sampleMethodCall(depth + 1))
      }

      return new ConstructorCall(
        { type: typeMap, name: "class" },
        prng.uniqueId(),
        args,
        calls,
        `${this.subject.name}`
      );
    } else {
      // if no constructors is available, we invoke the default (implicit) constructor

      const calls: Statement[] = []
      const methods = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.METHOD)
      const nCalls = methods.length && prng.nextInt(1, Math.min(Properties.max_action_statements, methods.length));
      for (let i = 0; i < nCalls; i++) {
        calls.push(this.sampleMethodCall(depth + 1))
      }

      return new ConstructorCall(
        { type: typeMap, name: "class" },
        prng.uniqueId(),
        [],
        calls,
        `${this._subject.name}`
      );
    }
  }

  sampleMethodCall(depth: number): MethodCall {
    const action = <ActionDescription>(
      prng.pickOne((<JavaScriptSubject>this._subject).getPossibleActions(ActionType.METHOD))
    );

    const args: Statement[] = action.parameters.map((param) => this.sampleArgument(depth + 1, param));

    return new MethodCall(
      action.returnParameter,
      prng.uniqueId(),
      action.name,
      args
    );
  }

  sampleArgument(depth: number, type: Parameter): Statement {

    // TODO sampling arrays or objects
    // TODO more complex sampling of function return values
    // Take regular primitive value

    const chosenType = type.type.getRandomType()

    if (chosenType.type === "function") {
      // TODO expectation of return value
      return new ArrowFunctionStatement(
        type,
        prng.uniqueId(),
        this.sampleArgument(depth + 1, {type: new TypeProbabilityMap(), name: 'noname'})
      )
    } else if (chosenType.type === 'object') {
      // TODO
      // return
    }

    if (chosenType.type === "boolean") {
      return BoolStatement.getRandom(type);
    } else if (chosenType.type === "string") {
      return StringStatement.getRandom(type);
    } else if (chosenType.type === "numeric") {
      return NumericStatement.getRandom(type);
      // TODO null
      // TODO REGEX
      // TODO
    } else if (chosenType.type === "any") {
      // TODO
      const choice = prng.nextInt(0, 2)
      if (choice === 0) {
        return BoolStatement.getRandom(type);
      } else if (choice === 1) {
        return StringStatement.getRandom(type);
      } else {
        return NumericStatement.getRandom(type);
      }
    }

    throw new Error(`Unknown type!\n${JSON.stringify(chosenType, null, 2)}`);
  }
}
