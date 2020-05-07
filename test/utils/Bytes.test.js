'use strict';


var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var bytes = require('../../lib/index').Bytes
var Signature = require('../../lib/index').Signature
var Bn = require('../../lib/index').Bn


describe('Bytes', function() {
  it('strip zeros', function() {
    let arr = bytes.stripZeros([100])
    arr.toString().should.equal((new Uint8Array([100])).toString());
  });

  it('strip zeros value length zero', function() {
    let arr = bytes.stripZeros([])
    arr.toString().should.equal((new Uint8Array([])).toString());
  });

  it('pad zeros', function() {
    (function() {
      bytes.padZeros([100],0)
    }.should.throw('cannot pad'))
  });

  it('isHexString length err', function() {
    let res = bytes.isHexString('0x12343', 1)
    res.should.equal(false);
  });

  it('hexlify value can not be negative', function() {
    (function() {
      bytes.hexlify(-1)
    }.should.throw('cannot hexlify negative value'))
  });

  it('hexlify number', function() {
    let res = bytes.hexlify(123)
    res.should.equal('0x7b');
  });

  it('hexlify invalid hexidecimal string', function() {
    (function() {
      bytes.hexlify('0xqwer')
    }.should.throw('invalid hexidecimal string'))
  });

  it('hex string must have 0x prefix', function() {
    (function() {
      bytes.hexlify('1234')
    }.should.throw('hex string must have 0x prefix'))
  });

  it('hexlify string', function() {
    let res = bytes.hexlify('0x12345')
    res.should.equal('0x012345');
  });

  it('invalid hexlify value', function() {
    (function() {
      bytes.hexlify({key: '1234'})
    }.should.throw('invalid hexlify value'))
  });

  it('hex data length error', function() {
    let res = bytes.hexDataLength('0x12345')
    Number(res).should.equal(0);
  });

  it('hex data length true', function() {
    let res = bytes.hexDataLength('0x1234')
    res.should.equal(2);
  });

  it('splitSignature is Signature', function() {
    let sig = new Signature()
    sig.r = '0x1234'
    sig.s = '0x5678'
    sig.v = 123
    let res = bytes.splitSignature(sig)
    res.r.should.equal('0x0000000000000000000000000000000000000000000000000000000000001234');
    res.s.should.equal('0x0000000000000000000000000000000000000000000000000000000000005678');
    res.v.should.equal(27);
  });

  it('splitSignature is not Signature', function() {
    let res = bytes.splitSignature('0x1234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812')

    res.r.should.equal('0x1234567812345678123456781234567812345678123456781234567812345678');
    res.s.should.equal('0x1234567812345678123456781234567812345678123456781234567812345678');
    res.v.should.equal(27);
  });

  it('splitSignature invalid signature', function() {
    (function() {
      bytes.splitSignature('0x1234')
    }.should.throw('invalid signature'))
  });

  it('hex strip zeros', function() {
    let res = bytes.hexStripZeros('0x012345')
    res.should.equal('0x12345');
  });

  it('hexStripZeros invalid hex string', function() {
    (function() {
      bytes.hexStripZeros('0x012345G')
    }.should.throw('invalid hex string'))
  });

  it('hexDataSlice invalid hex data', function() {
    (function() {
      bytes.hexDataSlice('0x012345G')
    }.should.throw('invalid hex data'))
  });

  it('hexDataSlice hex data length must be even', function() {
    (function() {
      bytes.hexDataSlice('0x01234')
    }.should.throw('hex data length must be even'))
  });

  it('hexDataSlice', function() {
    let res = bytes.hexDataSlice('0x012345',1,2)
    res.should.equal('0x23');
  });

  it('hexDataSlice no end offset', function() {
    let res = bytes.hexDataSlice('0x012345',1)
    res.should.equal('0x2345');
  });

  it('arrayify cannot convert null value to array', function() {
    (function() {
      bytes.arrayify()
    }.should.throw('cannot convert null value to array'))
  });

  it('arrayify invalid hexidecimal string', function() {
    (function() {
      bytes.arrayify('0x1234G')
    }.should.throw('invalid hexidecimal string'))
  });

  it('arrayify hex string must have 0x prefix', function() {
    (function() {
      bytes.arrayify('1234')
    }.should.throw('hex string must have 0x prefix'))
  });

  it('arrayify ', function() {
    let res = bytes.arrayify('0x12345')
    res.toString().should.equal((new Uint8Array([ 1, 35, 69 ])).toString());
  });
});
