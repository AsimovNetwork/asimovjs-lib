'use strict';

var expect = require('chai').expect;
var should = require("chai").should();
var keccak256 = require('../lib').Keccak256.keccak256
var sha256 = require('../lib').sha256
var bigNumberify = require('../lib').BigNumber.bigNumberify
var Utf8 = require("../lib").Utf8
var Bytes = require('../lib').Bytes
var TxHelper = require('../lib').TxHelper

function randomBytes(seed, lower, upper) {
  if (!upper) { upper = lower; }

  if (upper === 0 && upper === lower) { return new Uint8Array(0); }

  seed = Utf8.toUtf8Bytes(seed);

  var result = Bytes.arrayify(keccak256(seed));
  while (result.length < upper) {
    result = Bytes.concat([result, keccak256(Bytes.concat([seed, result]))]);
  }

  var top = Bytes.arrayify(keccak256(result));
  var percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;

  return result.slice(0, lower + parseInt((upper - lower) * percent));
}

function randomHexString(seed, lower, upper) {
  return Bytes.hexlify(randomBytes(seed, lower, upper));
}

function randomNumber(seed, lower, upper) {
  var top = randomBytes(seed, 3);
  var percent = ((top[0] << 16) | (top[1] << 8) | top[2]) / 0x01000000;
  return lower + parseInt((upper - lower) * percent);
}

function randomChar(seed) {
  switch (randomNumber(seed + '-range', 0, 4)) {
    case 0:
      return String.fromCharCode(randomNumber(seed + '-value', 0, 0x100));
    case 1:
      return String.fromCharCode(randomNumber(seed + '-value', 0, 0xd800));
    case 2:
      return String.fromCharCode(randomNumber(seed + '-value', 0xdfff + 1, 0xffff));
    case 3:
      var left = randomNumber(seed + '-value', 0xd800, 0xdbff + 1);
      var right = randomNumber(seed + '-value', 0xdc00, 0xdfff + 1);
      return String.fromCharCode(left, right);
  }

  throw new Error('this should not happen');
}

function randomString(seed) {
  var length = randomNumber(seed + '-length', 1, 5);
  var str = '';
  for (var i = 0; i < length; i++) {
    str += randomChar(seed + '-char-' + i);
  }
  return str;
}


describe('Utils', function() {
  describe('Test Hash Functions', function() {

    describe('#Keccak256', function() {
      var tests = require('./hashes.json')
      it('computes keccak256 correctly', function() {
        this.timeout(120000);
        tests.forEach(function(test) {
          expect(keccak256(test.data)).to.be.equal(test.keccak256)
        });
      });
    })

    describe('#UTF-8 coder', function() {
      var BadUTF = [
        // See: https://en.wikipedia.org/wiki/UTF-8#Overlong_encodings
        { bytes: [0xF0, 0x82, 0x82, 0xAC], reason: 'overlong', name: 'wikipedia overlong encoded Euro sign' },
        { bytes: [0xc0, 0x80], reason: 'overlong', name: '2-byte overlong - 0xc080' },
        { bytes: [0xc0, 0xbf], reason: 'overlong', name: '2-byte overlong - 0xc0bf' },
        { bytes: [0xc1, 0x80], reason: 'overlong', name: '2-byte overlong - 0xc180' },
        { bytes: [0xc1, 0xbf], reason: 'overlong', name: '2-byte overlong - 0xc1bf' },

        // Reserved UTF-16 Surrogate halves
        { bytes: [0xed, 0xa0, 0x80], reason: 'utf-16 surrogate', name: 'utf-16 surrogate - U+d800' },
        { bytes: [0xed, 0xbf, 0xbf], reason: 'utf-16 surrogate', name: 'utf-16 surrogate - U+dfff' },

        // a leading byte not followed by enough continuation bytes
        { bytes: [0xdf], reason: 'too short', name: 'too short - 2-bytes - 0x00' },
        { bytes: [0xe0], reason: 'too short', name: 'too short - 3-bytes' },
        { bytes: [0xe0, 0x80], reason: 'too short', name: 'too short - 3-bytes with 1' },

        { bytes: [0x80], reason: 'unexpected continuation byte', name: 'unexpected continuation byte' },
        { bytes: [0xc2, 0x00], reason: 'invalid continuation byte', name: 'invalid continuation byte - 0xc200' },
        { bytes: [0xc2, 0x40], reason: 'invalid continuation byte', name: 'invalid continuation byte - 0xc240' },
        { bytes: [0xc2, 0xc0], reason: 'invalid continuation byte', name: 'invalid continuation byte - 0xc2c0' },

        // Out of range
        { bytes: [0xf4, 0x90, 0x80, 0x80], reason: 'out-of-range', name: 'out of range' },
      ];

      BadUTF.forEach(function(test) {
        it('toUtf8String - ' + test.name, function() {
          (function() {
            var result = Utf8.toUtf8String(test.bytes);
            console.log('Result', result);
          }.should.throw(test.reason))
        });
      });

      it('toUtf8String - random conversions', function() {
        this.timeout(200000);

        for (var i = 0; i < 10000; i++) {
          var seed = 'test-' + String(i);
          var str = randomString(seed);

          var bytes = Utf8.toUtf8Bytes(str)
          var str2 = Utf8.toUtf8String(bytes);
          // console.log(str)
          // console.log(bytes)
          // console.log(str2)
          expect(str2).to.be.equal(str)
          //assert.ok(Buffer.from(str).equals(Buffer.from(bytes)), 'bytes not generated correctly - ' + bytes)
          expect(str2).to.be.equal(str)
        }
      });
    });

    describe('#Bytes32String coder', function() {
      // @TODO: a LOT more test cases; generated from Solidity
      it("encodes an ens name", function() {
        var str = "ricmoo.firefly.eth";
        var bytes32 = Utf8.formatBytes32String(str);
        var str2 = Utf8.parseBytes32String(bytes32);
        expect(bytes32).to.be.equal('0x7269636d6f6f2e66697265666c792e6574680000000000000000000000000000')
        expect(str2).to.be.equal(str)
      });
    });

    describe('#BigNumber', function() {
      it("computes absoltue values", function() {
        [
          { value: "0x0", expected: "0x0" },
          { value: "-0x0", expected: "0x0" },
          { value: "0x5", expected: "0x5" },
          { value: "-0x5", expected: "0x5" },
          { value: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", expected: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
          { value: "-0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", expected: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
          { value: "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", expected: "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
          { value: "-0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", expected: "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
        ].forEach(function(result) {
          var value = bigNumberify(result.value);
          var expected = bigNumberify(result.expected);
          expect(value.abs().toNumber()).to.be.equal(expected.toNumber()) //.throw('BigNumber.abs - ' + value)

        });
      });

    })

    describe("#Hexlify", function() {
      it("hexlify on string of unsafe number", function() {
        expect(Bytes.hexlify(bigNumberify("9985956830000000000"))).to.be.equal("0x8a953ed43a892c00")
      });

      [9007199254740991, 9985956830000000000].forEach(function(value) {
        it('hexlify fails on unsafe number - ' + value, function() {


          (function() {
            try {
              var result = Bytes.hexlify(value);
              console.log('Result', result);
            } catch (e) {
              if (e.code === "NUMERIC_FAULT" && e.fault === "out-of-safe-range") {
                throw "hexlify throws on out-of-range value - " + value
              }
            }
          }.should.throw("hexlify throws on out-of-range value - " + value))
        });
      });
    });
  })


  describe('Test TxHelper', function() {
    let abiStr = '[{ "constant": true, "inputs": [{ "name": "", "type": "uint256" }], "name": "proposals", "outputs": [{ "name": "attachmentHash", "type": "bytes32" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_attachmentHash", "type": "bytes32" }, { "components": [{ "name": "target", "type": "address" }, { "name": "func", "type": "bytes4" }, { "name": "param", "type": "bytes" }], "name": "_items", "type": "tuple[]" }], "name": "newProposal", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "getTemplateInfo", "outputs": [{ "name": "", "type": "uint16" }, { "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "lastProposalId", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_category", "type": "uint16" }, { "name": "_templateName", "type": "string" }], "name": "initTemplate", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "proposalId", "type": "uint256" }], "name": "getProposalItems", "outputs": [{ "components": [{ "name": "target", "type": "address" }, { "name": "func", "type": "bytes4" }, { "name": "param", "type": "bytes" }], "name": "", "type": "tuple[]" }], "payable": false, "stateMutability": "view", "type": "function" }]'
    let abi = JSON.parse(abiStr)


    it('encode function hex data', function() {

      let functionABI = abi[0]

      expect(TxHelper.encodeFunctionId(functionABI)).to.be.equal('0x013cf08b')
      expect(TxHelper.encodeFunctionId({ "payable": false, "stateMutability": "nonpayable", "type": "fallback" })).to.be.equal('0x')
    })

    it('encode params hex data', function() {
      // encodeParams
      let functionABI = abi[0]
      let args = [123]
      let args1 = [-1]

      expect(TxHelper.encodeParams(functionABI, args)).to.be.equal('0x000000000000000000000000000000000000000000000000000000000000007b')
      expect(TxHelper.encodeParams(functionABI, [])).to.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000')

      expect(function() {
        TxHelper.encodeParams(functionABI, args1)
      }).to.throw('invalid number value (arg="", coderType="uint256", value=-1, version=1.0.19)')

    })

    it('make tuple definition', function() {

      let tupleInputFunctionABI = abi[1]

      expect(TxHelper.makeFullTupleTypeDefinition(tupleInputFunctionABI.inputs[1])).to.be.equal('tuple(address,bytes4,bytes)[]')
      expect(TxHelper.makeFullTupleTypeDefinition(tupleInputFunctionABI.inputs[0])).to.be.equal('bytes32')
    })

    it('get constructor ABI', function() {

      let abiStr = '[{"constant":true,"inputs":[],"name":"getPresident","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"member","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getAddressRolesMap","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPresident","type":"address"}],"name":"transferPresidentRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureAddressRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"transferAddress","type":"address"}],"name":"canTransferAsset","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"mintAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOrganizationName","type":"string"}],"name":"renameOrganization","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newMembers","type":"address[]"}],"name":"addNewMembers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_caller","type":"address"},{"name":"_functionStr","type":"string"}],"name":"canPerform","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOrganizationId","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getCreateAndMintHistory","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"asset","type":"uint256"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"transferAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"description","type":"string"},{"name":"assetType","type":"uint32"},{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"createAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_organizationName","type":"string"},{"name":"_members","type":"address[]"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"UpdateMemberEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"RenameOrganizationEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes12"}],"name":"CreateAssetEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"invitee","type":"address"}],"name":"invite","type":"event"}]';

      let constructorABI = TxHelper.getConstructorInterface(abiStr)

      expect(constructorABI).to.deep.equal({
        name: '',
        inputs: [{ name: '_organizationName', type: 'string' },
          { name: '_members', type: 'address[]' }
        ],
        type: 'constructor',
        outputs: []
      });
      expect(TxHelper.getConstructorInterface('aslkjasdu')).to.deep.equal({ 'name': '', 'inputs': [], 'type': 'constructor', 'outputs': [] })

    })
    it('sort ABI', function() {
      let abiWithContructor = '[{"constant":true,"inputs":[],"name":"getPresident","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"member","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getAddressRolesMap","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPresident","type":"address"}],"name":"transferPresidentRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureAddressRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"transferAddress","type":"address"}],"name":"canTransferAsset","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"mintAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOrganizationName","type":"string"}],"name":"renameOrganization","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newMembers","type":"address[]"}],"name":"addNewMembers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_caller","type":"address"},{"name":"_functionStr","type":"string"}],"name":"canPerform","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOrganizationId","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getCreateAndMintHistory","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"asset","type":"uint256"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"transferAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"description","type":"string"},{"name":"assetType","type":"uint32"},{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"createAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_organizationName","type":"string"},{"name":"_members","type":"address[]"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"UpdateMemberEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"RenameOrganizationEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes12"}],"name":"CreateAssetEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"invitee","type":"address"}],"name":"invite","type":"event"}]';

      expect(JSON.stringify(TxHelper.sortAbiFunction(abi))).to.be.equal('[{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_attachmentHash","type":"bytes32"},{"components":[{"name":"target","type":"address"},{"name":"func","type":"bytes4"},{"name":"param","type":"bytes"}],"name":"_items","type":"tuple[]"}],"name":"newProposal","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"proposalId","type":"uint256"}],"name":"getProposalItems","outputs":[{"components":[{"name":"target","type":"address"},{"name":"func","type":"bytes4"},{"name":"param","type":"bytes"}],"name":"","type":"tuple[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastProposalId","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"proposals","outputs":[{"name":"attachmentHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"}]')
      expect(JSON.stringify(TxHelper.sortAbiFunction(JSON.parse(abiWithContructor)))).to.be.equal('[{"anonymous":false,"inputs":[{"indexed":false,"name":"invitee","type":"address"}],"name":"invite","type":"event"},{"constant":false,"inputs":[{"name":"newMembers","type":"address[]"}],"name":"addNewMembers","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bytes12"}],"name":"CreateAssetEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"RenameOrganizationEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"","type":"bool"}],"name":"UpdateMemberEvent","type":"event"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureAddressRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_address","type":"address"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionAddressSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_function","type":"string"},{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleAdvanced","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_role","type":"string"},{"name":"_opMode","type":"uint8"}],"name":"configureFunctionRoleSuper","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"description","type":"string"},{"name":"assetType","type":"uint32"},{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"createAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_category","type":"uint16"},{"name":"_templateName","type":"string"}],"name":"initTemplate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"mintAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"member","type":"address"}],"name":"removeMember","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOrganizationName","type":"string"}],"name":"renameOrganization","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"asset","type":"uint256"},{"name":"amountOrVoucherId","type":"uint256"}],"name":"transferAsset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPresident","type":"address"}],"name":"transferPresidentRole","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"inputs":[{"name":"_organizationName","type":"string"},{"name":"_members","type":"address[]"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"constant":true,"inputs":[{"name":"_caller","type":"address"},{"name":"_functionStr","type":"string"}],"name":"canPerform","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"},{"name":"transferAddress","type":"address"}],"name":"canTransferAsset","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getAddressRolesMap","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getAssetInfo","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint32"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"assetIndex","type":"uint32"}],"name":"getCreateAndMintHistory","outputs":[{"name":"","type":"bool"},{"name":"","type":"string"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getOrganizationId","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPresident","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTemplateInfo","outputs":[{"name":"","type":"uint16"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"}]')

    })

    it('estimate fee', function() {

      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 0,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }, {
        amount: 0,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];

      var outputs2 = []
      let fee1 = TxHelper.estimateFee(inputs, outputs.slice(0, 1), 21000)
      let fee2 = TxHelper.estimateFee(inputs, outputs, 21000)

      expect(fee1).to.be.equal(400831)
      expect(fee2 - fee1).to.be.equal(1235)
    })


    it('estimate gas', function() {

      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 0,
        assets: '000000000000000000000000',
        address: '0x639eaf74a91b268dfd4717051ab299a1f23c9c5bda',
        data: '46572616c526174652069732062656c6f77207468697320726174',
        contractType: 'call'
      }, {
        amount: 0,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];

      let gas = TxHelper.estimateGas(inputs, outputs, 10000)
      outputs[0].data = ''
      let gas1 = TxHelper.estimateGas(inputs, outputs, 10000)
      expect(gas).to.be.equal(15649)
      expect(gas - gas1).to.be.equal(546)
    })

    it('test inputParametersDeclarationToString', function() {
      expect(TxHelper.inputParametersDeclarationToString([{ "name": "member", "type": "address" }])).to.be.equal('address member')
    })

    it('convert number to hex,and extend to  sepcified length', function() {
      expect(TxHelper.len2Hex(2, 4)).to.be.equal('00000002')
      expect(TxHelper.len2Hex(16, 4)).to.be.equal('00000010')
      expect(TxHelper.len2Hex(16, 2)).to.be.equal('0010')
      expect(TxHelper.len2Hex(16, 5)).to.be.equal('0000000010')
    })


    it('generate create template data', function() {
      let abi = '[{ "payable": false, "stateMutability": "nonpayable", "type": "fallback" }]'
      let category = 1
      let name = 'ASD'
      let bytecode = '608060405234801560105760006000fd5b506015565b604a8060226000396000f300608060405260043610600f57600f565b348015601b5760006000fd5b500000a165627a7a723058209350a1dcb25ca8f02b7f2d99bbc11b4661b6034997d1f2287688e63b0d8745f10029'
      let source = 'pragma solidity 0.4.25;contract FAS{function(){}}'

      expect(TxHelper.generateCreateTemplateData(1, name, bytecode, abi, source)).to.be.equal('0001000000030000006c0000004b00000031415344608060405234801560105760006000fd5b506015565b604a8060226000396000f300608060405260043610600f57600f565b348015601b5760006000fd5b500000a165627a7a723058209350a1dcb25ca8f02b7f2d99bbc11b4661b6034997d1f2287688e63b0d8745f100295b7b202270617961626c65223a2066616c73652c202273746174654d75746162696c697479223a20226e6f6e70617961626c65222c202274797065223a202266616c6c6261636b22207d5d707261676d6120736f6c696469747920302e342e32353b636f6e7472616374204641537b66756e6374696f6e28297b7d7d')
      expect(TxHelper.generateCreateTemplateData(65535, name, bytecode, abi, source)).to.be.equal('ffff000000030000006c0000004b00000031415344608060405234801560105760006000fd5b506015565b604a8060226000396000f300608060405260043610600f57600f565b348015601b5760006000fd5b500000a165627a7a723058209350a1dcb25ca8f02b7f2d99bbc11b4661b6034997d1f2287688e63b0d8745f100295b7b202270617961626c65223a2066616c73652c202273746174654d75746162696c697479223a20226e6f6e70617961626c65222c202274797065223a202266616c6c6261636b22207d5d707261676d6120736f6c696469747920302e342e32353b636f6e7472616374204641537b66756e6374696f6e28297b7d7d')

    })

    it('generate deploy contract data', function() {
      let cc = {
        name: '',
        inputs: [{ name: '_organizationName', type: 'string' },
          { name: '_members', type: 'address[]' }
        ],
        type: 'constructor',
        outputs: []
      }
      expect(TxHelper.generateDeployContractData(1, 'test', "", [])).to.be.equal('00010000000474657374')
      expect(TxHelper.generateDeployContractData(1, 'test', undefined, [])).to.be.equal('00010000000474657374')
      expect(TxHelper.generateDeployContractData(65535, 'test', undefined, [])).to.be.equal('ffff0000000474657374')
      expect(TxHelper.generateDeployContractData(1, 'test', cc, ['asd', ['0x662250F9452AC336DaAEee722615619d2BA1422793']])).to.be.equal('00010000000474657374000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000003617364000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000662250f9452ac336daaeee722615619d2ba1422793')

    })

    it('encode contract call data', function() {
      let abi = { "constant": true, "inputs": [], "name": "getPresident", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }
      expect(TxHelper.encodeCallData(abi, [])).to.be.equal('00738d22')
    })


    it('generate address from private key', function() {

      expect(TxHelper.getAddressByPrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3')).to.be.equal('0x662250f9452ac336daaeee722615619d2ba1422793')
      expect(TxHelper.getAddressByPrivateKey('')).to.be.equal('')

    })

    it('parse lock id', function() {
      expect(TxHelper.parseLockId()).to.deep.equal({})
      expect(TxHelper.parseLockId('0x66531e844d187f763dbb4f3330bdac6ed398d4bf17')).to.deep.equal({
        lockAddress: "0x66531e844d187f763dbb4f3330bdac6ed398d4bf17",
        id: 398447768
      })
    })

    it('serialize inputs', function() {
      let funAbi = {
        "constant": true,
        "inputs": [{
          "name": "",
          "type": "uint256"
        }],
        "name": "proposals",
        "outputs": [{
          "name": "attachmentHash",
          "type": "bytes32"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }

      expect(TxHelper.serializeInputs(funAbi)).to.be.equal('(uint256)')

    })


    it('get function abi from contract abi', function() {
      expect(TxHelper.getFunction(abi, 'proposals')).to.deep.equal(null)
      expect(TxHelper.getFunction(abi, 'proposals(uint256)')).to.deep.equal({
        "constant": true,
        "inputs": [{
          "name": "",
          "type": "uint256"
        }],
        "name": "proposals",
        "outputs": [{
          "name": "attachmentHash",
          "type": "bytes32"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      })
    })

    it('get call back function abi', function() {
      let abi = [{ "payable": false, "stateMutability": "nonpayable", "type": "fallback" }]
      expect(TxHelper.getFallbackInterface(abi)).to.deep.equal({ "payable": false, "stateMutability": "nonpayable", "type": "fallback" })
    })
  })

})
