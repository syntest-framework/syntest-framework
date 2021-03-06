import {mkdirSync, rmdirSync} from "fs";
import {getProperty} from "../config";

export async function createDirectoryStructure() {
    // outputs
    await mkdirSync(`${getProperty("statistics_directory")}`, { recursive: true })
    await mkdirSync(`${getProperty("log_directory")}`, { recursive: true })
    await mkdirSync(`${getProperty("final_suite_directory")}`, { recursive: true })
    await mkdirSync(`${getProperty("cfg_directory")}`, { recursive: true })

    // temp
    await mkdirSync(`${getProperty("temp_test_directory")}`, { recursive: true })
    await mkdirSync(`${getProperty("temp_log_directory")}`, { recursive: true })
}

export async function deleteTempDirectories() {
    await rmdirSync(`${getProperty("temp_test_directory")}`)
    await rmdirSync(`${getProperty("temp_log_directory")}`)

    await rmdirSync(`.syntest`)

}
