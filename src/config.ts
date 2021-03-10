const Yargs = require("yargs/yargs");
const decamelize = require("decamelize");
const path = require("path");
const findUp = require("find-up");
const shell = require("shelljs");

const { properties } = require("./properties");
import { getLogger } from "./util/logger";

let cwd: any = null;
let yargs: any = null;
let argv: any = null;

export async function guessCWD(givenCwd: any) {
  cwd = givenCwd || process.env.NYC_CWD || process.cwd();
  const pkgPath = await findUp("package.json", { cwd });
  if (pkgPath) {
    cwd = path.dirname(pkgPath);
  }
}

export function setupOptions(program: string, additionalOptions: any) {
  if (!cwd) {
    throw new Error("Please call guessCWD before calling setupOptions");
  }

  yargs = Yargs([]).usage(`${program} [options]`).showHidden(false);

  yargs
    .example(`${program} --population_size 10`, "Setting the population size")
    .epilog("visit ... for more documentation")
    .boolean("h")
    .boolean("version")
    .help(false)
    .version(false);

  let loadArg = ([name, setup]: [string, any]) => {
    const option = {
      // @ts-ignore
      description: setup.description,
      // @ts-ignore
      default: setup.default,
      // @ts-ignore
      type: setup.type,
      // @ts-ignore
      alias: setup.alias,
      global: false,
    };

    if (name === "cwd") {
      option.default = cwd;
      option.global = true;
    }

    if (option.type === "array") {
      option.type = "string";
    }

    if (name === "src_directory") {
      option.default = path.join(cwd, "/src");
    }

    if (name === "test_directory") {
      option.default = path.join(cwd, "/temp_test");
    }

    const optionName = decamelize(name, "-");
    yargs.option(optionName, option);
  };

  Object.entries(properties).forEach(loadArg);
  Object.entries(additionalOptions).forEach(loadArg);
}

export function loadConfig(args: any = {}, baseConfig: any = {}): any {
  if (!cwd || !yargs) {
    throw new Error("Please call setupOptions before calling loadConfig");
  }

  args.cwd = args.cwd || cwd;

  let config;
  let finalConfig;

  // Handle --config flag
  args.config
    ? (config = path.join(args.cwd, args.config))
    : (config = path.join(args.cwd, ".syntest.js"));

  // Catch syntestjs syntax errors
  if (shell.test("-e", config)) {
    try {
      finalConfig = require(config);
    } catch (error) {
      throw new Error(error);
    }
    // Config is optional
  } else {
    finalConfig = {};
  }

  finalConfig.cwd = args.cwd;

  // Solidity-Coverage writes to Truffle config
  args.mocha = args.mocha || {};

  if (finalConfig.mocha && typeof finalConfig.mocha === "object") {
    args.mocha = Object.assign(args.mocha, finalConfig.mocha);
  }

  return finalConfig;
}

export function processConfig(config: any = {}, args: any = {}) {
  if (!cwd || !yargs) {
    throw new Error("Please call loadConfig before calling processConfig");
  }

  yargs
    .config(config)
    .help("h")
    .alias("h", "help")
    .version("v")
    .alias("v", "version")
    .version();

  argv = yargs.wrap(yargs.terminalWidth()).parse(args);
}

export function getProperty(setting: string): any {
  if (!argv) {
    getLogger().error(
      `First initiate the properties by calling processConfig.`
    );
    process.exit(1);
  }
  if (!(setting in argv)) {
    getLogger().error(`Setting: ${setting} is not a property.`);
    process.exit(1);
  }
  return argv[setting];
}
