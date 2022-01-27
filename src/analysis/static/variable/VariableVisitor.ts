// import {
//   PublicVisibility,
//   PrivateVisibility,
//   TargetMetaData,
// } from "@syntest/framework";
// import { JavaScriptTargetMetaData } from "../JavaScriptTargetPool";
//
// export class VariableVisitor {
//
//   // function name (scope) -> variable name -> Variable object
//   private variables: Map<Scope, Map<string, Variable>>
//   // Stack because functions in functions in functions ... etc.
//   private currentScopeStack: Scope[]
//
//   constructor() {
//     this.variables = new Map()
//     this.currentScopeStack = []
//   }
//
//   private _enterScope(name: string, type: ScopeType) {
//     this.currentScopeStack.push({
//       name: name,
//       type: type
//     })
//
//     const scope = this.currentScopeStack.map((s) => s.name).join(' -> ')
//     if (!this.variables.has(scope)) {
//       this.variables.set(scope, new Map<string, Variable>())
//     }
//   }
//
//   private _exitScope(name) {
//     const popped = this.currentScopeStack.pop()
//
//     if (name !== popped) {
//       throw new Error("Popped scope is not equal to the exiting scope!")
//     }
//   }
//
//   // context
//   public ClassDeclaration = {
//     enter: (path) => {
//       this._enterScope(path.node.id.name, ScopeType.Class)
//     },
//     exit: (path) => {
//       this._exitScope(path.node.id.name)
//     }
//   }
//
//   public MethodDefinition = {
//     enter: (path) => {
//       this._enterScope(path.node.key.name, ScopeType.Method)
//     },
//     exit: (path) => {
//       this._exitScope(path.node.key.name)
//     }
//   }
//
//   public FunctionDeclaration = {
//     enter: (path) => {
//       this._enterScope(path.node.id.name, ScopeType.Function)
//     },
//     exit: (path) => {
//       this._exitScope(path.node.id.name)
//     }
//   }
//
//   // identifiers
//   public Identifier: (path) => void = (path) => {
//     const name = path.node.name
//     const parent = path.parentNode
//
//     let scope: Scope
//
//     let memberName: string = null
//
//     if (parent.type === 'MemberExpression') {
//       if (parent.object.type === 'ThisExpression') {
//         // get closest scope which allows "this.{something}"
//         scope = [...this.currentScopeStack].reverse().find((s) => s.type === ScopeType.Class || s.type === ScopeType.Function)
//
//         memberName = 'this'
//         if (!scope) {
//           throw new Error("Cannot find scope!")
//         }
//       } else {
//         if (parent.object.type !== 'Identifier') {
//         // TODO is this an option?
//           throw new Error("Unsupported MemberExpression object type!")
//         }
//
//         scope = {
//           name: parent.object.name,
//           type: ScopeType.Object
//         }
//         memberName = parent.object.name
//       }
//     } else {
//       // everything else must be
//       scope = this.currentScopeStack[this.currentScopeStack.length - 1]
//     }
//
//     let variable: Variable
//     if (this.variables.get(scope).has(name)) {
//       variable = this.variables.get(scope).get(name)
//     } else {
//       variable = {
//         name: name,
//         memberOf: memberName,
//         scope: scope,
//         usage: []
//       }
//       this.variables.get(scope).set(name, variable)
//     }
//
//     this._extractVariableUsage(parent, variable)
//   }
//
//   _extractVariableUsage(parent: any, variable: Variable): void {
//     switch (parent.type) {
//       case "ClassMethod":
//       // case "FunctionExpression":
//       case "FunctionDeclaration":
//         variable.usage.push({
//           type: UsageType.Parameter
//         })
//         break;
//
//       case "VariableDeclarator":
//         variable.usage.push({
//           type: UsageType.Assignment,
//         })
//         break;
//       // case "MemberExpression":
//       //   if (parent.object.type === 'ThisExpression') {
//       //     variable.usage.push({
//       //       type: UsageType.Assignment,
//       //
//       //     })
//       //   } else {
//       //     if (parent.object.type !== 'Identifier') {
//       //       // TODO is this an option?
//       //       throw new Error("Unsupported MemberExpression object type!")
//       //     }
//       //
//       //     scope = {
//       //       name: parent.object.name,
//       //       type: ScopeType.Object
//       //     }
//       //   }
//       //   break;
//       case "BinaryExpression":
//         variable.usage.push({
//           type: UsageType.BinaryOperation,
//           operation: parent.operator,
//
//         })
//         break;
//     }
//   }
//
//   // operations
//
//   // returns (for function types)
// }
//
// export interface Variable {
//   name: string, //
//   memberOf?: string, //
//   scope: Scope, // function name | global
//   usage: Usage[]
// }
//
// export interface Scope {
//   name: string,
//   type: ScopeType
// }
//
// export enum ScopeType {
//   Class,
//   Method,
//   Function,
//   Object
// }
//
// export interface Usage {
//   type: UsageType
//   operation?: string
//
//   rightside?: string
// }
// export enum UsageType {
//   BinaryOperation,
//   UnaryOperation,
//   Assignment,
//   FunctionCall,
//   Property,
//   Parameter,
// }
