'use strict';
var expect = require('chai').expect;
var should = require('chai').should();

var TemplateWarehouse = require('../lib/index').TemplateWarehouse
var testnet = require('../lib/index').testnet
var TxHelper = require('../lib/index').TxHelper
var ChainRpcProvider = require('../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../lib/index').AsiLinkProvider

describe('TemplateWarehouse', function() {
  var templateWarehouse = new TemplateWarehouse()
  it('init without chain rpc provider', function() {
    return templateWarehouse.init().catch(e => {
      expect(e.toString()).to.be.equal('Error: Can not init due to missing chain rpc provider')
    })
  })


  it('create template', function() {
    templateWarehouse.chainRpcProvider = new ChainRpcProvider({
      baseURL: 'http://127.0.0.1:8545'
    })
    return templateWarehouse.createTemplate().catch(e => {
      expect(e.toString()).to.be.equal('Error: connect ECONNREFUSED 127.0.0.1:8545')
    })
  })

  it('deploy', function() {
    return templateWarehouse.deploy().catch(e => {
      expect(e.toString()).to.be.equal('Error: connect ECONNREFUSED 127.0.0.1:8545')
    })
  })

})
