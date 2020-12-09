const Yargs = require('yargs/yargs')
const decamelize = require('decamelize')
const path = require('path')
const findUp = require('find-up')

const {properties} = require('./properties')
import {getLogger} from "./util/logger";

let argv: any = null

async function guessCWD (cwd: any) {
    cwd = cwd || process.env.NYC_CWD || process.cwd()
    const pkgPath = await findUp('package.json', { cwd })
    if (pkgPath) {
        cwd = path.dirname(pkgPath)
    }

    return cwd
}

export async function processConfig(config: any, cwd: any) {
    cwd = await guessCWD(cwd)

    const yargs = Yargs([])
        .usage('truffle run syntest-solidity [options]')
        .usage('syntest-solidity [options]')
        .showHidden(false)

    setupOptions(yargs,  cwd)

    yargs
        .example('truffle run syntest-solidity --console_log_level debug', 'Setting the debug level')
        .example('syntest-solidity --population_size 10', 'Setting the population size')
        .epilog('visit ... for more documentation')
        .boolean('h')
        .boolean('version')
        .help(false)
        .version(false)

    yargs
        .config(config)
        .help('h')
        .alias('h', 'help')
        .version()

    let actualArgs = process.argv.slice(process.argv.indexOf('syntest-solidity') + 1)

    argv = yargs
        .wrap(yargs.terminalWidth())
        .parse(actualArgs)
}

function setupOptions (yargs: any, cwd: string) {
    Object.entries(properties).forEach(([name, setup]) => {
        const option = {
            // @ts-ignore
            description: setup.description,
            // @ts-ignore
            default: setup.default,
            // @ts-ignore
            type: setup.type,
            // @ts-ignore
            alias: setup.alias,
            global: false
        }

        if (name === 'cwd') {
            option.default = cwd
            option.global = true
        }

        if (option.type === 'array') {
            option.type = 'string'
        }

        const optionName = decamelize(name, '-')
        yargs.option(optionName, option)
    })
}

export function getProperty(setting: string): any {
    if (!argv) {
        getLogger().error(`First initiate the properties by calling processConfig.`)
        process.exit(1)
    }
    if (!(setting in argv)) {
        getLogger().error(`Setting: ${setting} is not a property.`)
        process.exit(1)
    }
    return argv[setting]
}