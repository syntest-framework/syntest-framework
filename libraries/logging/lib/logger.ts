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

import { IllegalStateError } from "@syntest/diagnostics";
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";

let singletonLogger: WinstonLogger;

export function setupLogger(
  logDirectory: string,
  fileLogLevel: string[],
  consoleLogLevel: string
) {
  const fileTransportOptions: transports.FileTransportOptions = {
    maxsize: 5_242_880, // 5MB
    maxFiles: 1,
  };

  const baseLoggerOptions = {
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      verbose: 4,
      silly: 5,
    },
    silent: false,
    exitOnError: false,
    format: format.combine(
      format.timestamp(),
      format.json(),
      format.metadata(),
      format.errors({ stack: true })
    ),
    transports: fileLogLevel.map(
      (logLevel: string) =>
        new transports.File({
          ...fileTransportOptions,
          level: logLevel,
          filename: path.join(logDirectory, `${logLevel}.log`),
        })
    ),
  };

  if (consoleLogLevel !== "silent") {
    (<unknown[]>baseLoggerOptions.transports).push(
      new transports.Console({
        format: format.cli(),
        level: consoleLogLevel,
        stderrLevels: ["fatal", "error", "warn"],
        debugStdout: false,
      })
    );
  }
  singletonLogger = createLogger(baseLoggerOptions);
}

export function getLogger(context: string): Logger {
  if (singletonLogger === undefined) {
    throw new IllegalStateError(
      "Should call setupLogger function before using getLogger function!"
    );
  }
  return new SubLogger(context);
}

/**
 * We don't want to expose the structure of the sublogger so we only export the type of the class.
 */
export type Logger = InstanceType<typeof SubLogger>;

/**
 * We use the winston logger singleton in each sublogger.
 * We do this to prevent memory leaks since each instance of a winston logger registers a bunch of event listeners.
 */
class SubLogger {
  private _context: string;
  constructor(context: string) {
    this._context = context;
  }

  error(message: string) {
    singletonLogger.log({
      level: "error",
      message: message,
      meta: { context: this._context },
    });
  }

  warn(message: string) {
    singletonLogger.log({
      level: "warn",
      message: message,
      meta: { context: this._context },
    });
  }

  info(message: string) {
    singletonLogger.log({
      level: "info",
      message: message,
      meta: { context: this._context },
    });
  }

  debug(message: string) {
    singletonLogger.log({
      level: "debug",
      message: message,
      meta: { context: this._context },
    });
  }

  silly(message: string) {
    singletonLogger.log({
      level: "silly",
      message: message,
      meta: { context: this._context },
    });
  }
}
