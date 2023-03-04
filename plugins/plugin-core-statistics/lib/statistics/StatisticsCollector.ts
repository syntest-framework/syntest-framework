/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { RuntimeVariable } from "./RuntimeVariable";

/**
 * Collector for runtime statistics.
 *
 * @author Mitchell Olsthoorn
 */
export class StatisticsCollector {
  /**
   * Mapping from runtime variable to value.
   * @protected
   */
  protected _variables: Map<RuntimeVariable, string>;

  /**
   * Mapping from total search time to another mapping from runtime variable to value.
   * @protected
   */
  protected _eventVariables: Map<number, Map<RuntimeVariable, string>>;

  /**
   * Constructor.
   */
  constructor() {
    this._variables = new Map<RuntimeVariable, string>();
    this._eventVariables = new Map<number, Map<number, string>>();
  }

  /**
   * Record a static variable in the collector.
   *
   * @param variable The variable type to record
   * @param value The variable value
   */
  public recordVariable(
    variable: RuntimeVariable,
    value: string
  ): StatisticsCollector {
    this._variables.set(variable, value);
    return this;
  }

  /**
   * Record a dynamic variable in the collector.
   *
   * The event is recorded at the current time of the search process.
   *
   * @param eventTime The time of the event
   * @param variable The variable type to record
   * @param value The variable value
   */
  public recordEventVariable(
    eventTime: number,
    variable: RuntimeVariable,
    value: string | number
  ): StatisticsCollector {
    // If other events already exist on this event time add it, otherwise create a new one
    if (this._eventVariables.has(eventTime)) {
      this._eventVariables.get(eventTime).set(variable, `${value}`);
    } else {
      this._eventVariables.set(
        eventTime,
        new Map<RuntimeVariable, string>().set(variable, `${value}`)
      );
    }

    return this;
  }

  /**
   * Return the static variables stored in the collector
   */
  public getVariables(): Map<RuntimeVariable, string> {
    return this._variables;
  }

  /**
   * Return the dynamic variables stored in the collector
   */
  public getEventVariables(): Map<number, Map<RuntimeVariable, string>> {
    return this._eventVariables;
  }
}
