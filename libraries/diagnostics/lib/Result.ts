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

export type Result<T, E extends BaseError = BaseError> =
  | SuccessResult<T>
  | FailureResult<E>;

type SuccessResult<T> = { success: true; result: T };
type FailureResult<E extends BaseError = BaseError> = {
  success: false;
  error: E;
};

export function success<T>(result: T): SuccessResult<T> {
  return {
    success: true,
    result: result,
  };
}

export function failure<E extends BaseError = BaseError>(
  error: E,
): FailureResult<E> {
  return {
    success: false,
    error: error,
  };
}

export function isSuccess<T, E extends BaseError = BaseError>(
  result: Result<T, E>,
): result is SuccessResult<T> {
  return result.success;
}

export function isFailure<T, E extends BaseError = BaseError>(
  result: Result<T, E>,
): result is FailureResult<E> {
  return !result.success;
}

export function unwrapOr<T, E extends BaseError = BaseError>(
  result: Result<T, E>,
  alternative: T,
) {
  return result.success ? result.result : alternative;
}

export function unwrap<T>(result: SuccessResult<T>) {
  return result.result;
}
