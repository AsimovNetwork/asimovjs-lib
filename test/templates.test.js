var expect = require('chai').expect;
var should = require("chai").should();
var Templates = require('../lib/index').Templates
var ChainRpcProvider = require('../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../lib/index').AsiLinkProvider
var Setting = require('../lib/index').Setting

describe('Templates', function() {
  let chainRpcProvider = new ChainRpcProvider({
    baseURL: 'http://127.0.0.1:8545'
  })
  let asiLinkProvider = new AsiLinkProvider()
  var templates = new Templates({
    chainRpcProvider: chainRpcProvider,
    asiLinkProvider: asiLinkProvider
  })

  it('submit template without source', function() {
    return templates.submitTemplate({

    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: source file object or path is not specified!')
    })
  })

  it('submit template without template name', function() {
    return templates.submitTemplate({
      source: 'avsdus'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: template name is not specified!')
    })
  })

  it('submit template without private key', function() {
    return templates.submitTemplate({
      source: 'avsdus',
      templateName: 'jashdu',
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: private key is not specified in setting!')
    })
  })
  it('deploy contract with out private key', function() {
    return templates.deployContract({
      templateId: '1231232'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: private key is not specified in setting!')
    })
  })

  it('submit template without compiler', function() {
    templates.privateKey = '0x0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'
    return templates.submitTemplate({
      source: 'avsdus',
      templateName: 'jashdu'
    }).catch(e => {
      expect(e.toString()).to.be.equal('Error: compiler is not specified!')
    })
  })

})
