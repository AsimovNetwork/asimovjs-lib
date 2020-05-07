var expect = require('chai').expect;
var should = require("chai").should();
var Contracts = require('../lib/index').Contracts;
var ChainRpcProvider = require('../lib/index').ChainRpcProvider;
var AsiLinkProvider = require('../lib/index').AsiLinkProvider;

describe('Contracts', function() {
  let chainRpcProvider = new ChainRpcProvider({
    baseURL: 'http://127.0.0.1:8545'
  })
  let asiLinkProvider = new AsiLinkProvider()
  let contracts = new Contracts({
    chainRpcProvider: chainRpcProvider,
    asiLinkProvider: asiLinkProvider
  })
  describe('#execute', function() {
    it('execute without address', function() {

      return contracts.execute({}).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract address is not provided')
      })
    })
    it('execute without method', function() {
      return contracts.execute({
        address: '0x6632032786c61472128d1b3185c92626f8ff0ee4d3'
      }).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract method is not provided')
      })
    })

    it('execute with fee', function() {
      return contracts.execute({
        method: 'abc',
        address: '0x6332032786c61472128d1b3185c92626f8ff0ee4d3',
        fee: {
          amount: 123,
          asset: '000000000000000000000000'
        }
      }).catch(e => {
        expect(e.toString()).to.be.equal('Error: -32000, -32603: error:template not found')
      })
    })
  })
  describe('#vote', function() {
    it('vote without address', function() {
      return contracts.vote({}).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract address is not provided')
      })
    })
    it('vote without method', function() {
      return contracts.vote({
        address: '0x6632032786c61472128d1b3185c92626f8ff0ee4d3'
      }).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract method is not provided')
      })
    })
    it('vote with fee', function() {
      return contracts.vote({
        method: 'abc',
        address: '0x6332032786c61472128d1b3185c92626f8ff0ee4d3',
        fee: {
          amount: 123,
          asset: '000000000000000000000000'
        }
      }).catch(e => {
        expect(e.toString()).to.be.equal('Error: -32000, -32603: error:template not found')
      })
    })
  })
  describe('#read', function() {
    it('read without address', function() {
      return contracts.read({}).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract address is not provided')
      })
    })
    it('read without method', function() {
      return contracts.read({
        address: '0x6632032786c61472128d1b3185c92626f8ff0ee4d3'
      }).catch(e => {
        expect(e.toString()).to.be.equal('Error: Contract method is not provided')
      })
    })
  })

})
