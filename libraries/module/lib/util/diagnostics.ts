/*
 * Copyright 2023-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This file is meant to provide consistent error messages throughout the tool.
 */

// Modules
export const modulePathNotFound = (path: string) =>
  `Could not load module\nFilepath is invalid\nPath: ${path}`;
export const moduleNotInstalled = (module: string) =>
  `Could not load module\nModule not installed globally or locally\nModule: ${module}`;
export const moduleNotCorrectlyImplemented = (
  property: string,
  module: string
) =>
  `Could not load module\nModule not correctly implemented\nMissing '${property}' property\nModule: ${module}`;
export const moduleCannotBeLoaded = (path: string) =>
  `Could not load module\nReason unknown\nModule: ${path}`;
export const moduleAlreadyLoaded = (name: string, module: string) =>
  `Could not load module\nModule with name '${name}' is already loaded\nModule: ${module}`;

// Plugins
export const pluginsNotFound = (type: string) =>
  `No plugins of type: '${type}' found in moduleManager.`;
export const pluginNotFound = (name: string, type: string) =>
  `${type} plugin not found\nSpecified ${type} plugin: '${name}' not found in moduleManager.`;
export const pluginRequiresOptions = (pluginName: string, option: string) =>
  `${pluginName} plugin requires '${option}' option`;
export const pluginAlreadyLoaded = (name: string, type: string) =>
  `Could not load plugin\nPlugin with name '${name}' is already loaded as a ${type.toLowerCase()} plugin.`;

// Tools
export const toolAlreadyLoaded = (name: string) =>
  `Could not load tool\nTool with name '${name}' is already loaded.`;
export const cannotAddChoicesToOptionWithoutChoices = (
  option: string,
  plugin: string
) =>
  `Could not add choices to option.\nOption '${option}' does not have choices defined.\nPlugin '${plugin}' tries to add choices to option '${option}'.`;

// Singletons
export const singletonNotSet = (name: string) =>
  `The ${name} singleton has not been set yet!`;
export const singletonAlreadySet = (name: string) =>
  `The ${name} singleton has already been set!`;
