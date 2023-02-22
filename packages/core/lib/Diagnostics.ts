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

export const pluginNotFound = (name: string, type: string) =>
  `${type} plugin not found\nSpecified ${type} plugin: '${name}' not found in pluginManager.`;
export const pluginHasNoRegister = (path: string) =>
  `Could not load plugin\nPlugin has no register function\nPlugin: ${path}`;
export const pluginCannotBeLoaded = (path: string) =>
  `Could not load plugin\nReason Unknown\nPlugin: ${path}`;
export const pluginAlreadyRegistered = (name: string, type: string) =>
  `Plugin already registered\nPlugin with name: '${name}' is already registered as a ${type.toLowerCase()} plugin.`;

export const pluginRequiresOptions = (pluginName: string, option: string) =>
  `${pluginName} plugin requires '${option}' option`;

export const shouldNeverHappen = (bugLocation: string) =>
  `This should never happen.\nThere is likely a bug in the ${bugLocation}.`;

export const minimumValue = (name: string, minimum: number, actual: number) =>
  `The '${name}' should be greater than or equal to ${minimum} but is ${actual}.`;
export const maximumValue = (name: string, maximum: number, actual: number) =>
  `The '${name}' should be smaller than or equal to ${maximum} but is ${actual}.`;

export const singletonNotSet = (name: string) =>
  `The ${name} singleton has not been set yet!`;
export const singletonAlreadySet = (name: string) =>
  `The ${name} singleton has already been set!`;

export const emptyArray = (variableName: string) =>
  `'${variableName}' cannot be empty!`;
