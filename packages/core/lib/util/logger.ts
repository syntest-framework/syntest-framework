import {
  Logger,
  LoggerOptions,
  createLogger,
  format,
  transports,
} from "winston";
import { CONFIG } from "../Configuration";
import * as path from "path";
import { Encoding } from "../search/Encoding";
import { UserInterface } from "../ui/UserInterface";

export let LOGGER: Logger;

export function setupLogger<T extends Encoding>(
  userInterface?: UserInterface<T>
) {
  const fileTransportOptions: transports.FileTransportOptions = {
    maxsize: 5242880, // 5MB
    maxFiles: 1,
  };

  const loggerOptions: LoggerOptions = {
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
      ...CONFIG.fileLogLevel.map(
        (logLevel: string) =>
          new transports.File({
            ...fileTransportOptions,
            level: logLevel,
            filename: path.join(CONFIG.logDirectory, `${logLevel}.log`),
          })
      ),
      userInterface ||
        new transports.Console({
          format: format.cli(),
          level: CONFIG.consoleLogLevel,
          stderrLevels: ["fatal", "error", "warn"],
          debugStdout: false,
        }),
    ],
  };

  const searchLoggerOptions: LoggerOptions = {
    ...loggerOptions,
    defaultMeta: {
      module: "search-algorithm",
    },
  };

  LOGGER = createLogger(searchLoggerOptions);
}
