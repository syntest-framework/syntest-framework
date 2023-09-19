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

import { TypeEnum } from "@syntest/analysis-javascript";
import { Encoding, EncodingSampler } from "@syntest/search";

import { ContextBuilder } from "../../testbuilding/ContextBuilder";

/**
 * @author Dimitri Stallenberg
 */
export abstract class Statement {
  private _variableIdentifier: string;
  private _typeIdentifier: string;
  private _name: string;
  private _ownType: TypeEnum;
  protected _uniqueId: string;

  public get variableIdentifier(): string {
    return this._variableIdentifier;
  }

  public get typeIdentifier(): string {
    return this._typeIdentifier;
  }

  public get name(): string {
    return this._name;
  }

  get ownType(): TypeEnum {
    return this._ownType;
  }

  public get uniqueId(): string {
    return this._uniqueId;
  }

  /**
   * Constructor
   * @param identifierDescription
   * @param ownType
   * @param uniqueId
   */
  protected constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    ownType: TypeEnum,
    uniqueId: string
  ) {
    this._variableIdentifier = variableIdentifier;
    this._typeIdentifier = typeIdentifier;
    this._name = name;
    this._ownType = ownType;
    this._uniqueId = uniqueId;
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
   * Set a new child at a specified position
   *
   * WARNING: This function has side effects
   *
   * @param index the index position of the new child
   * @param newChild the new child
   */
  abstract setChild(index: number, newChild: Statement): void;

  /**
   * Decodes the statement
   * Note: when implementing this function please always decode the children of the statement before making getOrCreateVariableName on the context object.
   */
  abstract decode(context: ContextBuilder): Decoding[];
}

export interface Decoding {
  decoded: string;
  reference: Statement;
}
