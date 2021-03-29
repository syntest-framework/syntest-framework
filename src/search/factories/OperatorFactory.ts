import {TreeCrossover} from "../operators/crossover/TreeCrossover";
import {CrowdingDistance} from "../operators/ranking/CrowdingDistance";
import {TournamentSelection} from "../operators/selection/TournamentSelection";
import {FastNonDomSorting} from "../operators/sorting/FastNonDomSorting";
import {Crossover} from "../operators/crossover/Crossover";
import {Ranking} from "../operators/ranking/Ranking";
import {Sorting} from "../operators/sorting/Sorting";
import {Selection} from "../operators/selection/Selection";

export function createCrossover (name: string): Crossover {
    switch (name) {
        case 'tree-crossover':
            return new TreeCrossover()
    }
}

export function createRanking (name: string): Ranking {
    switch (name) {
        case 'crowding-distance':
            return new CrowdingDistance();
    }
}

export function createSelection (name: string): Selection {
    switch (name) {
        case 'tournament-selection':
            return new TournamentSelection(2);
    }
}

export function createSorting (name: string): Sorting {
    switch (name) {
        case 'fast-non-dom-sorting':
            return new FastNonDomSorting();
    }
}
