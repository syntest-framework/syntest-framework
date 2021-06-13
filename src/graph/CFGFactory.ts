import { CFG } from "./CFG";

export interface CFGFactory {
  convertAST(AST: any): CFG;
}
