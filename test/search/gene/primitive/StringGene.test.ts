import * as sinon from 'sinon'
import * as chai from 'chai'
import {Sampler, StringGene} from "../../../../lib";

let expect = chai.expect

it('Add mutation increases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.addMutation()

    expect(gene.value.length + 1 === mutated.value.length)
})

it('Remove mutation decreases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.removeMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})

it('Replace mutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.replaceMutation()

    expect(gene.value.length === mutated.value.length)
})

it('Delta mutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.deltaMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})

it('Copy gives exact same value', () => {
    let gene = StringGene.getRandom()
    let copy = gene.copy()

    expect(gene.value).to.equal(copy.value)
})

it('Mutate gives exact other value', () => {
    let mockedSampler = <Sampler>{};
    let gene = StringGene.getRandom()
    let mutation = gene.mutate(mockedSampler as Sampler, 0)

    expect(gene.value != mutation.value)
})
