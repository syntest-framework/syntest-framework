
function test (x) {
  return '' + x
}

class Wallet {
  constructor() {
    this.balance = 100;
  }

  pay(price) {
    const newBalance = this.balance - price;
    if (newBalance < 0) {
      return false;
    } else if (newBalance === 0) {
      if (price > 10) {
        price += 1
      }
      return true
    } else {
      this.balance = newBalance;
      return true;
    }
  }

  save(amount) {
    this.balance += amount;
  }

  calculateInterest() {
    if (this.balance < 10000) {
      this.balance += this.balance * 0.1;
      return;
    }

    // for (let i = 0; i < 10; i++) {
    //   this.balance += 10;
    // }
  }
}

module.exports = {test, Wallet}
