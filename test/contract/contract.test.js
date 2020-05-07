'use strict';
var expect = require('chai').expect;
var should = require('chai').should();

var Contract = require('../../lib/index').Contract
var testnet = require('../../lib/index').testnet
var TxHelper = require('../../lib/index').TxHelper
var ChainRpcProvider = require('../../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../../lib/index').AsiLinkProvider

describe('Contract', function() {

  var abiStr = '[{"constant":true,"inputs":[],"name":"getPresident","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"member","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getAddressRolesMap","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPresident","type":"address"}],"name":"transferPresidentRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureAddressRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"transferAddress","type":"address"}],"name":"canTransferAsset","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"mintAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOrganizationName","type":"string"}],"name":"renameOrganization","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newMembers","type":"address[]"}],"name":"addNewMembers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_caller","type":"address"},{"name":"_functionStr","type":"string"}],"name":"canPerform","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOrganizationId","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getCreateAndMintHistory","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"asset","type":"uint256"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"transferAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"description","type":"string"},{"name":"assetType","type":"uint32"},{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"createAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_organizationName","type":"string"},{"name":"_members","type":"address[]"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"UpdateMemberEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"RenameOrganizationEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes12"}],"name":"CreateAssetEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"invitee","type":"address"}],"name":"invite","type":"event"}]';
  var abi = JSON.parse(abiStr)
  var bytecode = ''
  var chainRpcProvider = new ChainRpcProvider({
    baseURL: 'http://127.0.0.1:8545'
  })
  var asiLinkProvider = new AsiLinkProvider()
  var contract = new Contract({
    abi: abi
  })

  describe('#instantiation', function() {
    it('create contract without abi', function() {

      (function() {
        new Contract()
      }.should.throw('No abi provided'))

    })

    it('create contract with abi which contains override function', function() {
      let c = new Contract({
        abi: [{
            "constant": true,
            "inputs": [],
            "name": "getPresident",
            "outputs": [{ "name": "", "type": "address" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [{ "name": "member", "type": "address" }],
            "name": "getPresident",
            "outputs": [{ "name": "", "type": "address" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          }
        ]
      })
      expect(c.findMethodABI('getPresident', ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'])).to.deep.equal({
        "constant": true,
        "inputs": [{ "name": "member", "type": "address" }],
        "name": "getPresident",
        "outputs": [{ "name": "", "type": "address" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      })
      expect(c.findMethodABI('getPresident', [])).to.deep.equal({
        "constant": true,
        "inputs": [],
        "name": "getPresident",
        "outputs": [{ "name": "", "type": "address" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      })
    })

    it('create contract only from abi', function() {

      expect(contract.abi).to.deep.equal(abi)

    })
    it('create contract from abi,address,bytecode,chainRpcProvider,asiLinkProvider', function() {

      var contract1 = new Contract({
        abi: abi,
        asiLinkProvider: asiLinkProvider,
        chainRpcProvider: chainRpcProvider,
        byteCode: bytecode,
        address: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81'
      })
      expect(contract1.abiString).to.be.equal(abiStr)

    })
  })

  describe('#function', function() {

    it('get method abi', function() {
      expect(contract.findMethodABI('getPresident')).to.deep.equal({
        constant: true,
        inputs: [],
        name: 'getPresident',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
      })
    })

    it('encode call data', function() {

      var methodABI = contract.findMethodABI('getPresident')
      var callData = TxHelper.encodeCallData(methodABI, [])

      expect(callData).to.be.equal('00738d22')
    })

    it('test isReadOnlyMethod', function() {
      expect(contract.isReadOnlyMethod('getPresident', [])).to.be.equal(true)
      expect(contract.isReadOnlyMethod('removeMember', ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'])).to.be.equal(false)
    })

    it('call without contract address', function() {

      return contract.call({
        methodName: 'removeMember',
        args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda']
      }).catch(e => {
        expect(e.toString()).to.be.equal("Error: No contract address provided")
      })

    })

    describe('#call read-only function', function() {

      it('call read-only function without asiLinkProvider,chainRpcProvider and caller', function() {
        var contract1 = new Contract({
          abi: abi,
          byteCode: bytecode,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81'
        })

        return contract1.call({
          methodName: 'getPresident',
          args: [],
        }).catch(e => {
          expect(e.toString()).to.be.equal('Error: AsiLink provider is not setup')
        })

      })


      it('call read-only function with asiLinkProvider', function() {

        var contract1 = new Contract({
          abi: abi,
          byteCode: bytecode,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          asiLinkProvider: asiLinkProvider
        })

        return contract1.call({
          methodName: 'getPresident',
          args: [],
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: AsiLink provider should run in browser environment")
        })

      })

      it('call read-only function with chainRpcProvider,without caller', function() {

        var contract1 = new Contract({
          abi: abi,
          byteCode: bytecode,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })

        return contract1.call({
          methodName: 'getPresident',
          args: []
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Caller is missing")
        })

      })

      it('call read-only function with chainRpcProvider and caller', function() {
        var contract1 = new Contract({
          abi: abi,
          byteCode: bytecode,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })

        return contract1.call({
          methodName: 'getPresident',
          args: [],
          caller: "0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda"
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Error: connect ECONNREFUSED 127.0.0.1:8545")
        })
      })
    })
    describe('#call write function', function() {

      it('call contract with private key and chainRpcProvider', function() {
        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })
        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'],
          privateKey: '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Error: connect ECONNREFUSED 127.0.0.1:8545")
        })

      })

      it('call contract with private key and chainRpcProvider and gasLimit', function() {
        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })
        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'],
          privateKey: '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3',
          gasLimit: 1000000
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Error: connect ECONNREFUSED 127.0.0.1:8545")
        })

      })


      it('call vote function of contract', function() {

        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })

        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'],
          privateKey: '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3',
          contractType: 'vote',
          gasLimit: 1000000
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Error: connect ECONNREFUSED 127.0.0.1:8545")
        })

      })

      it('call contract only with private key', function() {
        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81'
        })
        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'],
          privateKey: '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Chain RPC provider is not setup")
        })

      })



      it('call contract only with chainRpcProvider', function() {

        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })

        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda']
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: AsiLink provider is not setup")
        })
      })

      it('call contract only with asiLinkProvider', function() {

        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          asiLinkProvider: asiLinkProvider
        })
        return contract1.call({
          methodName: 'removeMember',
          args: ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda']
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: AsiLink provider should run in browser environment")
        })
      })
    })
    describe('#pre call', function() {

      it('pre call with empty call method', function() {

        return contract.preCall({
          methods: []
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Method is not provided")

        })
      })

      it('pre call without chainRpcProvider', function() {
        return contract.preCall({
          methods: [{
            name: 'getPresident',
            args: []
          }],
          caller: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda'
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Chain RPC provider is not setup")
        })
      })

      it('pre call without caller', function() {
        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })
        return contract1.preCall({
          methods: [{
            name: 'getPresident',
            args: []
          }],
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Caller is missing")

        })
      })

      it('pre call contract with caller and chainRpcProvider', function() {
        var contract1 = new Contract({
          abi: abi,
          contractAddress: '0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81',
          chainRpcProvider: chainRpcProvider
        })
        return contract1.preCall({
          methods: [{
            name: 'getPresident',
            args: []
          }],
          caller: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
          constructorArgs: ['testPreCall', ['0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda']]
        }).catch(e => {
          expect(e.toString()).to.be.equal("Error: Error: connect ECONNREFUSED 127.0.0.1:8545")
        })
      })

    })

  })

});
