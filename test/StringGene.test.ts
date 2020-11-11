
import {StringGene} from "../lib/search/gene/primitive/StringGene";

test('addMutation increases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.addMutation()

    expect(gene.value.length + 1 === mutated.value.length)
})

test('removeMutation decreases gene length by one', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.removeMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})

test('replaceMutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.replaceMutation()

    expect(gene.value.length === mutated.value.length)
})

test('deltaMutation doesnt affect gene length', () => {
    let gene = StringGene.getRandom()
    let mutated = gene.deltaMutation()

    expect(gene.value.length - 1 === mutated.value.length)
})
