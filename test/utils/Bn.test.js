'use strict';

var should = require('chai').should();
// var bitcore = require('../..');
// var BN = bitcore.utils.Bn;
var BN = require('../../lib/index').Bn;

describe('BN', function() {
  it('should create a bn', function() {
    var bn = new BN.Bn(50);
    should.exist(bn);
    bn.toString().should.equal('50');
  });

  it('should parse this number', function() {
    var bn = new BN.Bn(999970000);
    bn.toString().should.equal('999970000');
  });

  it('should parse numbers below and at bn.js internal word size', function() {
    var bn = new BN.Bn(Math.pow(2, 26) - 1);
    bn.toString().should.equal((Math.pow(2, 26) - 1).toString());
    bn = new BN.Bn(Math.pow(2, 26));
    bn.toString().should.equal((Math.pow(2, 26)).toString());
  });

  describe('#add', function() {

    it('should add two small numbers together', function() {
      var bn1 = new BN.Bn(50);
      var bn2 = new BN.Bn(75);
      var bn3 = bn1.add(bn2);
      bn3.toString().should.equal('125');
    });

  });

  describe('#sub', function() {

    it('should subtract a small number', function() {
      var bn1 = new BN.Bn(50);
      var bn2 = new BN.Bn(25);
      var bn3 = bn1.sub(bn2);
      bn3.toString().should.equal('25');
    });

  });

  describe('#gt', function() {

    it('should say 1 is greater than 0', function() {
      var bn1 = new BN.Bn(1);
      var bn0 = new BN.Bn(0);
      bn1.gt(bn0).should.equal(true);
    });

    it('should say a big number is greater than a small big number', function() {
      var bn1 = new BN.Bn('24023452345398529485723980457');
      var bn0 = new BN.Bn('34098234283412341234049357');
      bn1.gt(bn0).should.equal(true);
    });

    it('should say a big number is great than a standard number', function() {
      var bn1 = new BN.Bn('24023452345398529485723980457');
      var bn0 = new BN.Bn(5);
      bn1.gt(bn0).should.equal(true);
    });

  });

  describe('to/from ScriptNumBuffer', function() {
    [0, 1, 10, 256, 1000, 65536, 65537, -1, -1000, -65536, -65537].forEach(function(n) {
      it('rountrips correctly for ' + n, function() {
        BN.Bn.fromScriptNumBuffer(new BN.Bn(n).toScriptNumBuffer()).toNumber().should.equal(n);
      });
    });
  });

  describe('#fromString', function() {
    it('should make BN from a string', function() {
      BN.Bn.fromString('5').toString().should.equal('5');
    });
    it('should work with hex string', function() {
      BN.Bn.fromString('7fffff0000000000000000000000000000000000000000000000000000000000', 16)
      .toString(16).should.equal('7fffff0000000000000000000000000000000000000000000000000000000000');
    });
  });

  describe('#toString', function() {
    it('should make a string', function() {
      new BN.Bn(5).toString().should.equal('5');
    });
  });

  describe('@fromBuffer', function() {

    it('should work with big endian', function() {
      var bn = BN.Bn.fromBuffer(new Buffer('0001', 'hex'), {
        endian: 'big'
      });
      bn.toString().should.equal('1');
    });

    it('should work with big endian 256', function() {
      var bn = BN.Bn.fromBuffer(new Buffer('0100', 'hex'), {
        endian: 'big'
      });
      bn.toString().should.equal('256');
    });

    it('should work with little endian if we specify the size', function() {
      var bn = BN.Bn.fromBuffer(new Buffer('0100', 'hex'), {
        size: 2,
        endian: 'little'
      });
      bn.toString().should.equal('1');
    });

  });

  describe('#toBuffer', function() {

    it('should create a 4 byte buffer', function() {
      var bn = new BN.Bn(1);
      bn.toBuffer({
        size: 4
      }).toString('hex').should.equal('00000001');
    });

    it('should create a 4 byte buffer in little endian', function() {
      var bn = new BN.Bn(1);
      bn.toBuffer({
        size: 4,
        endian: 'little'
      }).toString('hex').should.equal('01000000');
    });

    it('should create a 2 byte buffer even if you ask for a 1 byte', function() {
      var bn = new BN.Bn('ff00', 16);
      bn.toBuffer({
        size: 1
      }).toString('hex').should.equal('ff00');
    });

    it('should create a 4 byte buffer even if you ask for a 1 byte', function() {
      var bn = new BN.Bn('ffffff00', 16);
      bn.toBuffer({
        size: 4
      }).toString('hex').should.equal('ffffff00');
    });

  });

});
