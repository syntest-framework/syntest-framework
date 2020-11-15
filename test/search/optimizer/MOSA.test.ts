import {Fitness, GeneOptionManager, Objective, Runner, Sampler} from "../../../lib";
import {MOSA} from "../../../lib/search/optimizer/MOSA";
import {DummyIndividual} from "../../DummyIndividual.test";

/**
 * @author Annibale Panichella
 */
describe('Test MOSA', function () {

    test('Test Preference criterion', () => {
        let objective1: Objective = {line: 1, locationIdx: 1};
        let objective2: Objective = {line: 1, locationIdx: 2};

        let ind1 = new DummyIndividual();
        ind1.setDummyEvaluation([objective1, objective2], [2, 3])

        let ind2 = new DummyIndividual();
        ind2.setDummyEvaluation([objective1, objective2], [0, 2])

        let ind3 = new DummyIndividual();
        ind3.setDummyEvaluation([objective1, objective2], [2, 0])

        let set = new Set<Objective>();
        set.add(objective1)
        set.add(objective2)

        const runner = Runner as jest.Mocked<typeof Runner>;
        // @ts-ignore
        let fitness: Fitness = new Fitness({nodes: [], edges: []}, runner);

        const geneOptions = GeneOptionManager as jest.Mocked<typeof GeneOptionManager>;
        const sampler = Sampler as jest.Mocked<typeof Sampler>;

        // @ts-ignore
        const mosa = new MOSA(fitness, geneOptions, sampler)
        const frontZero = mosa.preferenceCriterion([ind1, ind2], [objective1, objective2])

        expect(frontZero.length).toEqual(2)
        //expect(value).toEqual(-1)
    })

})