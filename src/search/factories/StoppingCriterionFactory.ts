import {getProperty} from "../../config";

export function createCriterionFromConfig() {
    const stoppingCriteria = getProperty("stopping_criteria")

    let stringCriteria: string[] = []

    for (let criterion of stoppingCriteria) {
        if (criterion.criterion === 'generation_limit') {
            stringCriteria.push(`(GA.currentGeneration >= ${criterion.limit})`)
        } else if (criterion.criterion === 'time_limit') {
            stringCriteria.push(`(GA.timePast >= ${criterion.limit})`)
        } else if (criterion.criterion === 'coverage') {
            stringCriteria.push(`(GA.currentCoverage >= ${criterion.limit})`)
        } else {
            throw new Error(`${criterion.criterion} is not a valid stopping criterion.`)
        }
    }

    let functionString = `function (GA) { 
    console.log(GA.currentGeneration)
    console.log(GA.timePast)
    return ${stringCriteria.join(" || ")}; }`

    return new Function("return " + functionString)();
}