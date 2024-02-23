/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { BaseError } from "./errors/BaseError";

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = "[Unable to stringify the thrown value]";
  try {
    stringified = JSON.stringify(value);
    // eslint-disable-next-line no-empty
  } catch {}

  return new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
}

export function ensureBaseError(value: unknown): BaseError {
  if (value instanceof BaseError) return value;

  const error = ensureError(value);

  return new BaseError(
    "unknown",
    "The error thrown is an error without using the SynTest specific error types.",
    { cause: error },
  );
}
