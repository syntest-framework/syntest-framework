/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { Module, ModuleManager } from "@syntest/module";

import { PublisherWSPlugin } from "./PublisherWSPlugin";

export default class PublisherModule extends Module {
  private publisher: PublisherWSPlugin;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    super("publisherWS", "6");
  }

  register(moduleManager: ModuleManager): void {
    this.publisher = new PublisherWSPlugin();
    moduleManager.registerPlugin(this.name, this.publisher);
  }

  override async prepare(): Promise<void> {
    await this.publisher.connect();
  }

  override cleanup(): void {
    this.publisher.disconnect();
  }
}
