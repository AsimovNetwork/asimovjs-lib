'use strict';

/* jshint unused: false */
/* jshint latedef: false */
var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

var Signature = require('../../lib/index').Signature
var Bn = require('../../lib/index').Bn


describe('Signature', function() {
  it('from compact', function() {
    let add = '1f77af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458111f77af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe5845811'
    var buf = Buffer.from(add, 'hex');
    var bytes = Signature.fromCompact(buf);
    bytes.compressed.should.equal(true);
  });

  it('to compact', function() {
    let bn1 = new Bn.Bn('1f77af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe5845811')
    let bn2 = new Bn.Bn('1f77af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe5845812')
    let sig = new Signature(bn1, bn2)
    let buf = sig.toCompact(0, true)
    sig.toCompact(0, true).length.should.equal(65)
    Buffer.isBuffer(buf).should.equal(true);
  });
});
