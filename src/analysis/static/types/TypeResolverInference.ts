import { Scope, Element, Relation } from "../variable/VariableVisitor4";
import { TypeResolver } from "./TypeResolver";
import { Typing } from "./Typing";

export class TypeResolverInference extends TypeResolver{

  private scopes: Scope[]
  private elements: Element[]
  private relations: Relation[]

  private elementTypings: Map<Element, Typing> // TODO should be probability distribution per typing


  constructor(scopes: Scope[], elements: Element[], relations: Relation[]) {
    super()
    this.scopes = scopes
    this.elements = elements
    this.relations = relations

    this.resolveRelations()
  }

  private resolveRelations() {

  }

  getTyping(scope: Scope, variableName: string): Typing {

    // TODO resolve
    return undefined;
  }



}