var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

var BufferReader = require('../../lib/index').BufferReader;
var PrivateKey = require('../../lib/index').PrivateKey;

var Address = require('../../lib/index').Address;
var Script = require('../../lib/index').Script;
var Networks = require('../../lib/index').Networks;
var Input = require('../../lib/index').Input;
var Transaction = require('../../lib/index').Transaction;

describe('Input', function() {

  var privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
  var publicKey = privateKey.publicKey;
  var address = new Address(publicKey);
  var output = {
    address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
    amount: 500000000,
    assets: "000000000000000000000000",
    scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
    txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
    vout: 0
  };
  var coinbase = {
    txid: '0000000000000000000000000000000000000000000000000000000000000000',
    vout: 0xFFFFFFFF,
    scriptPubKey: new Script(),
    amount: 1000000
  };

  var coinbaseJSON = JSON.stringify({
    txid: '0000000000000000000000000000000000000000000000000000000000000000',
    vout: 4294967295,
    scriptPubKey: ''
  });

  var otherJSON = JSON.stringify({
    txidbuf: 'a477af6b2667c29670467e4e0728b685ee07b240235771862318e29ddbe58458',
    txoutnum: 0,
    seqnum: 4294967295,
    scriptPubKey: '71 0x3044022006553276ec5b885ddf5cc1d79e1e3dadbb404b60ad4cc00318e21565' +
      '4f13242102200757c17b36e3d0492fb9cf597032e5afbea67a59274e64af5a05d12e5ea2303901 ' +
      '33 0x0223078d2942df62c45621d209fab84ea9a7a23346201b7727b9b45a29c4e76f5e',
    prevOut: {
      'amount': 100000,
      'script': 'OP_DUP OP_HASH160 21 0x662250f9452ac336daaeee722615619d2ba1422793 ' +
        'OP_EQUALVERIFY OP_CHECKSIG'
    }
  });

  it('detects coinbase transactions', function() {

    new Input(output).isNull().should.equal(false)
    new Input(coinbase).isNull().should.equal(true)

  });

  describe('#instantiation', function() {
    it('create a input only with txid and vout', function() {
      let config = {
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0
      }
      let input = new Input(config)

      expect(input.getScript().toString()).to.be.equal(Script.empty().toString())
      //should.not.exist();
      let prevOut = input.output.toObject()

      should.not.exist(prevOut.amount)
      should.not.exist(prevOut.assets)
      should.not.exist(prevOut.address)

      expect(prevOut.data).to.be.equal('')
      expect(prevOut.pkScript.toString()).to.be.equal(Script.empty().toString())

    })

    it('create a input which contains previous output', function() {
      let config = {
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0,
        sequence: '',
        scriptPubKey: '76a915662250f9452ac336daaeee722615619d2ba1422793c5ac',
        scriptPubKeyBuffer: '',
        sigScript: '',
        sigScriptBuffer: '',
        prevOut: '',
        amount: 500000000,
        assets: '000000000000000000000000',
        address: '0x662250F9452AC336DaAEee722615619d2BA1422793',
        redeemScript: '',
        redeemScriptBuffer: ''
      }
      let input = new Input(config)
      let prevOut = input.output.toObject()

      expect(input.getScript().toHex()).to.be.deep.equal(prevOut.pkScript)

      expect(prevOut.address).to.equal(config.address)
      expect(prevOut.amount).to.equal(config.amount)
      expect(prevOut.assets).to.equal(config.assets)

    })

    it('create a P2SH multisig input with redeemScript', function() {
      let config = {
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0,
        sequence: '',
        scriptPubKey: 'a9157377e4d38ec8db336fe7e30b433bd6124ccfe80387c4',
        scriptPubKeyBuffer: '',
        sigScript: '',
        sigScriptBuffer: '',
        prevOut: '',
        amount: 500000000,
        assets: '000000000000000000000000',
        address: '0x7332032786c61472128d1b3185c92626f8ff0ee4d3',
        redeemScript: '5221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53ae',
        redeemScriptBuffer: ''
      }

      let input = new Input(config)

      expect(input.redeemScript.toHex()).to.be.equal(config.redeemScript)
      expect(input.output.pkScript.toHex()).to.be.equal(config.scriptPubKey)
      expect(input.output.address).to.be.equal(config.address)
      expect(input.output.amount).to.be.equal(config.amount)
      expect(input.output.assets).to.be.equal(config.assets)

    })
    it('create a P2PKH input with signature script', function() {
      let config = {
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0,
        sequence: '',
        scriptPubKey: '76a915662250f9452ac336daaeee722615619d2ba1422793c5ac',
        scriptPubKeyBuffer: '',
        sigScript: '483045022100a591d0ad121b2e8bb99a582dfe747d9cdde88f997e5359f73c289e352b1583db0220452b7c2f8024c28e93c84c6e607f6ca2719fdd7ae5233600edaa2612e7599d9e0121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1',
        sigScriptBuffer: '',
        prevOut: '',
        amount: 500000000,
        assets: '000000000000000000000000',
        address: '0x7332032786c61472128d1b3185c92626f8ff0ee4d3',
        redeemScript: '',
        redeemScriptBuffer: ''
      }
      let input = new Input(config)
      input.getSigScript().isPublicKeyHashIn().should.be.equal(true)
      expect(input.getSigScript().toHex()).to.be.equal('483045022100a591d0ad121b2e8bb99a582dfe747d9cdde88f997e5359f73c289e352b1583db0220452b7c2f8024c28e93c84c6e607f6ca2719fdd7ae5233600edaa2612e7599d9e0121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1')
    })

    it('create a P2SH multisig input with 2 signature ', function() {
      let config = {
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0,
        sequence: '',
        scriptPubKey: 'a9157377e4d38ec8db336fe7e30b433bd6124ccfe80387c4',
        scriptPubKeyBuffer: '',
        sigScript: '47304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af0148304502210086ec93aaf67c3d2c721047572b61b7ae007b7e4822d056824a447766c31c970a0220793f2210bff42fffe53293a96eee4d817a2ce4770b70052bcab0e3681c947d07014c6952210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae',
        sigScriptBuffer: '',
        prevOut: '',
        amount: 500000000,
        assets: '000000000000000000000000',
        address: '0x7332032786c61472128d1b3185c92626f8ff0ee4d3',
        redeemScript: '52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae',
        redeemScriptBuffer: ''
      }
      let input = new Input(config)
      input.getSigScript().isScriptHashIn().should.be.equal(true)
      expect(input.getSigScript().toHex()).to.be.equal('47304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af0148304502210086ec93aaf67c3d2c721047572b61b7ae007b7e4822d056824a447766c31c970a0220793f2210bff42fffe53293a96eee4d817a2ce4770b70052bcab0e3681c947d07014c6952210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')

    })

    it('roundtrips to/from object', function() {
      var jsonData = JSON.parse(coinbaseJSON)
      var input = Input.fromObject(jsonData)
      should.exist(input)
      input.prevTxId.toString('hex').should.equal(jsonData.txid)
      input.vout.should.equal(jsonData.vout)
      var obj = input.toObject()
      var input1 = Input.fromObject(obj)
      input1.prevTxId.should.equal(input.prevTxId)
      input1.vout.should.equal(input.vout)
      input1.sequence.should.equal(input.sequence)
    })

  });

  describe('#get and set', function() {
    it('set get in P2PKH input', function() {
      let input = new Input({
        txid: '5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693',
        vout: 0,
        address: '0x662250F9452AC336DaAEee722615619d2BA1422793'
      })
      let script = '76a915662250f9452ac336daaeee722615619d2ba1422793c5ac'
      input.setScript(script)
      input.getScript().toHex().should.equal(script)
      let tx = new Transaction({
        inputs: [input],
        outputs: [{
          amount: 200000000,
          assets: '000000000000000000000000',
          address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
        }]
      })

      let signature = '3045022100a591d0ad121b2e8bb99a582dfe747d9cdde88f997e5359f73c289e352b1583db0220452b7c2f8024c28e93c84c6e607f6ca2719fdd7ae5233600edaa2612e7599d9e'
      tx.sign(['0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'])
      tx.inputs[0].getSignature().toString().should.equal(signature)


      let sigScript = tx.inputs[0].getSigScript()
      tx.inputs[0].setSigScript(sigScript)
      tx.inputs[0].getSigScript().should.deep.equal(sigScript)

    })

    it('set get in P2SH multisig input', function() {
      let input = new Input({
        txid: 'c46432c8c4462ec6e815aeced044ab688bad36edca0316e9eda4953691e56d0d',
        vout: 0,
        address: '0x73c84bed5683ff2afab5bb5de968c18ad28a2ea91a'
      })
      let script = 'a91573c84bed5683ff2afab5bb5de968c18ad28a2ea91ac4'
      let redeemScript = '5221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53ae'
      input.setScript(script)
      input.redeemScript = redeemScript
      input.getScript().toHex().should.equal(script)
      input.redeemScript.toHex().should.equal(redeemScript)
      let tx = new Transaction({
        inputs: [input],
        outputs: [{
          address: '0x66da67bf3462da51f083b5fed4662973a62701a687',
          amount: 1100000000,
          assets: '000000000000000000000000'
        }]
      })
      let signatures = ['3045022100fd2739982ea80cd5e36a650d060058ca275d23a44c7a717b54eb2bd85226a7d6022036965368d31ead2a27b5b7af1d7e0c9e4f38b70afc7329356e2a6fbffffc4fcc', undefined, '3045022100aa9a4025e926a77ae343f4f4630a62194af91e84c764095dbccdf6c0ee9aa68b02203099518205a36256c4d8b18ba9a697857398a73cd2a3b889c77031d74304b49d']
      tx.sign(['82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153', 'd21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17'])
      tx.inputs[0].getSignatures().forEach((s, idx) => {
        if (s) {
          s.toString().should.equal(signatures[idx])
        }
      })

      let sigScript = tx.inputs[0].getSigScript()
      tx.inputs[0].setSigScript(sigScript)
      tx.inputs[0].getSigScript().should.deep.equal(sigScript)

    })
  })

  describe('#serialized', function() {

    it('toObject and toJSON', function() {
      let input = new Input({
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      })
      let json = input.toJSON()
      let obj = input.toObject()
      expect(json).to.deep.equal(obj)

      let input2 = new Input(json)
      expect(input2.toBufferWriter().toBuffer().toString('hex')).to.be.equal(input.toBufferWriter().toBuffer().toString('hex'))

    })

    it('toUnsignBufferWriter and toBufferWriter', function() {
      let input = new Input({
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      })
      //toBufferWriter
      let reader = new BufferReader(input.toBufferWriter().toBuffer())
      let input2 = Input.fromBufferReader(reader)
      expect(input2.scriptPubKey).to.be.an('undefined')

      //toUnsignedBufferWriter
      let reader2 = new BufferReader(input.toUnsignBufferWriter().toBuffer())
      let input3 = Input.fromBufferReader(reader2)
      expect(input3.scriptPubKey).to.be.equal(input.scriptPubKey)

    })

  })

  it('estimateSize returns correct size', function() {
    var input = new Input(output);
    input.estimateSize().should.equal(41);
  });


});
