import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {DominanceComparator} from "../../../src/search/comparators/DominanceComparator";
import {guessCWD, loadConfig, Objective, processConfig, setupLogger, setupOptions} from "../../../src";
import {DummyIndividual} from "../../mocks/DummyTestCaseChromosome.mock";

/**
 * @author Annibale Panichella
 */
describe('Dominance comparator', function () {
    before(async () => {
        await guessCWD(null)
        await setupOptions("","")
        await loadConfig()
        await processConfig({}, '')
        await setupLogger()
    })

    it('Fist individual dominates', () => {
        let objective1: Objective = {target: "mock", line: 1, locationIdx: 1};
        let objective2: Objective = {target: "mock", line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [0, 1])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [1, 1])

        let set = new Set<Objective>();
        set.add(objective1)
        set.add(objective2)
        let value = DominanceComparator.compare(ind1, ind2, set)

        expect(value).to.equal(-1)
    })

    it('Second individual dominates', () => {
        let objective1: Objective = {target: "mock", line: 1, locationIdx: 1};
        let objective2: Objective = {target: "mock", line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [1, 1])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [1, 0])

        let set = new Set<Objective>();
        set.add(objective1)
        set.add(objective2)
        let value = DominanceComparator.compare(ind1, ind2, set)

        expect(value).to.equal(1)
    })

    it('None dominates with two objectives', () => {
        let objective1: Objective = {target: "mock", line: 1, locationIdx: 1};
        let objective2: Objective = {target: "mock", line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [1, 1])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [1, 1])

        let set = new Set<Objective>();
        set.add(objective1)
        set.add(objective2)

        let value = DominanceComparator.compare(ind1, ind2, set)

        expect(value).to.equal(0)
    })

    it('None dominates with three objective', () => {
        let objective1: Objective = {target: "mock", line: 1, locationIdx: 1};
        let objective2: Objective = {target: "mock", line: 1, locationIdx: 2};
        let objective3: Objective = {target: "mock", line: 1, locationIdx: 3};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2, objective3], [1, 0, 1])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2, objective3], [0, 1, 1])

        let set = new Set<Objective>();
        set.add(objective1)
        set.add(objective2)
        set.add(objective3)

        let value = DominanceComparator.compare(ind1, ind2, set)
        expect(value).to.equal(0)
    })
})
