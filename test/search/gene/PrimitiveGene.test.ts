import {PrimitiveGene, Sampler} from "../../../lib";

class dummyPrimitiveGene extends PrimitiveGene<string> {
    copy(): PrimitiveGene<string> {
        return this
    }

    mutate(sampler: Sampler, depth: number): PrimitiveGene<string> {
        return this
    }
}


test('Primitive genes have no children', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(!gene.hasChildren())
})

test('Primitive genes return empty children array', () => {
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', 'randomvalue')

    expect(gene.getChildren()).toEqual([])
})

test('Primitive gene gives correct value', () => {
    let value = 'randomvalue'
    let gene = new dummyPrimitiveGene('dummy', 'dummyGene', 'randomid', value)

    expect(gene.value).toEqual(value)
})

test('Primitive gene gives error for getrandom function', () => {
    expect(dummyPrimitiveGene.getRandom).toThrow()
})
