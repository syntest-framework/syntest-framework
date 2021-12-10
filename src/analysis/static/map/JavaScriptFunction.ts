import { FunctionDescription, Visibility } from "@syntest/framework";

export interface JavaScriptFunction extends FunctionDescription {
  isStatic: boolean;
  isAsync: boolean;
}

/**
 * Function can only be called from child classes.
 */
export const ProtectedVisibility: Visibility = {
  name: "protected",
};
