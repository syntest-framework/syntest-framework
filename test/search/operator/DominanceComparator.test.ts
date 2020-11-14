import {DominanceComparator} from "../../../lib/search/operator/DominanceComparator";
import {Objective} from "../../../lib";
import {DummyIndividual} from "../../DummyIndividual.test";

/**
 * @author Annibale Panichella
 */
test('Dominance comparator, fist dominates', () => {
    let objective1 : Objective = { line: 1, locationIdx: 1 };
    let objective2 : Objective = { line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1])

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1])

    let set = new Set<Objective>();
    set.add(objective1)
    set.add(objective2)
    let value = DominanceComparator.compare(ind1, ind2, set)

    expect(value == -1)
})

test('Dominance comparator, second dominates', () => {
    let objective1 : Objective = { line: 1, locationIdx: 1 };
    let objective2 : Objective = { line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [1, 1])

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 0])

    let set = new Set<Objective>();
    set.add(objective1)
    set.add(objective2)
    let value = DominanceComparator.compare(ind1, ind2, set)

    expect(value == 1)
})

test('Dominance comparator, none dominates', () => {
    let objective1 : Objective = { line: 1, locationIdx: 1 };
    let objective2 : Objective = { line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [1, 1])

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1])

    let set = new Set<Objective>();
    set.add(objective1)
    set.add(objective2)

    let value = DominanceComparator.compare(ind1, ind2, set)

    expect(value == 0)
})

test('Dominance comparator, none dominates three objective', () => {
    let objective1 : Objective = { line: 1, locationIdx: 1 };
    let objective2 : Objective = { line: 1, locationIdx: 2 };
    let objective3 : Objective = { line: 1, locationIdx: 3 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2, objective3], [1, 0, 1])

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2, objective3], [0, 1, 1])

    let set = new Set<Objective>();
    set.add(objective1)
    set.add(objective2)
    set.add(objective3)

    let value = DominanceComparator.compare(ind1, ind2, set)
    expect(value == 0)
})