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
import { Target } from "./Target";

export function getCommonBasePath(targets: Target[]): string {
  if (targets.length === 0) {
    return "";
  }

  const pathA = targets[0].canonicalPath;
  let finalCommonPathLength = pathA.length;

  for (let t = 0; t < targets.length; t++) {
    let pathB = targets[t].canonicalPath;

    const lastSlashIndex = pathB.lastIndexOf("/");
    pathB = pathB.substring(0, lastSlashIndex);

    let commonPathLength = 0;

    for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
      if (pathA[i] !== pathB[i]) {
        break;
      }
      commonPathLength = i;
    }

    finalCommonPathLength = Math.min(commonPathLength, finalCommonPathLength);
  }

  return pathA.substring(0, finalCommonPathLength + 1);
}
