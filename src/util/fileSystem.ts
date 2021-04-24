import {mkdirSync, readFileSync, rmdirSync} from "fs";
import { getProperty } from "../config";
const globby = require('globby')
import * as path from 'path'

export async function createDirectoryStructure() {
  // outputs
  await mkdirSync(`${getProperty("statistics_directory")}`, {
    recursive: true,
  });
  await mkdirSync(`${getProperty("log_directory")}`, { recursive: true });
  await mkdirSync(`${getProperty("final_suite_directory")}`, {
    recursive: true,
  });
  await mkdirSync(`${getProperty("cfg_directory")}`, { recursive: true });

  // temp
  await mkdirSync(`${getProperty("temp_test_directory")}`, { recursive: true });
  await mkdirSync(`${getProperty("temp_log_directory")}`, { recursive: true });
}

export async function deleteTempDirectories() {
  await rmdirSync(`${getProperty("temp_test_directory")}`);
  await rmdirSync(`${getProperty("temp_log_directory")}`);

  await rmdirSync(`.syntest`);
}

export async function loadTargetFiles(): Promise<{ [key: string]: TargetFile[] }> {
  let includes = getProperty("include")
  const excludes = getProperty("exclude")

  if (typeof includes === "string") {
    includes = [includes]
  }

  const includePaths = globby.sync(includes)
  const excludePaths = globby.sync(excludes)

  let includedTargets: TargetFile[] = []
  let excludedTargets: TargetFile[] = []

  const promises = []

  includePaths.forEach((_path) => {
    promises.push(new Promise(async (resolve) => {
      includedTargets.push({
        canonicalPath: path.resolve(_path),
        relativePath: path.basename(_path),
        source: await readFileSync(_path).toString()
      })
      resolve(null)
    }))
  })

  excludePaths.forEach((_path) => {
    promises.push(new Promise(async (resolve) => {
      excludedTargets.push({
        canonicalPath: path.resolve(_path),
        relativePath: path.basename(_path),
        source: await readFileSync(_path).toString()
      })
      resolve(null)
    }))
  })

  await Promise.all(promises)

  includedTargets = includedTargets.filter((a) => !excludedTargets.find((b) => a.canonicalPath === b.canonicalPath))

  return { included: includedTargets, excluded: excludedTargets }
}

export interface TargetFile {
  canonicalPath: string
  relativePath: string
  source: string
}
