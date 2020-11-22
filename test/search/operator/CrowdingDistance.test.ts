import {logger, Objective} from "../../../lib";
import {DummyIndividual} from "../../mocks/DummyIndividual.mock";
import {crowdingDistance} from "../../../lib/search/operator/CrowdingDistance";

/**
 * @author Annibale Panichella
 */

describe('Crowding distance', function () {

    test('empty front', () => {
        crowdingDistance([])
    })

    test('front with one solution', () => {
        let ind = new DummyIndividual();
        crowdingDistance([ind])
        expect(ind.getCrowdingDistance()).toEqual(Number.POSITIVE_INFINITY)
    })


    test('front with two solutions', () => {
        let ind1 = new DummyIndividual();
        let ind2 = new DummyIndividual();

        crowdingDistance([ind1, ind2])
        expect(ind1.getCrowdingDistance()).toEqual(Number.POSITIVE_INFINITY)
        expect(ind2.getCrowdingDistance()).toEqual(Number.POSITIVE_INFINITY)
    })

    test('Front with more than two solutions', () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [0, 2])


        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [2, 0])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [1, 1])

        crowdingDistance([ind1, ind2, ind3])
        expect(ind1.getCrowdingDistance()).toEqual(Number.POSITIVE_INFINITY)
        expect(ind2.getCrowdingDistance()).toEqual(Number.POSITIVE_INFINITY)
        expect(ind3.getCrowdingDistance()).toEqual(2)
    })

    test('Corner case with same obj values for all individual', () => {
        let objective: Objective = {line: 1, locationIdx: 1};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective], [1])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective], [1])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective], [1])

        crowdingDistance([ind1, ind2, ind3])
        expect(ind1.getCrowdingDistance()).toEqual(0)
        expect(ind2.getCrowdingDistance()).toEqual(0)
        expect(ind3.getCrowdingDistance()).toEqual(0)
    })
})