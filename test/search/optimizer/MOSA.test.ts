import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {Fitness, GeneOptionManager, Objective, Runner, Sampler} from "../../../lib";
import {MOSA} from "../../../lib/search/optimizer/MOSA";
import {DummyIndividual} from "../../DummyIndividual.test";
import {DummyFitness} from "../../mocks/DummyFitness.test";

/**
 * @author Annibale Panichella
 */
describe('Test MOSA', function () {

    it('Test Preference criterion', () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        const runner = Runner as jest.Mocked<typeof Runner>;
        // @ts-ignore
        let fitness: Fitness = new Fitness({nodes: [], edges: []}, runner);

        const geneOptions = GeneOptionManager as jest.Mocked<typeof GeneOptionManager>;
        const sampler = Sampler as jest.Mocked<typeof Sampler>;

        // @ts-ignore
        const mosa = new MOSA(fitness, geneOptions, sampler)
        const frontZero = mosa.preferenceCriterion([ind1, ind2, ind3], [objective1, objective2])

        expect(frontZero.length).toEqual(2)
        expect(frontZero).toContain(ind2)
        expect(frontZero).toContain(ind3)
    })

    it('Test Non Dominated front', () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        let ind4 = new DummyIndividual();
        ind4.setDummyEvaluation([objective1, objective2], [1, 1])

        let ind5 = new DummyIndividual();
        ind5.setDummyEvaluation([objective1, objective2], [5, 5])

        const runner = Runner as jest.Mocked<typeof Runner>;
        // @ts-ignore
        let fitness: Fitness = new Fitness({nodes: [], edges: []}, runner);

        const geneOptions = GeneOptionManager as jest.Mocked<typeof GeneOptionManager>;
        const sampler = Sampler as jest.Mocked<typeof Sampler>;

        // @ts-ignore
        const mosa = new MOSA(fitness, geneOptions, sampler)
        const front = mosa.getNonDominatedFront([objective1, objective2],[ind1, ind2, ind3, ind4, ind5])

        expect(front.length).toEqual(3)
        expect(front).toContain(ind2)
        expect(front).toContain(ind3)
        expect(front).toContain(ind4)
    })

    it('Test Preference Sorting', () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        let ind4 = new DummyIndividual();
        ind4.setDummyEvaluation([objective1, objective2], [1, 1])

        const runner = Runner as jest.Mocked<typeof Runner>;
        // @ts-ignore
        let fitness: Fitness = new Fitness({nodes: [], edges: []}, runner);

        const geneOptions = GeneOptionManager as jest.Mocked<typeof GeneOptionManager>;
        const sampler = Sampler as jest.Mocked<typeof Sampler>;

        // @ts-ignore
        const mosa = new MOSA(fitness, geneOptions, sampler)
        const front = mosa.preferenceSortingAlgorithm([ind1, ind2, ind3, ind4], [objective1, objective2])

        expect(front[0].length).toEqual(2)
        expect(front[0]).toContain(ind2)
        expect(front[0]).toContain(ind3)
        expect(front[1].length).toEqual(1)
        expect(front[1]).toContain(ind4)
        expect(front[2].length).toEqual(1)
        expect(front[2]).toContain(ind1)
    })

    it('Generation population size', async () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        let ind4 = new DummyIndividual();
        ind4.setDummyEvaluation([objective1, objective2], [1, 1])

        const runner = Runner as jest.Mocked<typeof Runner>;
        // @ts-ignore
        let fitness: Fitness = new DummyFitness({ nodes: [], edges: [] }, runner, [objective1, objective2])

        const geneOptions = GeneOptionManager as jest.Mocked<typeof GeneOptionManager>;
        const sampler = Sampler as jest.Mocked<typeof Sampler>;

        // @ts-ignore
        const mosa = new MOSA(fitness, geneOptions, sampler)
        const newPopulation = await mosa.generation([ind1, ind2, ind3, ind4])

        expect(newPopulation.length).toEqual(4)
    })

})
