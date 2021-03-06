import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {guessCWD, loadConfig, PrimitiveStatement, processConfig, Sampler, setupLogger, setupOptions} from "../../src";

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
        let gene = new dummyPrimitiveStatement('dummy', 'dummyGene', 'randomid', 'randomvalue')

        expect(!gene.hasChildren())
    })

    it('Primitive statements return empty children array', () => {
        let gene = new dummyPrimitiveStatement('dummy', 'dummyGene', 'randomid', 'randomvalue')

        expect(gene.getChildren().length).to.equal(0)
    })

    it('Primitive statement gives correct value', () => {
        let value = 'randomvalue'
        let gene = new dummyPrimitiveStatement('dummy', 'dummyGene', 'randomid', value)

        expect(gene.value).to.equal(value)
    })

    it('Primitive statement gives error for getrandom function', () => {
        expect(dummyPrimitiveStatement.getRandom).throws()
    })
})
