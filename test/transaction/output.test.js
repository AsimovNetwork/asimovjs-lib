var should = require("chai").should();
var expect = require("chai").expect;
var _ = require("lodash");

var BN = require('../../lib/index').Bn;
var BufferWriter = require('../../lib/index').BufferWriter;
var BufferReader = require('../../lib/index').BufferReader;
var Output = require('../../lib/index').Output;
var Script = require('../../lib/index').Script;

describe("Output", function() {

  var output = new Output({
    amount: 0,
    pkScript: Script.empty()
  });

  it("throws error with unrecognized argument", function() {

    (function() {
      var out = new Output(12345);
    }.should.throw(TypeError));

  });
  it("throws erro with invalid script", function() {
    var br = new BufferReader(new Buffer("0100000000000000014c0000", "hex"));
    (function() {
      var output = Output.fromBufferReader(br);
    }.should.throw("Invalid script buffer: can't parse valid script from given buffer 4c"))

  })

  it("can be assigned a satoshi amount in big number", function() {
    var newOutput = new Output({
      amount: new BN.Bn(100),
      pkScript: Script.empty()
    });
    newOutput.amount.should.equal(100);
  });

  it("can be assigned a satoshi amount with a string", function() {
    var newOutput = new Output({
      amount: "100",
      pkScript: Script.empty()
    });
    newOutput.amount.should.equal(100);
  });

  var expectEqualOutputs = function(a, b) {
    a.amount.should.equal(b.amount);
    a.pkScript.toString().should.equal(b.pkScript.toString());
  };

  it("deserializes correctly a simple output", function() {

    var writer = output.toBufferWriter();
    var deserialized = Output.fromBufferReader(
      new BufferReader(writer.toBuffer())
    );
    output.amount.should.equal(deserialized.amount)
    output.pkScript.toString().should.equal(deserialized.pkScript.toString())

  });

  it("can instantiate from an object", function() {
    var out = new Output(output.toObject());
    should.exist(out);
  });

  it("can set a script from a buffer", function() {
    var newOutput = new Output(output.toObject());
    newOutput.pkScript = new Script().add(0)
    newOutput.inspect().should.equal("<Output (0 sats) <Script: OP_0>>");
  });

  it("has a inspect property", function() {
    output.inspect().should.equal("<Output (0 sats) <Script: >>");
  });


  var output2 = new Output({
    amount: 1100000000,
    pkScript: new Script(
      "OP_2 21 0x038282263212c609d9ea2a6e3e172de238d8c39" +
      "cabd5ac1ca10646e23fd5f51508 21 0x038282263212c609d9ea2a6e3e172de23" +
      "8d8c39cabd5ac1ca10646e23fd5f51508 OP_2 OP_CHECKMULTISIG OP_EQUAL"
    )
  })

  it("toBufferWriter", function() {
    output2
      .toBufferWriter()
      .toBuffer()
      .toString("hex")
      .should.equal(
        "00ab904100000000485215038282263212c609d9ea2a6e3e172de2" +
        "38d8c39cabd5ac1ca10646e23fd5f5150815038282263212c609d9ea2a6e3e172d" +
        "e238d8c39cabd5ac1ca10646e23fd5f5150852ae870000"
      );
  });

  it("roundtrips to/from object", function() {
    var newOutput = new Output({
      amount: 50,
      pkScript: new Script().add(0)
    });
    var otherOutput = new Output(newOutput.toObject());
    newOutput.amount.should.equal(otherOutput.amount)
    newOutput.pkScript.toString().should.equal(otherOutput.pkScript.toString())
  });


  it("roundtrips to/from JSON", function() {
    var json = JSON.stringify(output2);
    var o3 = new Output(JSON.parse(json));
    JSON.stringify(o3).should.equal(json);
  });


  describe("will error if output is not a positive integer", function() {
    it("-100", function() {
      (function() {
        var newOutput = new Output({
          amount: -100,
          pkScript: Script.empty()
        });
      }.should.throw("Output amount is not a natural number"));
    });

    it("1.1", function() {
      (function() {
        var newOutput = new Output({
          amount: 1.1,
          pkScript: Script.empty()
        });
      }.should.throw("Output amount is not a natural number"));
    });

    it("NaN", function() {
      (function() {
        var newOutput = new Output({
          amount: NaN,
          pkScript: Script.empty()
        });
      }.should.throw("Output amount is not a natural number"));
    });

    it("Infinity", function() {
      (function() {
        var newOutput = new Output({
          amount: Infinity,
          pkScript: Script.empty()
        });
      }.should.throw("Output amount is not a natural number"));
    });
  });

});
