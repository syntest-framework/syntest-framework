/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export enum GbestSelectionMethod {
  RANDOM,
  PROB,
}

const { PROB } = GbestSelectionMethod;

type Particle = {
  value: number[];
  pBest: number[];
};

export class MOPSO {
  private functionsDimension: number;
  private fs: { (...arguments_: any[]): number }[];
  private minSearchSpace: number;
  private maxSearchSpace: number;
  private N = 100;
  private W = 0.5;
  private c1 = 0.25;
  private c2 = 0.25;
  private maxEpochs = 2000;
  private maximize = false;
  private gbestSelection = PROB;
  private history: number[][][] = [];

  /** //TODO add description
   *
   * @param functionsDimension  Specifies the dimension of the functions
   * @param fs                  Array of functions
   * @param minSearchSpace      Minimum bound of the search space
   * @param maxSearchSpace      Maximum bound fo the search space
   * @param N                   # Particles
   * @param W                   Inertia
   * @param c1                  Cognitive coefficient
   * @param c2                  Social coefficient
   * @param maxEpochs           Maximum number of epochs
   * @param maximize            Whether the objective should be maximized or minimized
   * @param gbestSelection      Global best selection method
   */
  constructor(
    functionsDimension: number,
    fs: { (...arguments_: any[]): number }[],
    minSearchSpace: number,
    maxSearchSpace: number,
    N?: number,
    W?: number,
    c1?: number,
    c2?: number,
    maxEpochs?: number,
    maximize?: boolean,
    gbestSelection?: GbestSelectionMethod
  ) {
    this.fs = fs;
    this.functionsDimension = functionsDimension;
    this.minSearchSpace = minSearchSpace;
    this.maxSearchSpace = maxSearchSpace;

    this.N = N ?? this.N;
    this.W = W ?? this.W;
    this.c1 = c1 ?? this.c1;
    this.c2 = c2 ?? this.c2;
    this.maxEpochs = maxEpochs ?? this.maxEpochs;
    this.maximize = maximize ?? this.maximize;
    this.gbestSelection = gbestSelection ?? this.gbestSelection;
  }

  /** Selects a random element from an array.
   *
   * @param array The array.
   * @returns A random element from the array.
   */
  protected _pickArrayElement = <T>(array: T[]): T =>
    array[Math.floor(Math.random() * array.length)];

  /** Randomly generate the N initial particles.
   *
   * @param searchSpaceLimit Specifies the dimension of each particle.
   * @returns An array of particles.
   */
  protected _initialiseParticles = (): Particle[] => {
    let index = 0;
    const X: Particle[] = [];

    while (index < this.N) {
      const p: number[] = Array.from(
        { length: this.functionsDimension },
        () =>
          Math.random() * (this.maxSearchSpace - this.minSearchSpace) +
          this.minSearchSpace
      );
      X.push({ value: p, pBest: p });
      index++;
    }

    return X;
  };

  /** Generates the archive of non-dominated solutions based on the
   *  current set of particles.
   *
   * @param X List of all particles.
   * @returns An array of non-dominated particles.
   */
  protected _generateArchive = (X: Particle[]): Particle[] => {
    return X.filter(
      (particleObject) =>
        X.map(
          (otherPobj) =>
            this._doesDominate(otherPobj.value, particleObject.value) // Checks for any other particle if it dominates the current one.
        ).every((b) => b === false) // Current particle is part of the archive only if no other particle dominates it.
    );
  };

  /** Checks if p1 dominates p2.
   *
   * @param p1 First particle.
   * @param p2 Second particle.
   * @returns True if p1 dominates p2, False otherwise.
   */
  protected _doesDominate = (p1: number[], p2: number[]): boolean => {
    const p1Dominant = this.fs.every((f) =>
      this.maximize ? f(...p1) >= f(...p2) : f(...p1) <= f(...p2)
    );

    const p2Dominant = this.fs.every((f) =>
      this.maximize ? f(...p2) >= f(...p1) : f(...p2) <= f(...p1)
    );

    return p1Dominant && !p2Dominant;
  };

  /** Uses a weighted probability approach to select a particle from the archive.
   *  The probability of selecting a particle is inversely proportional to the number
   *  of particles dominated by it.
   * (The less particles it dominates, the higher the chance to be selected)
   *
   * @param X List of all particles
   * @param A Archive of non-dominated particles
   * @returns A particle from the archive.
   */
  protected _weightedProbabilitySelection = (X: Particle[], A: Particle[]) => {
    //Creates an array of objects containing the current particle from the archive and the number of particles dominated by it.
    const customA = A.map((a) => ({
      p: a,
      dominatedParticles: X.filter((p) => this._doesDominate(a.value, p.value))
        .length,
    })).filter((A) => A.dominatedParticles !== 0);

    const weightsSum = customA.reduce(
      (accumulator, { dominatedParticles }) =>
        accumulator + 1 / dominatedParticles,
      0
    );

    let rand = Math.random() * weightsSum;

    for (const particle of customA) {
      rand -= 1 / particle.dominatedParticles;
      if (rand <= 0) return particle.p.value;
    }

    // ? Unreachable statement.
    throw new Error(
      "This line shouldn't have been reached. Take a look at the weightedProbabilitySelection method"
    );
  };

  /** If the current particle dominates the previous best one, it returns it.
   *  Otherwise it returns the previous best.
   *
   * @param p The current particle.
   * @returns Either the current particle or the previous pBest.
   */
  protected _selectPbest = (p: Particle) =>
    this._doesDominate(p.value, p.pBest) ? p.value : p.pBest;

  /** Uses the PROB method to select the current global best.
   *  If the current particle is part of the archive, it selects a particle from the
   *  archive using the weightedProbabilitySelection method.
   *  Otherwise it selects all particles that dominate the current one
   *  and selects one using the weightedProbabilitySelection method.
   *
   * @param p The current particle.
   * @param X List of all particles
   * @param A Archive of non-dominated particles
   * @returns The current global best.
   */
  protected _gbestProb = (
    p: Particle,
    X: Particle[],
    A: Particle[]
  ): number[] => {
    if (A.includes(p)) return this._weightedProbabilitySelection(X, A);

    const domA = A.filter((a) => this._doesDominate(a.value, p.value)); // Particles that dominate p
    return this._weightedProbabilitySelection(X, domA);
  };

  /** Uses the RAND method to select the current global best.
   *  If the current particle is part of the archive, it selects a random one.
   *  Otherwise, it selects a random particle from the set of particles that
   *  dominate the current one.
   *
   * @param p The current particle.
   * @param A Archive of non-dominated particles
   * @returns The current global best.
   */
  protected _gbestRandom = (p: Particle, A: Particle[]): number[] => {
    if (A.includes(p)) return this._pickArrayElement(A).value;

    const domA = A.filter((a) => this._doesDominate(a.value, p.value));

    return this._pickArrayElement(domA).value;
  };

  /** Selects which method should be used to select the global best.
   *
   * @param method PROB | RAND
   * @param p The current particle
   * @param X List of all particles
   * @param A Archive of non-dominated particles
   * @returns The value of a particle.
   */
  protected _selectGbest = (
    method: GbestSelectionMethod,
    p: Particle,
    X: Particle[],
    A: Particle[]
  ): number[] => {
    return method === PROB ? this._gbestProb(p, X, A) : this._gbestRandom(p, A);
  };

  public run = () => {
    let epoch = 0;

    let X: Particle[] = this._initialiseParticles(); // Initializes all particles randomly
    let V: number[][] = Array.from(
      // Initializes all velocities to 0.
      { length: this.N },
      () => Array.from<number>({ length: this.functionsDimension }).fill(0)
    );
    let A: Particle[] = []; // Initializes the archive to be empty.

    this.history.push(X.map((p) => p.value));

    while (epoch < this.maxEpochs) {
      A = this._generateArchive(X); // Generates archive for current iteration

      //TODO remove
      if (epoch % 20 === 0)
        console.log(`Size of A: ${A.length} - Epoch: ${epoch}`);

      X = X.map((particle, particleIndex) => {
        const r1 = Math.random();
        const r2 = Math.random();

        const gbest = this._selectGbest(this.gbestSelection, particle, X, A);
        const pBest = this._selectPbest(particle);

        // Update velocities
        V = V.map((currentVel) =>
          currentVel.map(
            (v, velIndex) =>
              this.W * v +
              this.c1 * r1 * (pBest[velIndex] - particle.value[velIndex]) +
              this.c2 * r2 * (gbest[velIndex] - particle.value[velIndex])
          )
        );

        const pNew = particle.value.map(
          (currentValue, dimensionIndex) =>
            currentValue + V[particleIndex][dimensionIndex]
        );

        // Update particles position
        return { value: pNew, pBest } as Particle;
      });

      this.history.push(X.map((p) => p.value));
      epoch++;
    }

    return this.history;
  };
}
