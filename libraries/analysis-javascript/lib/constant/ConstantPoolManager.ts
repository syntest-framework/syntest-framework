/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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

import { ConstantPool } from "./ConstantPool";

export class ConstantPoolManager {
  protected _targetConstantPool: ConstantPool;
  protected _contextConstantPool: ConstantPool;
  protected _dynamicConstantPool: ConstantPool;

  constructor(
    targetConstantPool: ConstantPool,
    contextConstantPool: ConstantPool,
    dynamicConstantPool: ConstantPool
  ) {
    this._targetConstantPool = targetConstantPool;
    this._contextConstantPool = contextConstantPool;
    this._dynamicConstantPool = dynamicConstantPool;
  }

  public get targetConstantPool(): ConstantPool {
    return this._targetConstantPool;
  }

  public get contextConstantPool(): ConstantPool {
    return this._contextConstantPool;
  }

  public get dynamicConstantPool(): ConstantPool {
    return this._dynamicConstantPool;
  }
}
