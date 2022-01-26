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

import { Encoding } from "./Encoding";

/**
 * Decoder interface.
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 *
 * @param E the encoding to decode
 * @param D the Object type to decode the encoding to
 */
export interface Decoder<E extends Encoding, D> {
  /**
   * Creates a decoded version of an encoding
   *
   * @param encoding             the encoding to decode
   * @param targetName           the name of the target, used to create informative decodings
   * @return decoded             the decoded encoding
   */
  decode(encoding: E, targetName: string): D;
}
