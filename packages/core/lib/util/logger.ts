/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { createLogger, format, LoggerOptions, transports } from "winston";
import { CONFIG } from "../Configuration";
import { singletonNotSet } from "../Diagnostics";

// define the custom settings for each transport (file, console)
function getLoggerSettings(logDirectory: string): unknown {
  return {
    error: {
      level: "error",
      filename: `${logDirectory}/error.log`,
      handleExceptions: true,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    warn: {
      level: "warn",
      filename: `${logDirectory}/warn.log`,
      handleExceptions: true,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    info: {
      level: "info",
      filename: `${logDirectory}/info.log`,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    http: {
      level: "http",
      filename: `${logDirectory}/http.log`,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    verbose: {
      level: "verbose",
      filename: `${logDirectory}/verbose.log`,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    debug: {
      level: "debug",
      filename: `${logDirectory}/debug.log`,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.timestamp(),
        format.simple()
      ),
    },
    silly: {
      level: "silly",
      filename: `${logDirectory}/silly.log`,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 1,
      colorize: false,
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.simple(),
        format.timestamp()
      ),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let logger: any = null;

// instantiate a new Winston Logger with the settings defined above
export function getLogger(): unknown {
  if (!logger) {
    throw new Error(singletonNotSet("logger"));
  }
  return logger;
}

export function setupLogger(): void {
  if (logger) {
    // close existing one before creating a new one.
    logger.close();
  }
  const settings = getLoggerSettings(CONFIG.logDirectory);

  const options: LoggerOptions = <LoggerOptions>{
    transports: [
      ...CONFIG.logToFile.map(
        (logLevel: string) => new transports.File(settings[logLevel])
      ),
    ],
    exitOnError: false, // do not exit on handled exceptions
  };
  logger = createLogger(options);
}
