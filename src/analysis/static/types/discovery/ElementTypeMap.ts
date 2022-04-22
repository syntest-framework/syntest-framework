import { Element } from "./Element";
import { TypeProbability } from "../resolving/TypeProbability";

export class ElementTypeMap {

  private elementMap: Map<string, Element>
  private typeMap: Map<string, TypeProbability>

  constructor() {
    this.elementMap = new Map<string, Element>()
    this.typeMap = new Map<string, TypeProbability>()
  }

  elementAsString(element: Element) {
    return `scope={
    name=${element.scope.name};
    type=${element.scope.type};
    filePath=${element.scope.filePath}
    };
    type=${element.type};
    value=${element.value}`
  }

  set(element: Element, typeProbability: TypeProbability) {
    const elString = this.elementAsString(element)

    this.elementMap.set(elString, element)
    this.typeMap.set(elString, typeProbability)
  }

  has(element: Element): boolean {
    const elString = this.elementAsString(element)

    return this.elementMap.has(elString)
  }

  get(element: Element): TypeProbability {
    const elString = this.elementAsString(element)

    return this.typeMap.get(elString)
  }

  keys (): IterableIterator<Element> {
    return this.elementMap.values()
  }

  values (): IterableIterator<TypeProbability> {
    return this.typeMap.values()
  }
}