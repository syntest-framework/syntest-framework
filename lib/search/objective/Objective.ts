export interface Objective {
    // the target name
    target: string,
    // line number of the branch
    line: number,
    // true/false branch
    locationIdx: number
}
