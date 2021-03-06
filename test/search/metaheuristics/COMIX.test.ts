import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {
    Fitness, guessCWD, loadConfig, MOSA,
    NSGA2, Objective,
    processConfig,
    Runner,
    Sampler,
    setupLogger, setupOptions, Target
} from "../../../src";

import {COMIX} from "../../../src";
import {DummyTarget} from "../../mocks/DummyTarget.mock";
import {DummyFitness} from "../../mocks/DummyFitness.mock";
import {DummyIndividual} from "../../mocks/DummyTestCaseChromosome.mock";

/**
 * @author Dimitri Stallenberg
 */
describe('Test COMIX', function () {
    before(async () => {
        await guessCWD(null)
        await setupOptions("","")
        await loadConfig()
        await processConfig({}, '')
        await setupLogger()
    })
    it('Test if Special argument succeeds', () => {
        let objective1: Objective = {target: "mock", line: 1, locationIdx: 1};
        let objective2: Objective = {target: "mock", line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        let mockedRunner = <Runner>{} as any;
        let mockedSampler = <Sampler>{} as any;
        let mockedTarget = new DummyTarget([objective1, objective2]);
        let fitness: Fitness = new DummyFitness(mockedRunner, [objective1, objective2]);

        let nsga2 = new NSGA2(mockedTarget, fitness, mockedSampler)
        //let ga = new COMIX([], fitness, mockedSampler, nsga2)

        //ga.search((alg) => alg.currentGeneration > 10)
    })
})