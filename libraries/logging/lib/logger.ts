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
import * as path from "path";

import {
  createLogger,
  format,
  Logger,
  LoggerOptions,
  transports,
} from "winston";

let baseLoggerOptions: LoggerOptions;

export function setupLogger(
  logDirectory: string,
  fileLogLevel: string[],
  consoleLogLevel: string
) {
  const fileTransportOptions: transports.FileTransportOptions = {
    maxsize: 5242880, // 5MB
    maxFiles: 1,
  };

  baseLoggerOptions = {
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
    transports: [
      ...fileLogLevel.map(
        (logLevel: string) =>
          new transports.File({
            ...fileTransportOptions,
            level: logLevel,
            filename: path.join(logDirectory, `${logLevel}.log`),
          })
      ),
    ],
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
}

export function getLogger(context: string): Logger {
  return createLogger({
    ...baseLoggerOptions,
    defaultMeta: {
      context: context,
    },
  });
}
