/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { TerminationTrigger } from "./TerminationTrigger";

/**
 * Termination trigger for interrupt signals.
 *
 * @author Mitchell Olsthoorn
 */
export class SignalTerminationTrigger implements TerminationTrigger {
  protected _triggered: boolean;

  constructor() {
    this._triggered = false;
    process.on("SIGINT", this.handle);
    process.on("SIGTERM", this.handle);
    process.on("SIGQUIT", this.handle);
  }

  /**
   * Handle the interrupt signal.
   *
   * @param signal the type of signal
   */
  public handle(signal: string): void {
    // TODO: use framework logger
    console.log(
      `Received ${signal}. Stopping search. Press Control-D to exit.`
    );
    this._triggered = true;
  }

  /**
   * @inheritDoc
   */
  public isTriggered(): boolean {
    return this._triggered;
  }
}
