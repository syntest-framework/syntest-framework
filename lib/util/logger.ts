import {getSetting} from "./Config";

import { createLogger, LoggerOptions, format, transports } from 'winston';


// define the custom settings for each transport (file, console)
const settings: any = {
    error: {
        level: 'error',
        filename: `./logs/error.log`,
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        ),
    },
    warn: {
        level: 'warn',
        filename: `./logs/warn.log`,
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        ),
    },
    info: {
        level: 'info',
        filename: `./logs/info.log`,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        ),
    },
    http: {
        level: 'http',
        filename: `./logs/http.log`,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        ),
    },
    verbose: {
        level: 'verbose',
        filename: `./logs/verbose.log`,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        ),
    },
    debug: {
        level: 'debug',
        filename: `./logs/debug.log`,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.timestamp(),
            format.simple(),
        )
    },
    silly: {
        level: 'silly',
        filename: `./logs/silly.log`,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false,
        format: format.combine(
            format.splat(),
            format.errors({ stack: true }),
            format.simple(),
            format.timestamp(),
        ),
    },
}

let options: LoggerOptions = <LoggerOptions> {
    transports: [
        new transports.Console(settings[getSetting("console_log_level")]),
        ...getSetting("log_to_file").map((logLevel: string) => new transports.File(settings[logLevel]))
    ],
    exitOnError: false // do not exit on handled exceptions
}


// instantiate a new Winston Logger with the settings defined above
export const logger = createLogger(options)
