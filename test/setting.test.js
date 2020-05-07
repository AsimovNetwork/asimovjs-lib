var expect = require('chai').expect;
var should = require("chai").should();
var Setting = require('../lib/index').Setting


describe('Setting', function() {
  describe('#Create', function() {
    it('create with config', function() {
      var config = {
        url: 'http://127.0.0.1:8545',
        bundleId: 'iickipohpkhpaigbfhgmdfbfjnjfkaeo',
        privateKey: '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3',
        fee: {
          amount: 123,
          asset: '0000000000000000000000'
        }
      }

      var setting = new Setting(config)
      expect(setting.bundleId).to.be.equal('iickipohpkhpaigbfhgmdfbfjnjfkaeo')
      expect(setting.privateKey).to.be.equal('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3')
      expect(setting.fee.amount).to.be.equal(123)
      expect(setting.fee.asset).to.be.equal('0000000000000000000000')
      expect(Setting.GetPrivateKey()).to.be.equal('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3')
    })

    it('create with remote compiler', function() {
      var config = {
        url: 'http://127.0.0.1:8545',
        remoteCompiler: 'https://cdn.asimov.work/asimov.js',
      }
      var setting = new Setting(config)

    })


  })

})
