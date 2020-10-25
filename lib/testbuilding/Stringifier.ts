import {Gene} from "../search/gene/Gene";
import {Individual} from "../search/gene/Individual";

export abstract class Stringifier {

    abstract stringifyIndividual(individual: Individual, addLogs = false, additionalAssertions: { [key: string]: string } = {}): string

    abstract stringifyGene(gene: Gene): string

}