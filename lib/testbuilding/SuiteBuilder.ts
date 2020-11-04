import {Individual} from "../search/gene/Individual";
import {Stringifier} from "./Stringifier";

const fs = require('fs')
const path = require('path')

/**
 * @author Dimitri Stallenberg
 */
export abstract class SuiteBuilder {
    get stringifier(): Stringifier {
        return this._stringifier;
    }

    private _stringifier: Stringifier

    constructor(stringifier: Stringifier) {
        this._stringifier = stringifier
    }

    // @ts-ignore
    abstract async writeTest (filePath: string, individual: Individual, addLogs = false, additionalAssertions: { [key: string]: string } = {}): Promise<void>

    abstract async createTests (population: Individual[]): Promise<void>

    async deleteTest(filepath: string) {
        await fs.unlinkSync(filepath)
    }

    async clearDirectory (dirPath: string, match = /.*\.(js)/g) {
        let dirContent = await fs.readdirSync(dirPath)

        for (let file of dirContent.filter((el: string) => el.match(match))) {
            await fs.unlinkSync(path.resolve(dirPath, file))
        }
    }
}



