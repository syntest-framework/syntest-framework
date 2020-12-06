import {Gene, getProperty, Individual, prng} from "../../..";

export function TreeCrossover (parentA: Individual, parentB: Individual) {
    let rootA = parentA.root.copy()
    let rootB = parentB.root.copy()

    let queueA: any = []

    for (let i = 0; i < rootA.getChildren().length; i++) {
        queueA.push({
            parent: rootA,
            childIndex: i,
            child: rootA.getChildren()[i]
        })
    }

    let crossoverOptions = []

    while (queueA.length) {
        let pair = queueA.shift()

        if (pair.child.hasChildren()) {
            pair.child.getChildren().forEach((child: Gene, index: number) => {
                queueA.push({
                    parent: pair.child,
                    childIndex: index,
                    child: child
                })
            })
        }

        if (prng.nextBoolean(getProperty("crossover_chance"))) {
            // crossover
            let donorSubtrees = findSimilarSubtree(pair.child, rootB)

            for (let donorTree of donorSubtrees) {
                crossoverOptions.push({
                    p1: pair,
                    p2: donorTree
                })
            }
        }
    }

    if (crossoverOptions.length) {
        let crossoverChoice = prng.pickOne(crossoverOptions)
        let pair = crossoverChoice.p1
        let donorTree= crossoverChoice.p2

        pair.parent.setChild(pair.childIndex, donorTree.child.copy())
        donorTree.parent.setChild(donorTree.childIndex, pair.child.copy())
    }

    return [new Individual(rootA), new Individual(rootB)]
}

function findSimilarSubtree(wanted: Gene, tree: Gene) {
    let queue: any = []
    let similar = []

    for (let i = 0; i < tree.getChildren().length; i++) {
        queue.push({
            parent: tree,
            childIndex: i,
            child: tree.getChildren()[i]
        })
    }

    while (queue.length) {
        let pair = queue.shift()

        if (pair.child.hasChildren()) {
            pair.child.getChildren().forEach((child: Gene, index: number) => {
                queue.push({
                    parent: pair.child,
                    childIndex: index,
                    child: child
                })
            })
        }

        if (wanted.type === pair.child.type) {
            similar.push(pair)
        }
    }

    return similar
}
