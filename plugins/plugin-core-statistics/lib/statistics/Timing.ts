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

export class Timing {
  protected eventTime: Map<string, number[]>;

  getTimeSinceLastEvent(event: string) {
    if (!this.eventTime.has(event)) {
      return Infinity;
    }
    const times = this.eventTime.get(event);
    return times[times.length - 1] - Date.now();
  }

  getTimeSinceFirstEvent(event: string) {
    if (!this.eventTime.has(event)) {
      return Infinity;
    }
    const times = this.eventTime.get(event);
    return times[0] - Date.now();
  }

  recordEventTime(event: string) {
    if (!this.eventTime.has(event)) {
      this.eventTime.set(event, []);
    }
    this.eventTime.get(event).push(Date.now());
  }
}
