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
import { IdentifierDescription } from "../../analysis/static/parsing/IdentifierDescription";
import { ArrayStatement } from "../statements/complex/ArrayStatement";
import { ObjectStatement } from "../statements/complex/ObjectStatement";
import { TypeProbability } from "../../analysis/static/types/resolving/TypeProbability";
import { TypeEnum } from "../../analysis/static/types/resolving/TypeEnum";
import { NullStatement } from "../statements/primitive/NullStatement";
import { UndefinedStatement } from "../statements/primitive/UndefinedStatement";

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
      action.returnParameter.typeProbabilityMap.getRandomType(),
      prng.uniqueId(),
      action.name,
      args
    );
  }

  sampleConstructor(depth: number): ConstructorCall {
    const constructors = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.CONSTRUCTOR);

    const typeMap = new TypeProbability([[this.subject.name, 1, {
      name: this.subject.name,
      import: '', // TODO
      properties: new Set(), // TODO
      functions: new Set() // tODO
    }]])

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
        { typeProbabilityMap: typeMap, name: this.subject.name },
        this.subject.name,
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
        { typeProbabilityMap: typeMap, name: this.subject.name },
        this.subject.name,
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

    const args: Statement[] = action.parameters.map((param) => {
      return this.sampleArgument(depth + 1, param)
    });

    return new MethodCall(
      action.returnParameter,
      action.returnParameter.typeProbabilityMap.getRandomType(),
      prng.uniqueId(),
      action.name,
      args
    );
  }

  sampleArgument(depth: number, identifierDescription: IdentifierDescription): Statement {
    // TODO more complex sampling of function return values
    // Take regular primitive value

    if (!identifierDescription) {
      identifierDescription = {
        name: "unnamed",
        typeProbabilityMap: new TypeProbability()
      }
    }

    let chosenType: string

    if (Properties['type_inference_mode'] === 'roulette') {
      chosenType = identifierDescription.typeProbabilityMap.getRandomType()
    } else if (Properties['type_inference_mode'] === 'elitist') {
      chosenType = identifierDescription.typeProbabilityMap.getEliteType()
    } else if (Properties['type_inference_mode'] === 'dynamic') {
      chosenType = identifierDescription.typeProbabilityMap.getDynamicType()
    } else {
      throw new Error("Invalid identifierDescription inference mode selected")
    }


    if (chosenType === 'any') {
      // TODO other types would also be nice (complex type especially)
      chosenType = prng.pickOne(['function', 'array', 'boolean', 'string', 'numeric', 'null', 'undefined', 'object'])
    }

    // TODO REGEX
    if (chosenType === "function") {
      // TODO expectation of return value
      return new ArrowFunctionStatement(
        identifierDescription,
        chosenType,
        prng.uniqueId(),
        this.sampleArgument(depth + 1, { name: 'returnValue', typeProbabilityMap: new TypeProbability() })
      )
    } else if (chosenType === 'array') {
      return this.sampleArray(identifierDescription, chosenType, depth)
    }else if (chosenType === "boolean") {
      return this.sampleBool(identifierDescription, chosenType);
    } else if (chosenType === "string") {
      return this.sampleString(identifierDescription, chosenType);
    } else if (chosenType === "numeric") {
      return this.sampleNumber(identifierDescription, chosenType);
    } else if (chosenType === "null") {
      return this.sampleNull(identifierDescription, chosenType)
    } else if (chosenType === "undefined") {
      return this.sampleUndefined(identifierDescription, chosenType)
    } else {
      // must be object
      return this.sampleObject(identifierDescription, chosenType, depth)
    }

    throw new Error(`Unknown type!\n${JSON.stringify(chosenType, null, 2)}`);
  }

  sampleObject(identifierDescription: IdentifierDescription, type: string, depth: number) {
    const keys: StringStatement[] = []
    const values: Statement[] = []

    const object = identifierDescription.typeProbabilityMap.getObjectDescription(type)

    if (identifierDescription.name.includes("%")) {
      throw new Error("XXX")
    }
    if (object) {
      if (object.import && object.import.length) {
        const constructors = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.CONSTRUCTOR);
        const constructor = constructors.find((c) => c.name === object.name && c.scope.filePath === object.import)

        // TODO constructors are only available of the current subject/file
        console.log(constructors)
        console.log(constructors.find((c) => c.scope.filePath === object.import))
        console.log(constructors.find((c) => c.name === object.name))
        console.log(constructor)

        if (constructor) {
          const args: Statement[] = constructor.parameters.map((param) => this.sampleArgument(depth + 1, param));

          const calls: Statement[] = []
          const methods = (<JavaScriptSubject>this._subject).getPossibleActions(ActionType.METHOD)
          const nCalls = methods.length && prng.nextInt(1, Math.min(Properties.max_action_statements, methods.length));
          for (let i = 0; i < nCalls; i++) {
            calls.push(this.sampleMethodCall(depth + 1))
          }

          return new ConstructorCall(
            identifierDescription,
            this.subject.name,
            prng.uniqueId(),
            args,
            calls,
            `${this.subject.name}`
          );
        }
      }

      object.properties.forEach((p) => {
        const typeMap = new TypeProbability()
        typeMap.addType(TypeEnum.STRING, 1, null)

        const identifierDescriptionKey = { typeProbabilityMap: typeMap, name: p }
        keys.push(new StringStatement(identifierDescriptionKey, TypeEnum.STRING, prng.uniqueId(), p, Properties.string_alphabet, Properties.string_maxlength))

        const propertyTypings = identifierDescription.typeProbabilityMap.getPropertyTypes(type)

        if (propertyTypings && propertyTypings.has(p)) {
          values.push(this.sampleArgument(depth + 1, { name: p, typeProbabilityMap: propertyTypings.get(p) }))
        } else {
          values.push(this.sampleArgument(depth + 1, { name: p, typeProbabilityMap: new TypeProbability() }))
        }
      })
    } else {
      // TODO random properties or none
    }

    if (identifierDescription.name.includes("%")) {
      throw new Error("XXX")
    }

    return new ObjectStatement(
      identifierDescription,
      type,
      prng.uniqueId(),
      keys,
      values
    )
  }

  sampleArray(identifierDescription: IdentifierDescription, type: string, depth: number) {
    const children = []

    for (let i = 0; i < prng.nextInt(0, 5); i++) {
      children.push(
        this.sampleArgument(depth + 1, { name: 'arrayValue', typeProbabilityMap: new TypeProbability() })
      )
    }
    return new ArrayStatement(
      identifierDescription,
      type,
      prng.uniqueId(),
      children
    )
  }

  sampleString(
    identifierDescription: IdentifierDescription = null,
    type: string = null,
    alphabet = Properties.string_alphabet,
    maxlength = Properties.string_maxlength
  ): StringStatement {
    if (!type) {
      type = TypeEnum.STRING
    }

    if (!identifierDescription) {
      const typeMap = new TypeProbability()
      typeMap.addType(type, 1, null)
      identifierDescription = { typeProbabilityMap: typeMap, name: "noname" }
    }

    const valueLength = prng.nextInt(0, maxlength - 1);
    let value = "";

    for (let i = 0; i < valueLength; i++) {
      value += prng.pickOne(alphabet);
    }

    return new StringStatement(
      identifierDescription,
      type,
      prng.uniqueId(),
      value,
      alphabet,
      maxlength
    );
  }

  sampleNull(
    identifierDescription: IdentifierDescription = null,
    type: string = null
  ): NullStatement {
    if (!type) {
      type = TypeEnum.NULL
    }

    if (!identifierDescription) {
      const typeMap = new TypeProbability()
      typeMap.addType(type, 1, null)
      identifierDescription = { typeProbabilityMap: typeMap, name: "noname" }
    }

    return new NullStatement(identifierDescription, type, prng.uniqueId());
  }

  sampleUndefined(
    identifierDescription: IdentifierDescription = null,
    type: string = null
  ): UndefinedStatement {
    if (!type) {
      type = TypeEnum.UNDEFINED
    }

    if (!identifierDescription) {
      const typeMap = new TypeProbability()
      typeMap.addType(type, 1, null)
      identifierDescription = { typeProbabilityMap: typeMap, name: "noname" }
    }

    return new UndefinedStatement(identifierDescription, type, prng.uniqueId());
  }

  sampleBool(
    identifierDescription: IdentifierDescription = null,
    type: string = null
  ): BoolStatement {
    if (!type) {
      type = TypeEnum.BOOLEAN
    }

    if (!identifierDescription) {
      const typeMap = new TypeProbability()
      typeMap.addType(type, 1, null)
      identifierDescription = { typeProbabilityMap: typeMap, name: "noname" }
    }

    return new BoolStatement(identifierDescription, type, prng.uniqueId(), prng.nextBoolean());
  }

  sampleNumber(
    identifierDescription: IdentifierDescription = null,
    type: string = null
  ): NumericStatement {
    if (!type) {
      type = TypeEnum.NUMERIC
    }

    if (!identifierDescription) {
      const typeMap = new TypeProbability()
      typeMap.addType(type, 1, null)
      identifierDescription = { typeProbabilityMap: typeMap, name: "noname" }
    }
    // by default we create small numbers (do we need very large numbers?)
    const max = Number.MAX_SAFE_INTEGER
    const min = Number.MIN_SAFE_INTEGER

    return new NumericStatement(
      identifierDescription,
      type,
      prng.uniqueId(),
      prng.nextDouble(min, max),
    );
  }
}
