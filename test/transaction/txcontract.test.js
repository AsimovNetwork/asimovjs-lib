var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

var BufferReader = require('../../lib/index').BufferReader;
var Address = require('../../lib/index').Address;
var Script = require('../../lib/index').Script;
var Networks = require('../../lib/index').Networks;
var Input = require('../../lib/index').Input;
var Transaction = require('../../lib/index').Transaction;
var TxContract = require('../../lib/index').TxContract;

describe('TxContract', function() {




  it('create txContract without config', function() {
    let c = new TxContract()
    expect(c.gasLimit).to.be.equal(21000)
  })

  it('create txContract with config', function() {
    let c = new TxContract({
      gasLimit: 1000
    })
    expect(c.gasLimit).to.be.equal(1000)
  })

  it('create txContract with 0 gasLimit', function() {
    let c = new TxContract({
      gasLimit: 0
    })
    expect(c.gasLimit).to.be.equal(0)
  })

  it('roundtrip on toBuffer,toBufferWriter and fromBufferReader', function() {

    let c = new TxContract()
    let buf = c.toBufferWriter().toBuffer()
    let buf1 = c.toBuffer()
    let reader1 = new BufferReader(buf)
    let reader2 = new BufferReader(buf1)
    let c2 = TxContract.fromBufferReader(reader1)
    let c3 = TxContract.fromBufferReader(reader2)

    expect(c3.toHex()).to.be.equal(c.toHex())
    expect(c2.toHex()).to.be.equal(c.toHex())

  })



});
