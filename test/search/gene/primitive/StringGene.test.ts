import {Sampler, StringGene} from "../../../../lib";

jest.mock('../../../../lib/search/sampling/Sampler')

const mock = <jest.Mock<Sampler>>Sampler
// const mock = jest.fn().mockImplementation(() => {
//     return
// })

test('Add mutation increases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.addMutation()

    expect(gene.value.length + 1 === mutated.value.length)
})

test('Remove mutation decreases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.removeMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})

test('Replace mutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.replaceMutation()

    expect(gene.value.length === mutated.value.length)
})

test('Delta mutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.deltaMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})

test('Copy gives exact same value', () => {
    let gene = StringGene.getRandom()
    let copy = gene.copy()

    expect(gene.value).toEqual(copy.value)
})

test('Mutate gives exact other value', () => {
    let gene = StringGene.getRandom()
    let mutation = gene.mutate(new mock(), 0)

    expect(gene.value != mutation.value)
})
