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

import * as path from "node:path";

import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";

import { LogSeverity, LogVerbosity, SynTestLogLevels } from "./LogLevels";

let syntestLogger: WinstonLogger;

export function setupLogger(
  consoleVerbosity: LogVerbosity,
  logDirectory: string,
  fileLogLevel: LogSeverity[],
  metadata: Record<string, unknown> = {}
) {
  syntestLogger = createLogger({
    levels: SynTestLogLevels.levels,
    defaultMeta: metadata,
    format: format.combine(
      format.timestamp(),
      format.json(),
      format.metadata(),
      format.errors({ stack: true })
    ),
    transports: [
      new transports.Console({
        level: consoleVerbosity === "silent" ? "error" : consoleVerbosity,
        silent: consoleVerbosity === "silent",
        format: format.cli({ colors: SynTestLogLevels.colors }),
        stderrLevels: ["fatal", "error"],
        consoleWarnLevels: ["warn"],
      }),
      ...fileLogLevel.map(
        (logLevel: string) =>
          new transports.File({
            level: logLevel,
            filename: path.join(logDirectory, `${logLevel}.log`),
          })
      ),
    ],
    exceptionHandlers: [
      new transports.File({
        filename: path.join(logDirectory, "exceptions.log"),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: path.join(logDirectory, "rejections.log"),
      }),
    ],
  });
}

type LogMethod = {
  (message: string, ...meta: unknown[]): void;
  (message: unknown): void;
};

export type Logger = {
  fatal: LogMethod;
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
  isLevelEnabled: (level: LogSeverity) => boolean;
  isFatalEnabled(): boolean;
  isErrorEnabled(): boolean;
  isWarnEnabled(): boolean;
  isInfoEnabled(): boolean;
  isDebugEnabled(): boolean;
  isTraceEnabled(): boolean;
};

export function getLogger(namespace: string): Logger {
  if (syntestLogger === undefined) {
    return {
      fatal: () => {
        /* do nothing */
      },
      error: () => {
        /* do nothing */
      },
      warn: () => {
        /* do nothing */
      },
      info: () => {
        /* do nothing */
      },
      debug: () => {
        /* do nothing */
      },
      trace: () => {
        /* do nothing */
      },
      isFatalEnabled: () => false,
      isLevelEnabled: () => false,
      isErrorEnabled: () => false,
      isWarnEnabled: () => false,
      isInfoEnabled: () => false,
      isDebugEnabled: () => false,
      isTraceEnabled: () => false,
    };
  }

  return <Logger>(<unknown>syntestLogger.child({ namespace: namespace }));
}
