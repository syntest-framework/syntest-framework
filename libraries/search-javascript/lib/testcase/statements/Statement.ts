/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { Encoding, EncodingSampler, shouldNeverHappen } from "@syntest/search";
import { prng } from "@syntest/prng";

import { JavaScriptDecoder } from "../../testbuilding/JavaScriptDecoder";

/**
 * @author Dimitri Stallenberg
 */
export abstract class Statement {
  private _id: string;
  private _name: string;
  private _type: string;
  private _uniqueId: string;
  private _varName: string;

  protected _classType: string;

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  get type(): string {
    return this._type;
  }

  public get uniqueId(): string {
    return this._uniqueId;
  }

  public get varName(): string {
    return this._varName;
  }

  get classType(): string {
    return this._classType;
  }

  /**
   * Constructor
   * @param identifierDescription
   * @param type
   * @param uniqueId
   */
  protected constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string
  ) {
    this._id = id;
    this._name = name;
    this._type = type;
    this._uniqueId = uniqueId;

    if (name.includes("<>")) {
      throw new Error(shouldNeverHappen("name cannot inlude <>"));
    }

    this._varName = type.includes("<>")
      ? name + "_" + type.split("<>")[1] + "_" + prng.uniqueId(4)
      : name + "_" + type + "_" + prng.uniqueId(4);
    this._varName = "_" + this.varName;
  }

  /**
   * Mutates the gene
   * @param sampler   the sampler object that is being used
   * @param depth     the depth of the gene in the gene tree
   * @return          the mutated copy of the gene
   */
  abstract mutate(sampler: EncodingSampler<Encoding>, depth: number): Statement;

  /**
   * Creates an exact copy of the current gene
   * @return  the copy of the gene
   */
  abstract copy(): Statement;

  /**
   * Checks whether the gene has children
   * @return  whether the gene has children
   */
  abstract hasChildren(): boolean;

  /**
   * Gets all children of the gene
   * @return  The set of children of this gene
   */
  abstract getChildren(): Statement[];

  /**
   * Decodes the statement
   */
  abstract decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[];

  abstract getFlatTypes(): string[];
}

export interface Decoding {
  decoded: string;
  reference: Statement;
  objectVariable?: string;
}
