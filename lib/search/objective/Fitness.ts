import {Individual} from "../..";
import {logger} from "../..";
import {Datapoint, Runner} from "../..";
import {Objective} from "./Objective";

const { Graph, alg } = require('@dagrejs/graphlib')

export interface Node {
    id: string
    absoluteRoot: boolean
    root: boolean
    locationIdx: number
    line: number
}

export interface Edge {
    from: string
    to: string
    type: string
}

export interface CFG {
    nodes: Node[]
    edges: Edge[]
}

/**
 * @author Dimitri Stallenberg
 */
export class Fitness {
    private cfg: CFG;
    private runner: Runner
    private paths: any;

    /**
     * Constructor
     */
    constructor(cfg: CFG, runner: Runner) {
        this.cfg = cfg
        this.runner = runner

        let cfgObject = this.getCFGObject()
        this.paths = alg.dijkstraAll(cfgObject, (e: any) => {
            let edge = this.cfg.edges.find((edge: Edge) => {
                if (String(edge.from) === String(e.v) && String(edge.to) === String(e.w)) {
                    return true
                }

                return String(edge.from) === String(e.w) && String(edge.to) === String(e.v)
            })
            if (!edge) {
                logger.error(`Edge not found during dijkstra operation.}`)
                process.exit(1)
            }

            return edge.type === '-' ? 2 : 1
        })
    }

    /**
     * Creates a Graph object from the cfg that is usable by the dagre-js library.
     * @returns {Graph}
     */
    getCFGObject () {
        let g = new Graph();

        for (let node of this.cfg.nodes) {
            g.setNode(node.id)
        }

        for (let edge of this.cfg.edges) {
            g.setEdge(edge.from, edge.to)
            g.setEdge(edge.to, edge.from)
        }

        return g
    }

    getPossibleObjectives (): Objective[] {
        return this.cfg.nodes.filter((n: any) => !n.absoluteRoot)
    }

    /**
     * This function evaluates an individual.
     *
     * @param individual the individual to evaluate
     * @param objectives the objectives to evaluate
     */
    async evaluateOne (individual: Individual, objectives: Objective[]) {
        logger.debug(`Evaluating individual ${individual.getId()}`)

        let dataPoints = await this.runner.runTest(individual)

        individual.setEvaluation({
            fitness: this.calculateDistance(dataPoints, objectives)
        })
    }

    /**
     * This function evaluates a population of individuals.
     *
     * @param population the population to evaluate
     * @param objectives the objectives to evaluate the population on
     */
    async evaluateMany (population: Individual[], objectives: Objective[]) {
        // TODO This should be done in parallel somehow
        for (let individual of population) {
            await this.evaluateOne(individual, objectives)
        }
    }

    calcBranchDistance (opcode: string, left: number, right: number) {
        let trueBranch = 0
        let falseBranch = 0
        let difference = Math.log10(Math.abs(left - right) + 1)

        switch (opcode) {
            case 'GT':
                if (left > right) {
                    falseBranch = (1 - (1 / (difference + 1)))
                } else {
                    difference += 1
                    trueBranch = (1 - (1 / (difference + 1)))
                }
                break
            case 'SGT':
                if (left >= right) {
                    difference += 1
                    falseBranch = (1 - (1 / (difference + 1)))
                } else {
                    trueBranch = (1 - (1 / (difference + 1)))
                }
                break
            case 'LT':
                if (left < right) {
                    falseBranch = (1 - (1 / (difference + 1)))
                } else {
                    difference += 1
                    trueBranch = (1 - (1 / (difference + 1)))
                }
                break
            case 'SLT':
                if (left <= right) {
                    difference += 1
                    falseBranch = (1 - (1 / (difference + 1)))
                } else {
                    trueBranch = (1 - (1 / (difference + 1)))
                }
                break
            case 'EQ':
                if (left === right) {
                    difference = 1
                    falseBranch = (1 - (1 / (difference + 1)))
                } else {
                    trueBranch = (1 - (1 / (difference + 1)))
                }
                break
        }

        if (trueBranch === 0) {
            return falseBranch
        } else {
            return trueBranch
        }
    }

    calculateDistance (dataPoints: Datapoint[], objectives: Objective[]) {
        let hitNodes = []

        for (let point of dataPoints) {
            // Check if it is a branch node and has been hit
            if (point.type !== 'branch' || point.hits === 0) {
                continue
            }

            // Check if the branch in question is currently an objective
            let objective = objectives.find((o) => {
                return o.locationIdx === point.locationIdx && o.line === point.line
            })

            if (!objective) {
                continue
            }

            // find the corresponding branch node inside the cfg
            let branchNode = this.cfg.nodes
                .filter((n: Node) => !n.absoluteRoot)
                .find((n: Node) => {
                    return n.locationIdx === point.locationIdx && n.line === point.line
                })

            if (!branchNode) {
                logger.error('Branch node not found!')
                process.exit(1)
            }

            // record hits
            hitNodes.push({
                node: branchNode,
                point: point
            })
        }

        let nodes = this.cfg.nodes.filter((n: Node) => !n.absoluteRoot && !n.root)

        // find fitness per target
        let fitness = [...nodes.map((n: Node) => Number.MAX_VALUE - 1)] // MAX Integer preferrably

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i]

            let objective = objectives.find((o) => {
                return o.locationIdx === node.locationIdx && o.line === node.line
            })

            if (!objective) {
                fitness[i] = Number.MAX_VALUE
                continue
            }

            let hitNode = hitNodes.find((h: any) => h.node === node)

            if (hitNode) {
                fitness[i] = 0
                continue
            }

            let closestHitNode = null
            let smallestDistance = Number.MAX_VALUE
            for (let n of hitNodes) {
                if (smallestDistance > this.paths[node.id][n.node.id].distance) {
                    smallestDistance = this.paths[node.id][n.node.id].distance
                    closestHitNode = n
                }
            }

            if (!closestHitNode) {
                logger.error('Closest hit node not found!')
                process.exit(1)
            }

            let approachDistance = Math.max(smallestDistance - 1, 0)
            let branchDistance = this.calcBranchDistance(closestHitNode.point.opcode, closestHitNode.point.left, closestHitNode.point.right)

            let distance = approachDistance + branchDistance
            fitness[i] = Math.min(distance, fitness[i])
        }

        return fitness
    }
}
