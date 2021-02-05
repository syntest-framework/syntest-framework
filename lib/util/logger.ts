import {getProperty} from "../config";

import { createLogger, LoggerOptions, format, transports } from 'winston';


// define the custom settings for each transport (file, console)
const settings: any = {
    error: {
        level: 'error',
        filename: `./coverage/logs/error.log`,
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
        filename: `./coverage/logs/warn.log`,
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
        filename: `./coverage/logs/info.log`,
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
        filename: `./coverage/logs/http.log`,
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
        filename: `./coverage/logs/verbose.log`,
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
        filename: `./coverage/logs/debug.log`,
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
        filename: `./coverage/logs/silly.log`,
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

let logger: any = null

// instantiate a new Winston Logger with the settings defined above
export function getLogger () {
    if (!logger) {
        throw new Error('You have to call setupLogger before the program can start')
    }
    return logger
}

export function setupLogger() {
    let options: LoggerOptions = <LoggerOptions> {
        transports: [
            new transports.Console(settings[getProperty("console_log_level")]),
            ...getProperty("log_to_file").map((logLevel: string) => new transports.File(settings[logLevel]))
        ],
        exitOnError: false // do not exit on handled exceptions
    }
    logger = createLogger(options)
}
