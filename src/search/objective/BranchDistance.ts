export class BranchDistance {
  /**
   * Calculate the branch distance
   *
   * @param opcode the opcode (the comparison operator)
   * @param left the left value of the comparison
   * @param right the right value of the comparison
   * @param target the side of the branch you want to cover
   */
  public branchDistanceNumeric(
    opcode: string,
    left: number,
    right: number,
    target: boolean
  ) {
    let branchDistance: number;

    // TODO the SGT and SLT opcodes are for signed numbers
    // look here: https://docs.soliditylang.org/en/v0.5.5/assembly.html

    // TODO other opcodes

    // TODO move this to the solidity project and make an abstraction of this class

    switch (opcode) {
      case "EQ":
        if (target) {
          branchDistance = this.equalNumeric(left, right);
        } else {
          branchDistance = this.notEqualNumeric(left, right);
        }
        break;
      case "NEQ":
        if (target) {
          branchDistance = this.notEqualNumeric(left, right);
        } else {
          branchDistance = this.equalNumeric(left, right);
        }
        break;
      case "GT":
        if (target) {
          branchDistance = this.greater(left, right);
        } else {
          branchDistance = this.smallerEqual(left, right);
        }
        break;
      case "LT":
        if (target) {
          branchDistance = this.smaller(left, right);
        } else {
          branchDistance = this.greaterEqual(left, right);
        }
        break;
      case "SGT":
        if (target) {
          branchDistance = this.greater(left, right);
        } else {
          branchDistance = this.smallerEqual(left, right);
        }
        break;
      case "SLT":
        if (target) {
          branchDistance = this.smaller(left, right);
        } else {
          branchDistance = this.greaterEqual(left, right);
        }
        break;
    }

    return this.normalize(branchDistance);
  }

  private normalize(x: number): number {
    return x / (x + 1);
  }

  private equalNumeric(left: number, right: number) {
    return Math.abs(left - right);
  }

  private notEqualNumeric(left: number, right: number) {
    if (left != right) {
      return 0.0;
    } else {
      return 1.0;
    }
  }

  private greater(left: number, right: number) {
    if (left > right) {
      return 0.0;
    } else {
      return right - left + 1;
    }
  }

  private smallerEqual(left: number, right: number) {
    if (left <= right) {
      return 0.0;
    } else {
      return left - right;
    }
  }

  private greaterEqual(left: number, right: number) {
    if (left >= right) {
      return 0.0;
    } else {
      return right - left;
    }
  }

  private smaller(left: number, right: number) {
    if (left < right) {
      return 0.0;
    } else {
      return left - right + 1;
    }
  }
}
