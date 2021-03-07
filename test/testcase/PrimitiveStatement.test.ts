import * as chai from 'chai'
import {guessCWD, loadConfig, PrimitiveStatement, processConfig, Sampler, setupLogger, setupOptions} from "../../src";

const expect = chai.expect

class dummyPrimitiveStatement extends PrimitiveStatement<string> {
    copy(): PrimitiveStatement<string> {
        return this
    }

    mutate(sampler: Sampler, depth: number): PrimitiveStatement<string> {
        return this
    }
}

describe('PrimitiveStatement', () => {
    before(async () => {
        await guessCWD(null)
        await setupOptions("", "")
        await loadConfig()
        await processConfig({}, '')
        await setupLogger()
    })

    it('Primitive statements have no children', () => {
        let gene = new dummyPrimitiveStatement('dummyGene', 'randomid', 'randomvalue')

        expect(!gene.hasChildren())
    })

    it('Primitive statements return empty children array', () => {
        let gene = new dummyPrimitiveStatement('dummyGene', 'randomid', 'randomvalue')

        expect(gene.getChildren().length).to.equal(0)
    })

    it('Primitive statement gives correct value', () => {
        let value = 'randomvalue'
        let gene = new dummyPrimitiveStatement('dummyGene', 'randomid', value)

        expect(gene.value).to.equal(value)
    })

    it('Primitive statement gives error for getRandom function', () => {
        expect(dummyPrimitiveStatement.getRandom).throws()
    })
})
