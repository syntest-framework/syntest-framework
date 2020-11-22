import * as chai from 'chai'

import {PrimitiveGene, Sampler} from "../../../lib";

const expect = chai.expect

class dummyPrimitiveGene extends PrimitiveGene<string> {
    copy(): PrimitiveGene<string> {
        return this
    }

    mutate(sampler: Sampler, depth: number): PrimitiveGene<string> {
        return this
    }
}


it('Primitive genes have no children', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(!gene.hasChildren())
})

it('Primitive genes return empty children array', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(gene.getChildren().length).to.equal(0)
})

it('Primitive gene gives correct value', () => {
    let value = 'randomvalue'
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', value)

    expect(gene.value).to.equal(value)
})

it('Primitive gene gives error for getrandom function', () => {
    expect(dummyPrimitiveGene.getRandom).throws()
})
