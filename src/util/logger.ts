import { createLogger, format, LoggerOptions, transports } from "winston";
import { Properties } from "../properties";

// define the custom settings for each transport (file, console)
function getLoggerSettings(logDirectory: string): any {
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

let logger: any = null;

// instantiate a new Winston Logger with the settings defined above
export function getLogger() {
  if (!logger) {
    throw new Error(
      "You have to call setupLogger before the program can start"
    );
  }
  return logger;
}

export function setupLogger() {
  const settings = getLoggerSettings(Properties.log_directory);

  const options: LoggerOptions = <LoggerOptions>{
    transports: [
      new transports.Console(settings[Properties.console_log_level]),
      ...Properties.log_to_file.map(
        (logLevel: string) => new transports.File(settings[logLevel])
      ),
    ],
    exitOnError: false, // do not exit on handled exceptions
  };
  logger = createLogger(options);
}
