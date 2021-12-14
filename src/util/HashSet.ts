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

import { Decoder } from "../search/Decoder";
import { Encoding } from "../search/Encoding";

export class HashSet<T extends Encoding> extends Set<T> {
  private decoder: Decoder<T, string>;

  constructor(props: any, decoder: Decoder<T, string>) {
    super(props);
    this.decoder = decoder;
  }

  add(value: T): this {
    let found = false;
    this.forEach((item) => {
      if (item.hashCode(this.decoder) === value.hashCode(this.decoder)) {
        found = true;
      }
    });

    if (!found) {
      super.add(value);
    }

    return this;
  }
}
