'use strict';


var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var BN = require('../../lib/index').BigNumber



describe('BigNumber', function() {

  describe('New a big number', function() {
    it('should return 0x0', function() {
      let bn = new BN.BigNumber('0x')
      bn._hex.should.equal('0x0');
    });

    it('invalid BigNumber string value', function() {
      (function() {
        new BN.BigNumber('0xQWER')
      }.should.throw('invalid BigNumber string value'))
    });

    it('underflow', function() {
      (function() {
        new BN.BigNumber(1.1)
      }.should.throw('underflow'))
    });

    it('value is bignumber', function() {
      let bn = new BN.BigNumber(123)
      let bn1 = new BN.BigNumber(bn)
      bn1._hex.should.equal('0x7b');
    });

    it('invalid BigNumber value', function() {
      (function() {
        new BN.BigNumber([123,456])
      }.should.throw('invalid BigNumber value'))
    });
  });

  describe('calculate big number', function() {
    it('from twos', function() {
      let bn = new BN.BigNumber(11)
      bn.fromTwos(2)._hex.should.equal('-0x01');
    });

    it('add', function() {
      let bn1 = new BN.BigNumber(11)
      let bn2 = new BN.BigNumber(12)
      bn1.add(bn2)._hex.should.equal('0x17');
    });

    it('sub', function() {
      let bn1 = new BN.BigNumber(11)
      let bn2 = new BN.BigNumber(12)
      bn2.sub(bn1)._hex.should.equal('0x01');
    });

    it('div', function() {
      let bn1 = new BN.BigNumber(12)
      let bn2 = new BN.BigNumber(4)
      bn1.div(bn2)._hex.should.equal('0x03');
    });

    it('mul', function() {
      let bn1 = new BN.BigNumber(3)
      let bn2 = new BN.BigNumber(4)
      bn1.mul(bn2)._hex.should.equal('0x0c');
    });

    it('mod', function() {
      let bn1 = new BN.BigNumber(9)
      let bn2 = new BN.BigNumber(4)
      bn1.mod(bn2)._hex.should.equal('0x01');
    });

    it('pow', function() {
      let bn1 = new BN.BigNumber(2)
      let bn2 = new BN.BigNumber(3)
      bn1.pow(bn2)._hex.should.equal('0x08');
    });

    it('eq', function() {
      let bn1 = new BN.BigNumber(3)
      let bn2 = new BN.BigNumber(3)
      bn1.eq(bn2).should.equal(true);
    });

    it('lte', function() {
      let bn1 = new BN.BigNumber(3)
      let bn2 = new BN.BigNumber(4)
      bn1.lte(bn2).should.equal(true);
    });

    it('gte', function() {
      let bn1 = new BN.BigNumber(3)
      let bn2 = new BN.BigNumber(4)
      bn1.gte(bn2).should.equal(false);
    });

    it('isZero', function() {
      let bn1 = new BN.BigNumber(3)
      bn1.isZero().should.equal(false);
    });

    it('toString', function() {
      let bn1 = new BN.BigNumber(3)
      bn1.toString().should.equal('3');
    });

  });
});
