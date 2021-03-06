import * as sinon from 'sinon'
import * as chai from 'chai'

const expect = chai.expect

import {guessCWD, loadConfig, processConfig, Sampler, setupLogger, setupOptions, String} from "../../../src";

describe('String', () => {
    before(async () => {
        await guessCWD(null)
        await setupOptions("","")
        await loadConfig()
        await processConfig({}, '')
        await setupLogger()
    })

    it('Add mutation increases statement\'s length by one', () => {
        let statement = String.getRandom()
        let mutated = statement.addMutation()

        expect(statement.value.length + 1 === mutated.value.length)
    })

    it('Remove mutation decreases statement\'s length by one', () => {
        let statement = String.getRandom()
        let mutated = statement.removeMutation()

        expect(statement.value.length - 1 === mutated.value.length)
    })

    it('Replace mutation doesnt affect statement\'s length', () => {
        let statement = String.getRandom()
        let mutated = statement.replaceMutation()

        expect(statement.value.length === mutated.value.length)
    })

    it('Delta mutation doesnt affect statement\'s length', () => {
        let statement = String.getRandom()
        let mutated = statement.deltaMutation()

        expect(statement.value.length - 1 === mutated.value.length)
    })

    it('Copy gives exact same value', () => {
        let statement = String.getRandom()
        let copy = statement.copy()

        expect(statement.value).to.equal(copy.value)
    })

    it('Mutate gives exact other value', () => {
        let mockedSampler = <Sampler>{};
        let statement = String.getRandom()
        let mutation = statement.mutate(mockedSampler as Sampler, 0)

        expect(statement.value != mutation.value)
    })
})
