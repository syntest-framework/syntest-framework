/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of Syntest Framework - Syntest Core.
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

export abstract class UserInterface {
  silent: boolean;
  verbose: boolean;

  constructor(silent = false, verbose = false) {
    this.silent = silent;
    this.verbose = verbose;
  }

  abstract report(text: string, args: string[]): void;

  abstract log(type: string, text: string): void;

  abstract debug(text: string): void;

  abstract info(text: string): void;

  abstract error(text: string): void;

  abstract startProgressBar(): void;

  abstract updateProgressBar(value: number, budget: number): void;

  abstract stopProgressBar(): void;
}

let userInterface: UserInterface;

export function getUserInterface(): UserInterface {
  if (!userInterface) {
    throw new Error("The UserInterface has not been set yet!");
  }

  return userInterface;
}

export function setUserInterface(ui: UserInterface): void {
  userInterface = ui;
}
