import {Individual} from "../gene/Individual";

/**
 * Compute the crowding distance for all individual int the front
 * @param front set of individual to consider for the crowding distance
 *
 * @author Annibale Panichella
 */
export function crowdingDistance(front: Individual[]) {
    let size = front.length

    if (size == 0)
        return;

    if (size == 1) {
        front[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
        return;
    }
    if (size == 2) {
        front[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
        front[1].setCrowdingDistance(Number.POSITIVE_INFINITY);
        return;
    }

    for (let index=0; index < front.length; index++){
        front[index].setCrowdingDistance(0.0);
    }

    //throw new Error('Front = '+ front + ' size = ' + size)

    let nObjectives = front[0].getEvaluation().fitness.length

    for (let index=0; index < nObjectives; index++){
        // sort the front in ascending order of fitness value
        let orderedFront = front.sort(function(a,b) {
            return a.getEvaluation().fitness[index] - b.getEvaluation().fitness[index]
        })

        let objectiveMin = orderedFront[0].getEvaluation().fitness[index]
        let objectiveMax = orderedFront[size - 1].getEvaluation().fitness[index]

        if (objectiveMin == objectiveMax)
            continue

        // set crowding distance for extreme points
        orderedFront[0].setCrowdingDistance(Number.POSITIVE_INFINITY);
        orderedFront[size - 1].setCrowdingDistance(Number.POSITIVE_INFINITY);


        // set crowding distance for all other points
        for (let j = 1; j < size - 1; j++) {
            let distance = orderedFront[j + 1].getEvaluation().fitness[index] - orderedFront[j - 1].getEvaluation().fitness[index]
            let denominator = Math.abs(objectiveMin - objectiveMax)
            distance = distance / denominator;
            distance += orderedFront[j].getCrowdingDistance();
            orderedFront[j].setCrowdingDistance(distance);
        }
    }
}