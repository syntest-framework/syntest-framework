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
import {
  Encoding,
  ObjectiveFunction,
  ObjectiveManager,
  SearchSubject,
} from "@syntest/search";

import { Model } from "./Model";

export interface ObjectiveRegisteredModel extends Model {
  archiveSize: number;
  covered: string[];
  current: string[];
  uncovered: string[];

  objectiveFunctionId: string;
  subjectName: string;
  subjectPath: string;
}

export function objectiveRegisteredModelFormatter<E extends Encoding>(
  objectiveManager: ObjectiveManager<E>,
  subject: SearchSubject<E>,
  objectiveFunction: ObjectiveFunction<E>
): ObjectiveRegisteredModel {
  return {
    archiveSize: objectiveManager.getArchive().size,
    covered: [...objectiveManager.getCoveredObjectives()].map((objective) =>
      objective.getIdentifier()
    ),
    current: [...objectiveManager.getCurrentObjectives()].map((objective) =>
      objective.getIdentifier()
    ),
    uncovered: [...objectiveManager.getUncoveredObjectives()].map((objective) =>
      objective.getIdentifier()
    ),

    objectiveFunctionId: objectiveFunction.getIdentifier(),
    subjectName: subject.name,
    subjectPath: subject.path,
  };
}
