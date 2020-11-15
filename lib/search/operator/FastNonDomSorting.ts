import {Individual} from "../gene/Individual";
import {logger} from "../..";

/**
 * Sort the population using fast non-dominated sorting
 * @param population the population to sort
 * @returns {[]} the newly sorted population
 *
 * @author Dimitri Stallenberg and Annibale Panichella
 */
export function fastNonDomSorting(population: Individual[]) {
    let S: { [id: string]: Individual[] } = {}
    let F: Individual[][] = [[]]
    let n: { [id: string]: number } = {}
    let indices: { [id: string]: number } = {}

    for (let index = 0; index < population.length; index++) {
        let p = population[index]
        indices[p.getId()] = index
        let Sp: Individual[] = []
        S[index] = Sp
        n[index] = 0
        for (let q of population) {
            let pDominatesQ = true
            let qDominatesP = true
            for (let key of p.getEvaluation().keys()) {
                // TODO maybe add this
                // if (!q.getEvaluation().has(key)) {
                //     logger.debug("You cannot use fast non dominated sorting on individuals that have different objectives")
                //     process.exit(1)
                //     continue
                // }

                if (p.getEvaluation().get(key)!! === 0 && q.getEvaluation().get(key)!! === 0) {
                    continue
                }
                if (p.getEvaluation().get(key)!! >= q.getEvaluation().get(key)!!) {
                    pDominatesQ = false
                }

                if (p.getEvaluation().get(key)!! <= q.getEvaluation().get(key)!!) {
                    qDominatesP = false
                }
            }

            if (pDominatesQ) {
                Sp.push(q)
            } else if (qDominatesP) {
                n[index] += 1
            }

        }

        if (n[index] === 0) {
            F[0].push(p)
        }
    }

    let i = 0
    while (F[i].length !== 0) {
        let H = []
        for (let p of F[i]) {
            for (let q of S[indices[p.getId()]]) {
                n[indices[q.getId()]] -= 1
                if (n[indices[q.getId()]] === 0) {
                    H.push(q)
                }

            }
        }
        i  += 1
        F.push(H)
    }

    // let's save the ranks
    var index = 0
    for( let front of F){
        for (let p of front){
            p.setRank(index)
        }
        index++
    }

    return F
}