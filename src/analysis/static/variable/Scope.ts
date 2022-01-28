export interface Scope {
  name: string,
  type: ScopeType
}

export enum ScopeType {
  Global="global",
  Class="class",
  Method="method",
  Function="function",
  Object="object"
}
