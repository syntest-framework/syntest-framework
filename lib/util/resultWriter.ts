import {getProperty} from "../config";
import {GA, Individual, Objective} from "..";
import {appendFileSync, existsSync, mkdirSync} from 'fs';
import Timeout = NodeJS.Timeout;


let overTimeWriter: Timeout
let time: number = Date.now()


export function startOverTimeWriter(algo: GA) {
    const file = `${getProperty("statistics_directory")}/cov_over_time_.csv`
    overTimeWriter = setInterval(() => {
        time = Date.now()

        let data = `${gatherOutputValues(getProperty("output_properties"), algo)}\n`

        if (!existsSync(file)) {
            writeToFile(file, `${gatherHeaderOutputValues(getProperty("output_properties"), algo)}\n`)
        }

        // Write timestamp, no. covered branches
        writeToFile(file, data)
    }, 1000)
}

export function endOverTimeWriterIfExists() {
    if (overTimeWriter) {
        clearInterval(overTimeWriter)
    }
}

export function writeData(algo: GA, objective: Objective) {

    const file = `${getProperty("statistics_directory")}/results.csv`

    time = Date.now()

    let data = `${gatherOutputValues(getProperty("output_properties"), algo, objective)}\n`

    if (!existsSync(file)) {
        writeToFile(file, `${gatherHeaderOutputValues(getProperty("output_properties"), algo, objective)}\n`)
    }

    writeToFile(file, data)
}

export function writeSummary(algo: GA) {
    const file = `${getProperty("statistics_directory")}/summary.csv`

    time = Date.now()

    let data = `${gatherOutputValues(getProperty("output_properties"), algo)}\n`

    if (!existsSync(file)) {
        writeToFile(file, `${gatherHeaderOutputValues(getProperty("output_properties"), algo)}\n`)
    }

    writeToFile(file, data)

}

function gatherHeaderOutputValues(outputValues: string[], algo: GA, objective: Objective | null = null) {
    let output = []

    if (outputValues.includes("timestamp")) {
        output.push(`timestamp`)
    }

    if (outputValues.includes("targetName")) {
        output.push(`target`)
    }

    if (outputValues.includes("branch") && objective) {
        output.push(`branch_line_nr, branch_value`)
    }

    if (outputValues.includes("coveredBranches")) {
        output.push(`covered`)
    }

    if (outputValues.includes("totalBranches")) {
        output.push(`total`)
    }

    if (outputValues.includes("fitnessEvaluations")) {
        output.push(`fitnessEvaluations`)
    }

    return output.join(", ")
}

function gatherOutputValues(outputValues: string[], algo: GA, objective: Objective | null = null) {
    let output = []

    if (outputValues.includes("timestamp")) {
        output.push(`${time}`)
    }


    if (outputValues.includes("targetName")) {
        output.push(`${algo.target.name}`)
    }

    if (outputValues.includes("branch") && objective) {
        output.push(`${objective.line}, ${objective.locationIdx}`)
    }

    if (outputValues.includes("coveredBranches")) {
        output.push(`${algo.archive.size}`)
    }

    if (outputValues.includes("totalBranches")) {
        output.push(`${algo.objectives.length}`)
    }

    if (outputValues.includes("fitnessEvaluations")) {
        output.push(`${algo.fitness.evaluations}`)
    }

    return output.join(", ")
}


async function writeToFile(file: string, data: string) {
    await appendFileSync(file, data)
}
