var expect = require('chai').expect;
var should = require("chai").should();
var Transactions = require('../lib/index').Transactions
var ChainRpcProvider = require('../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../lib/index').AsiLinkProvider
var Setting = require('../lib/index').Setting


describe('Transactions', function() {

  let chainRpcProvider = new ChainRpcProvider({
    baseURL: 'http://127.0.0.1:8545'
  })
  var transactions = new Transactions(chainRpcProvider)
  transactions.privateKey = '0x7eecba084c2ef8a22ef3d2aa4f7ecf2ce0e9d36b717f2f66f35717ae2806e56c'

  it('generate raw transaction without from address', function() {
    return transactions.generateRawTransaction({
      amount: 123
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: From address is not specified')
    })
  })

  it('generate raw transaction without to address', function() {
    return transactions.generateRawTransaction({
      amount: 123,
      from: '0x632ae12653dfa5ca03bde4e0359ee5b6263f15aac9'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: To address is not specified')
    })
  })

  it('generate vote transaction without from address', function() {
    return transactions.generateVoteTransaction({
      amount: 123,
      voteValue: 123
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: From address is not specified')
    })
  })

  it('generate vote transaction without to address', function() {
    return transactions.generateVoteTransaction({
      amount: 123,
      voteValue: 123,
      from: '0x632ae12653dfa5ca03bde4e0359ee5b6263f15aac9'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: To address is not specified')
    })
  })

  it('transfer 0 amount to a address', function() {
    return transactions.send({
      amount: 0,
      address: '0x6632032786c61472128d1b3185c92626f8ff0ee4d3'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: Can not transfer asset with 0 amount to 0x6632032786c61472128d1b3185c92626f8ff0ee4d3')
    })
  })

})
