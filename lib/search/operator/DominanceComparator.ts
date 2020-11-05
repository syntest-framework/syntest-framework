import { Individual } from '../gene/Individual'
const {fastNonDomSorting} = require('../operator/FastNonDomSorting')
const {crowdingDistance} = require('../operator/CrowdingDistance')
const {tournamentSelection} = require('../operator/TournamentSelection')

export class DominanceComparator {
    /**
     * Fast Dominance Comparator as discussed in
     * "Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic
     *  Selection of the Targets"
     */
    protected static compare(individual1: Individual, individual2: Individual, targets: Set<BigInteger>): Number {
        let dominatesX = false
        let dominatesY = false

        for (let index in targets) {
            if (individual1.getEvaluation().fitness[index] < individual2.getEvaluation().fitness[index])
                dominatesX = true
            if (individual1.getEvaluation().fitness[index] > individual2.getEvaluation().fitness[index])
                dominatesY = true

            // if the both do not dominates each other, we don't
            // need to iterate over all the other targets
            if (dominatesX && dominatesY)
                return 0
        }

        if (dominatesX == dominatesY)
            return 0

        else if (dominatesX)
            return -1

        else (dominatesY)
        return +1
    }
}
