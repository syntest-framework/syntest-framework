const { Wallet } = require('./Wallet')

class Person {
  wallet

  constructor() {
    this.wallet = new Wallet()
  }

  getWallet() {
    return this.wallet
  }
}


module.exports = {Person}
