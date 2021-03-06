import * as chai from 'chai'

import {PrimitiveStatement, Sampler} from "../../lib";

const expect = chai.expect

class dummyPrimitiveGene extends PrimitiveStatement<string> {
    copy(): PrimitiveStatement<string> {
        return this
    }

    mutate(sampler: Sampler, depth: number): PrimitiveStatement<string> {
        return this
    }
}


it('Primitive statements have no children', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(!gene.hasChildren())
})

it('Primitive statements return empty children array', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(gene.getChildren().length).to.equal(0)
})

it('Primitive chromosome gives correct value', () => {
    let value = 'randomvalue'
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', value)

    expect(gene.value).to.equal(value)
})

it('Primitive chromosome gives error for getrandom function', () => {
    expect(dummyPrimitiveGene.getRandom).throws()
})
