export enum PluginEnum {
  listener = "Listener",
  crossover = "Crossover",
  sampler = "Sampler",
  searchAlgorithm = "Search algorithm",
  terminationTrigger = "Termination trigger",
  userInterface = "User-interface",
}

export const pluginNotFound = (plugin: PluginEnum, name: string) =>
  `${plugin} plugin not found\nSpecified ${plugin} plugin: '${name}' not found in pluginManager.`;
export const pluginHasNoRegister = (path: string) =>
  `Could not load plugin\nPlugin has no register function\nPlugin: ${path}`;
export const pluginCannotBeLoaded = (path: string) =>
  `Could not load plugin\nReason Unknown\nPlugin: ${path}`;
export const pluginAlreadyRegistered = (plugin: PluginEnum, name: string) =>
  `Plugin already registered\nPlugin with name: '${name}' is already registered as a ${plugin.toLowerCase()} plugin.`;

export const pluginRequiresOptions = (pluginName: string, option: string) =>
  `${pluginName} plugin requires '${option}' option`;

export const shouldNeverHappen = (bugLocation: string) =>
  `This should never happen.\nThere is likely a bug in the ${bugLocation}.`;

export const minimumValue = (name: string, minimum: number, actual: number) =>
  `The '${name}' should be greater than or equal to ${minimum} but is ${actual}.`;
export const maximumValue = (name: string, maximum: number, actual: number) =>
  `The '${name}' should be smaller than or equal to ${maximum} but is ${actual}.`;

export const singleTonNotSet = (name: string) =>
  `The ${name} singleton has not been set yet!`;
export const singleTonAlreadySet = (name: string) =>
  `The ${name} singleton has already been set!`;

export const emptyArray = (variableName: string) =>
  `'${variableName}' cannot be empty!`;
