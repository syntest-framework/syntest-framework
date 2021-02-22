import {getProperty} from "../config";
import {GA, Individual, Objective} from "..";
import { appendFileSync, existsSync } from 'fs';
import Timeout = NodeJS.Timeout;


let overTimeWriter: Timeout

export function startOverTimeWriter(algo: GA) {
    const file = `${getProperty("csv_output")}/cov_over_time_.csv`
    overTimeWriter = setInterval(() => {
        let data = `${Date.now()}, ${gatherOutputValues(getProperty("csv_output_values"), algo)}\n`

        if (!existsSync(file)) {
            writeToFile(file, `timestamp, ${gatherHeaderOutputValues(getProperty("csv_output_values"), algo)}\n`)
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
    const file = `${getProperty("csv_output")}/results.csv`

    // "targetName", "coveredBranches", "totalBranches", "branchCoverage"
    let data = `${Date.now()}, ${gatherOutputValues(getProperty("csv_output_values"), algo, objective)}\n`

    if (!existsSync(file)) {
        writeToFile(file, `timestamp, ${gatherHeaderOutputValues(getProperty("csv_output_values"), algo, objective)}\n`)
    }

    writeToFile(file, data)
}

function gatherHeaderOutputValues(outputValues: string[], algo: GA, objective: Objective | null = null) {
    let output = []

    if (outputValues.includes("targetName") && objective) {
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

    return output.join(", ")
}

function gatherOutputValues(outputValues: string[], algo: GA, objective: Objective | null = null) {
    let output = []

    if (outputValues.includes("targetName") && objective) {
        output.push(`${objective.target}`)
    }

    if (outputValues.includes("branch") && objective) {
        output.push(`${objective.line}, ${objective.locationIdx}`)
    }

    if (outputValues.includes("coveredBranches")) {
        output.push(`${algo.archive.size}`)
    }

    if (outputValues.includes("totalBranches")) {
        output.push(`${algo.fitness.getPossibleObjectives().length}`)
    }

    return output.join(", ")
}

async function writeToFile(file: string, data: string) {
    await appendFileSync(file, data)
}
