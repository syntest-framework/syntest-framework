import {Gene, getLogger, getProperty, Individual, prng} from "../../..";

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
            let donorSubtree = findSimilarSubtree(pair.child, rootB)

            if (donorSubtree === null) {
                // skip
                continue
            }
        
            pair.parent.setChild(pair.childIndex, donorSubtree.child.copy())
            donorSubtree.parent.setChild(donorSubtree.childIndex, pair.child.copy())
        }
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

    if (!similar.length) {
        // no similar options
        return null
    }

    return prng.pickOne(similar)
}
