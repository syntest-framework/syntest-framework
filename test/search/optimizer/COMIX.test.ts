import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {
    Fitness,
    GeneOptionManager, NSGA2,
    processConfig,
    Runner,
    Sampler,
    setupLogger
} from "../../../lib";

import {COMIX} from "../../../lib";

/**
 * @author Dimitri Stallenberg
 */
describe('Test COMIX', function () {
    before(async () => {
        await processConfig({}, '')
        await setupLogger()
    })
    it('Test if Special argument succeeds', () => {
        let mockedRunner = <Runner>{} as any;
        let mockedGeneOptions = <GeneOptionManager>{} as any;
        let mockedSampler = <Sampler>{} as any;

        // @ts-ignore
        let fitness: Fitness = new Fitness({nodes: [], edges: []}, mockedRunner);

        let ga = new COMIX(fitness, mockedGeneOptions, mockedSampler, NSGA2)

        ga.search((alg) => alg.currentGeneration > 10)
    })
})