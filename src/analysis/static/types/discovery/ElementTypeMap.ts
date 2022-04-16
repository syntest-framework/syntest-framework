import { Element } from "./Element";
import { TypeProbabilityMap } from "../resolving/TypeProbabilityMap";

export class ElementTypeMap {

  private elementMap: Map<string, Element>
  private typeMap: Map<string, TypeProbabilityMap>

  constructor() {
    this.elementMap = new Map<string, Element>()
    this.typeMap = new Map<string, TypeProbabilityMap>()
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

  set(element: Element, typeProbabilityMap: TypeProbabilityMap) {
    const elString = this.elementAsString(element)

    this.elementMap.set(elString, element)
    this.typeMap.set(elString, typeProbabilityMap)
  }

  has(element: Element): boolean {
    const elString = this.elementAsString(element)

    return this.elementMap.has(elString)
  }

  get(element: Element): TypeProbabilityMap {
    const elString = this.elementAsString(element)

    return this.typeMap.get(elString)
  }

  keys (): IterableIterator<Element> {
    return this.elementMap.values()
  }

  values (): IterableIterator<TypeProbabilityMap> {
    return this.typeMap.values()
  }
}