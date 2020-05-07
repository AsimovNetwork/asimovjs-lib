'use strict';
var expect = require('chai').expect;
var should = require('chai').should();
var Transaction = require('../../lib/index').Transaction
var Script = require('../../lib/index').Script
var PrivateKey = require('../../lib/index').PrivateKey
var Input = require('../../lib/index').Input
var Output = require('../../lib/index').Output

describe('Transaction', function() {

  describe('#instantiation', function() {

    it('construct normal transaction', function() {
      //  transaction hex(without signature) generated from vvs-core
      var hex = '01000000015048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f56930000000000ffffffff0100c2eb0b000000001a76a915669eaf74a91b268dfd4717051ab299a1f23c9c5bdac5ac0c000000000000000000000000000852000000000000';

      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];

      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs
      });
      expect(tx.toHex()).to.be.equal(hex);
    })

    it('construct transaction without output', function() {

      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];

      (function() {
        new Transaction({
          inputs: inputs
        })
      }.should.throw('Invalid Argument: Output length is 0'))

    })

    it('construct transaction without input', function() {

      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];

      (function() {
        new Transaction({
          outputs: outputs
        })
      }.should.throw('Invalid Argument: Input length is 0'))

    })

    it('create transaction with Input and Output instance', function() {
      var inputConfig = {
        address: "0x66225 0F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }
      var outputConfig = {
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }
      let tx = new Transaction({
        inputs: [inputConfig],
        outputs: [outputConfig]
      })
      let hex = tx.toHex()
      let tx1 = new Transaction({
        inputs: [new Input(inputConfig)],
        outputs: [outputConfig]
      })
      let tx2 = new Transaction({
        inputs: [inputConfig],
        outputs: [new Output(outputConfig)]
      })
      let tx3 = new Transaction({
        inputs: [new Input(inputConfig)],
        outputs: [new Output(outputConfig)]
      })

      expect(tx1.toHex()).to.be.equal(hex)
      expect(tx2.toHex()).to.be.equal(hex)
      expect(tx3.toHex()).to.be.equal(hex)
    })

    it('create transaction with lockTime', function() {
      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs,
        lockTime: 1577244434
      });
      let tx2 = new Transaction({
        inputs: inputs,
        outputs: outputs,
        version: 2
      });
      let tx3 = new Transaction({
        inputs: inputs,
        outputs: outputs,
        gasLimit: 1000
      });

      expect(tx.lockTime).to.be.equal(1577244434)
      expect(tx2.version).to.be.equal(2)
      expect(tx3.txContract.gasLimit).to.be.equal(1000)

    })

    it('sign transaction', function() {
      // signed transaction hex generated from vvs-core
      var hex = '01000000015048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693000000006b483045022100a591d0ad121b2e8bb99a582dfe747d9cdde88f997e5359f73c289e352b1583db0220452b7c2f8024c28e93c84c6e607f6ca2719fdd7ae5233600edaa2612e7599d9e0121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1ffffffff0100c2eb0b000000001a76a915669eaf74a91b268dfd4717051ab299a1f23c9c5bdac5ac0c000000000000000000000000000852000000000000';
      var privateKey = '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3';
      let tx = new Transaction({
        inputs: [{
          address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
          amount: 500000000,
          assets: "000000000000000000000000",
          scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
          txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
          vout: 0
        }],
        outputs: [{
          amount: 200000000,
          assets: '000000000000000000000000',
          address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
        }]
      });

      expect(tx.sign([privateKey]).toHex()).to.be.equal(hex);
    })

    it('call contract transaction', function() {
      var hex = "0100000001df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668000000006a47304402205db66c8f6c3b9a121efa399be3b52b56f5e5e2067cf018a7c333d1f60202dd0702205ba4a40bc30ea1d52ef3f5f37991a2f4a49922349ece08e6e2ec1b9cf4a4a4060121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1ffffffff01000000000000000001c10c0000000000000000000000006f0001000000097765776574747474740000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000731323331323331000000000000000000000000000000000000000000000000000852000000000000";
      var privateKey = '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3';
      var inputs = [{
        txid: "df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668",
        vout: 0,
        address: "0x662250f9452ac336daaeee722615619d2ba1422793",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        amount: 500000000,
        assets: "000000000000000000000000"
      }];

      var outputs = [{
        amount: 0,
        data: "000100000009776577657474747474000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000073132333132333100000000000000000000000000000000000000000000000000",
        assets: "000000000000000000000000",
        address: "0x662250f9452ac336daaeee722615619d2ba1422793",
        contractType: "create"
      }]
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs,
        gasLimit: 21000
      });

      expect(tx.sign([privateKey]).toHex()).to.be.equal(hex);
    })

    it('call genesis contract', function() {

      var hex = "0100000001df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668000000006b483045022100aafeb3d6c560e950c4dd2ffa4cc28d17a3a8b34e9558ebf2d2e0217ec0f2326a0220583d9081ba75200c38fe4c8428f47e4ddfc2f1a3f2e771cd5502a4d904ae8ab70121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1ffffffff01000000000000000017c2156358dab7cae438f9647e7eebea5697d9e6f2e95b810c0000000000000000000000006f0001000000097765776574747474740000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000731323331323331000000000000000000000000000000000000000000000000000852000000000000";
      var privateKey = '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3';
      var inputs = [{
        txid: "df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668",
        vout: 0,
        address: "0x662250f9452ac336daaeee722615619d2ba1422793",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        amount: 500000000,
        assets: "000000000000000000000000"
      }];

      var outputs = [{
        amount: 0,
        data: "000100000009776577657474747474000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000073132333132333100000000000000000000000000000000000000000000000000",
        assets: "000000000000000000000000",
        address: "0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81",
        contractType: "call"
      }]
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs
      });


      expect(tx.sign([privateKey]).toHex()).to.be.equal(hex);
    })

    it('create template', function() {

      var hex = "0100000001df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668000000006a473044022010db850634f47b2c4c7da58bdfa5f891d15ce622bf80a311d086623a897ba69102203efec6abb0196d8d2887558260317eb2e67fe35986fcfef0aa515aba3dc63d870121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1ffffffff01000000000000000001c00c0000000000000000000000006f0001000000097765776574747474740000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000731323331323331000000000000000000000000000000000000000000000000000852000000000000";
      var privateKey = '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3';
      var inputs = [{
        txid: "df972a09734147ffafec91401bb9bea692d0922401277e476367a07df4b99668",
        vout: 0,
        address: "0x662250f9452ac336daaeee722615619d2ba1422793",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        amount: 500000000,
        assets: "000000000000000000000000"
      }];

      var outputs = [{
        amount: 0,
        data: "000100000009776577657474747474000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000073132333132333100000000000000000000000000000000000000000000000000",
        assets: "000000000000000000000000",
        address: "0x6358dab7cae438f9647e7eebea5697d9e6f2e95b81",
        contractType: "template"
      }]
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs
      });


      expect(tx.sign([privateKey]).toHex()).to.be.equal(hex);
    })

    it('transaction from raw hex', function() {
      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs
      });
      let hex = tx.toHex()

      let t = Transaction.fromHex(hex)

      expect(t.toHex()).to.be.equal(hex);
    })

    it('sign normal transaction from hex', function() {
      var inputs = [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }, {
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }];
      var outputs = [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }];
      let tx = new Transaction({
        inputs: inputs,
        outputs: outputs
      });
      let unsignRawHex = tx.toUnsignHex()
      tx.sign(['0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'])
      let tx2 = Transaction.fromHex(unsignRawHex)
      tx2.sign(['0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3'])
      expect(tx.toHex()).to.be.equal(tx2.toHex());
      Transaction.fromHex(tx2.toHex())
    })

    it('send asset to m-n multisign address', function() {
      let hex = '010000000130a856e597a90e9feee8193e56f77507dbbf0c210b4afeec756a4522816394a4000000006b483045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d01210317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dcaffffffff01008c864700000000695221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53ae0c000000000000000000000000000852000000000000'
      let pk1 = '82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153'
      let pk2 = 'cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9'
      let pk3 = 'd21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17'
      let pub1 = new PrivateKey('82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153').publicKey.toString()
      let pub2 = new PrivateKey('cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9').publicKey.toString()
      let pub3 = new PrivateKey('d21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17').publicKey.toString()
      let pkScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)

      let tx = new Transaction({
        inputs: [{
          address: "0x6632032786c61472128d1b3185c92626f8ff0ee4d3",
          amount: 8500000000,
          assets: "000000000000000000000000",
          scriptPubKey: "76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac",
          txid: "30a856e597a90e9feee8193e56f77507dbbf0c210b4afeec756a4522816394a4",
          vout: 0
        }],
        outputs: [{
          amount: 1200000000,
          pkScript: pkScript,
          assets: '000000000000000000000000'
        }]
      })

      tx.sign(['7eecba084c2ef8a22ef3d2aa4f7ecf2ce0e9d36b717f2f66f35717ae2806e56c'])
      let rawTx = tx.toHex()
      expect(tx.toHex()).to.be.equal(hex)
    })

    it('sign m-n multisign transaction', function() {
      let hex = '010000000179f9dc5bddb4edcfd2a1f8ffa8abc41e1602d863a22defaf649a5276e5a302760000000091483045022100e86d171d456fa91a15dbae540fb2ff62f1aebc330911bd3f763afc42ecba1778022046acc757d9ea4fd56c01ec3fdd02f6b04a9d96ba0eb2aa2b3d68646e6cdf869a0147304402202bae39fd8017889412ab85e8c6340ffe99c572175cc3aa51381dfae479dda5bb02203f730f90797419848c6d80f0c244f3418b33fe3545dce46968c7bbc40f3eb86801ffffffff0100ab9041000000001a76a91566da67bf3462da51f083b5fed4662973a62701a687c5ac0c000000000000000000000000000852000000000000'
      let pk1 = '82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153'
      let pk2 = 'cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9'
      let pk3 = 'd21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17'

      let tx = new Transaction({
        inputs: [{
          amount: 1200000000,
          assets: "000000000000000000000000",
          scriptPubKey: "52210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c21037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd953ae",
          txid: "79f9dc5bddb4edcfd2a1f8ffa8abc41e1602d863a22defaf649a5276e5a30276",
          vout: 0
        }],
        outputs: [{
          address: '0x66da67bf3462da51f083b5fed4662973a62701a687',
          amount: 1100000000,
          assets: '000000000000000000000000'
        }]
      })

      tx.sign([pk2, pk3])
      expect(tx.toHex()).to.be.equal(hex)
    })

    it('send asset to multisign address by P2SH', function() {
      let hex = '010000000111f938a85710aaa4b027d41110f7887af441d40491967a1fff1207572d90c91d000000006a47304402201b015bdc8538c9393efdd10496b5585831a9af2fca0486bb128ba420c892301102205aba90f8c81b3592567a2833e02a93ad53ce05c481b2862af2173ceaa6c633f301210317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dcaffffffff01008c86470000000018a9157377e4d38ec8db336fe7e30b433bd6124ccfe80387c40c000000000000000000000000000852000000000000'
      let pk1 = '82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153'
      let pk2 = 'cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9'
      let pk3 = 'd21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17'
      let pub1 = new PrivateKey('82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153').publicKey.toString()
      let pub2 = new PrivateKey('cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9').publicKey.toString()
      let pub3 = new PrivateKey('d21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17').publicKey.toString()

      let pkScript = Script.buildPayToScriptHashScript(Script.buildMultisigOut([pub1, pub2, pub3], 2))

      let tx = new Transaction({
        inputs: [{
          address: "0x6632032786c61472128d1b3185c92626f8ff0ee4d3",
          amount: 8500000000,
          assets: "000000000000000000000000",
          scriptPubKey: "76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac",
          txid: "11f938a85710aaa4b027d41110f7887af441d40491967a1fff1207572d90c91d",
          vout: 0
        }],
        outputs: [{
          amount: 1200000000,
          pkScript: pkScript,
          assets: '000000000000000000000000'
        }]
      })
      tx.sign(['7eecba084c2ef8a22ef3d2aa4f7ecf2ce0e9d36b717f2f66f35717ae2806e56c'])
      expect(tx.toHex()).to.be.equal(hex)
    })

    it('sign P2SH multisign transaction ', function() {
      let hex = '0100000001c46432c8c4462ec6e815aeced044ab688bad36edca0316e9eda4953691e56d0d00000000fdfd00483045022100fd2739982ea80cd5e36a650d060058ca275d23a44c7a717b54eb2bd85226a7d6022036965368d31ead2a27b5b7af1d7e0c9e4f38b70afc7329356e2a6fbffffc4fcc01483045022100aa9a4025e926a77ae343f4f4630a62194af91e84c764095dbccdf6c0ee9aa68b02203099518205a36256c4d8b18ba9a697857398a73cd2a3b889c77031d74304b49d014c695221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53aeffffffff0100ab9041000000001a76a91566da67bf3462da51f083b5fed4662973a62701a687c5ac0c000000000000000000000000000852000000000000'
      let pk1 = '82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153'
      let pk2 = 'cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9'
      let pk3 = 'd21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17'
      let pub1 = new PrivateKey('82db9bfb080500788191222247cb41bb1338d170c4cdb8af3a4b5e6ba7e53153').publicKey.toString()
      let pub2 = new PrivateKey('cba618e6d7ab68be86a63a76c33b46353df7e3e32cc9811f1064879fc23a21a9').publicKey.toString()
      let pub3 = new PrivateKey('d21d7cd5d7145298ebcfeb9dd970be6ce17e57deff21b93e600a64caebeced17').publicKey.toString()
      let redeemScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)
      let tx = new Transaction({
        inputs: [{
          address: "0x73c84bed5683ff2afab5bb5de968c18ad28a2ea91a",
          amount: 1200000000,
          assets: "000000000000000000000000",
          scriptPubKey: 'a91573c84bed5683ff2afab5bb5de968c18ad28a2ea91ac4',
          txid: "c46432c8c4462ec6e815aeced044ab688bad36edca0316e9eda4953691e56d0d",
          vout: 0,
          redeemScript: redeemScript
        }],
        outputs: [{
          address: '0x66da67bf3462da51f083b5fed4662973a62701a687',
          amount: 1100000000,
          assets: '000000000000000000000000'
        }]
      })

      tx.sign([pk1, pk3])
      expect(tx.toHex()).to.be.equal(hex)
    })

    it('deserialize hex of unsigned 2-3 P2SH multisig transaction', function() {
      let t = Transaction.fromHex('01000000023273fd48a14079e2ad30aea5b281fe89795e96ba11b1d228da04714bb934cdb10000000000ffffffffd878f808201240a88b1b53b4729dc763cd53b17294790a573b650176b5b94a1b0000000000ffffffff03f24fbc00000000001a76a915663e47d4e442717e19f6cd019c9944c2c0ca5dee07c5ac0c000000000000000800000001000e15111d0000000018a91573d2421021f931c5a3464819b5409699de30a0c6b6c40c00000000000000080000000100c09ee6050000000018a91573589699149aaf48b1be5a707df6874ced3f11bb42c40c000000000000000000000000000000000000000000')
      let redeemScript1 = new Script('52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')
      let pkScript1 = Script.buildPayToScriptHashScript(redeemScript1)
      let redeemScript2 = new Script('522102c414cba793b1c353b1f12f37460852987a344294de689a68a77b67acdfbf2a46210372ef16b433e94ed1b868b00e313203492b3568967f12e1881263bc73b5175a712103d4e341c370121f4cb25a6bac3523ae7d1cf6896fc7235af1425c51be7f67ef2853ae')
      let pkScript2 = Script.buildPayToScriptHashScript(redeemScript2)
      t.inputs[0].setScript(pkScript1)
      t.inputs[0].redeemScript = redeemScript1
      t.inputs[1].setScript(pkScript2)
      t.inputs[1].redeemScript = redeemScript2

      let hex = t.toUnsignHex()

      let tx = Transaction.fromHex(hex)

      expect(tx.toHex()).to.be.equal(tx.toHex())
    })

    it('deserialize hex of signed 2-3 P2SH multisig transaction which has 2 signatures', function() {

      let t = Transaction.fromHex('01000000023273fd48a14079e2ad30aea5b281fe89795e96ba11b1d228da04714bb934cdb10000000000ffffffffd878f808201240a88b1b53b4729dc763cd53b17294790a573b650176b5b94a1b0000000000ffffffff03f24fbc00000000001a76a915663e47d4e442717e19f6cd019c9944c2c0ca5dee07c5ac0c000000000000000800000001000e15111d0000000018a91573d2421021f931c5a3464819b5409699de30a0c6b6c40c00000000000000080000000100c09ee6050000000018a91573589699149aaf48b1be5a707df6874ced3f11bb42c40c000000000000000000000000000000000000000000')
      let redeemScript1 = new Script('52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')
      let pkScript1 = Script.buildPayToScriptHashScript(redeemScript1)
      let redeemScript2 = new Script('522102c414cba793b1c353b1f12f37460852987a344294de689a68a77b67acdfbf2a46210372ef16b433e94ed1b868b00e313203492b3568967f12e1881263bc73b5175a712103d4e341c370121f4cb25a6bac3523ae7d1cf6896fc7235af1425c51be7f67ef2853ae')
      let pkScript2 = Script.buildPayToScriptHashScript(redeemScript2)
      t.inputs[0].setScript(pkScript1)
      t.inputs[0].redeemScript = redeemScript1
      t.inputs[1].setScript(pkScript2)
      t.inputs[1].redeemScript = redeemScript2

      t.sign(['20c8917be09870d90bdb92191f5e7f24433feb9bb65f72ebe33be4b997bb7998', '3946ec14cb9e32ba6047b3570cdfc639b1f2d24074296cfeb1e397407314c72e', '5c8423c1ec09346a7345590e2d9e129965071f635143dfa41fc7a1352afdcb29', '6a0a227bdcfc760dc299a9bc0defe9163aaca26c7d1e53dcfa783003221b9f3b'])

      let hex = t.toHex()
      let tx = Transaction.fromHex(hex)

      expect(tx.toHex()).to.be.equal(hex)

    })

    it('sign 2-3 P2SH multisig transaction from  tx hex and redeem hex', function() {
      let signature1 = '3045022100facd2ecaf5e78905a5d6cbabc840572770441ae4158f80b894c6bda439756e2f0220482192ff90efd6647fce45aa34f24b9aadf737ee31ea7b7a5767afa863f29b32'
      let signature2 = '3045022100fca359fec157807916ec6c92510fc0916a49f9de4a867f6b639f0e345ede6c840220428e408500e06c4c5ce9bee4c9d8f9505e3c90a8ad6074d00775b8e71fc071fa'
      let signature3 = '3045022100e1a17fd1f3e933f131b02b374c29e1f48cd6f399826a7445f7ecb2073d2169a50220240cb4c864ec4c6f2033a9ba1f890e25d9d68a37ae5d502347fd65b064c4d5af'
      let signature4 = '304402202c8b2d7cdc306b7ccb3a0287348072151d36f4c371d08188eb7ba41072efac4902204b4dc62d29d3f20a23844c066c87048aac237a130bfa9427f7ae8f1e8e5ee2df'

      let t = Transaction.fromHex('01000000023273fd48a14079e2ad30aea5b281fe89795e96ba11b1d228da04714bb934cdb10000000000ffffffffd878f808201240a88b1b53b4729dc763cd53b17294790a573b650176b5b94a1b0000000000ffffffff03f24fbc00000000001a76a915663e47d4e442717e19f6cd019c9944c2c0ca5dee07c5ac0c000000000000000800000001000e15111d0000000018a91573d2421021f931c5a3464819b5409699de30a0c6b6c40c00000000000000080000000100c09ee6050000000018a91573589699149aaf48b1be5a707df6874ced3f11bb42c40c000000000000000000000000000000000000000000')

      let redeemScript1 = new Script('52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')
      let pkScript1 = Script.buildPayToScriptHashScript(redeemScript1)
      let redeemScript2 = new Script('522102c414cba793b1c353b1f12f37460852987a344294de689a68a77b67acdfbf2a46210372ef16b433e94ed1b868b00e313203492b3568967f12e1881263bc73b5175a712103d4e341c370121f4cb25a6bac3523ae7d1cf6896fc7235af1425c51be7f67ef2853ae')
      let pkScript2 = Script.buildPayToScriptHashScript(redeemScript2)


      t.inputs[0].setScript(pkScript1)
      t.inputs[0].redeemScript = redeemScript1
      t.inputs[1].setScript(pkScript2)
      t.inputs[1].redeemScript = redeemScript2


      t.sign(['20c8917be09870d90bdb92191f5e7f24433feb9bb65f72ebe33be4b997bb7998', '3946ec14cb9e32ba6047b3570cdfc639b1f2d24074296cfeb1e397407314c72e', '5c8423c1ec09346a7345590e2d9e129965071f635143dfa41fc7a1352afdcb29', '6a0a227bdcfc760dc299a9bc0defe9163aaca26c7d1e53dcfa783003221b9f3b'])


      let signatures1 = t.inputs[0].signatures
      let signatures2 = t.inputs[1].signatures

      expect(signatures1[1].toString()).to.be.equal(signature1)
      expect(signatures1[2].toString()).to.be.equal(signature2)

      expect(signatures2[1].toString()).to.be.equal(signature3)
      expect(signatures2[2].toString()).to.be.equal(signature4)
    })

    it('sign 2-3 P2SH multisig transaction from tx hex which  has 1 signature', function() {
      let t = Transaction.fromHex('01000000023273fd48a14079e2ad30aea5b281fe89795e96ba11b1d228da04714bb934cdb10000000000ffffffffd878f808201240a88b1b53b4729dc763cd53b17294790a573b650176b5b94a1b0000000000ffffffff03f24fbc00000000001a76a915663e47d4e442717e19f6cd019c9944c2c0ca5dee07c5ac0c000000000000000800000001000e15111d0000000018a91573d2421021f931c5a3464819b5409699de30a0c6b6c40c00000000000000080000000100c09ee6050000000018a91573589699149aaf48b1be5a707df6874ced3f11bb42c40c000000000000000000000000000000000000000000')

      let redeemScript1 = new Script('52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')
      let pkScript1 = Script.buildPayToScriptHashScript(redeemScript1)
      let redeemScript2 = new Script('522102c414cba793b1c353b1f12f37460852987a344294de689a68a77b67acdfbf2a46210372ef16b433e94ed1b868b00e313203492b3568967f12e1881263bc73b5175a712103d4e341c370121f4cb25a6bac3523ae7d1cf6896fc7235af1425c51be7f67ef2853ae')
      let pkScript2 = Script.buildPayToScriptHashScript(redeemScript2)


      t.inputs[0].setScript(pkScript1)
      t.inputs[0].redeemScript = redeemScript1
      t.inputs[1].setScript(pkScript2)
      t.inputs[1].redeemScript = redeemScript2
      t.sign(['20c8917be09870d90bdb92191f5e7f24433feb9bb65f72ebe33be4b997bb7998', '3946ec14cb9e32ba6047b3570cdfc639b1f2d24074296cfeb1e397407314c72e'])

      let tx = Transaction.fromHex(t.toHex())
      tx.sign(['5c8423c1ec09346a7345590e2d9e129965071f635143dfa41fc7a1352afdcb29', '6a0a227bdcfc760dc299a9bc0defe9163aaca26c7d1e53dcfa783003221b9f3b'])
      t.sign(['5c8423c1ec09346a7345590e2d9e129965071f635143dfa41fc7a1352afdcb29', '6a0a227bdcfc760dc299a9bc0defe9163aaca26c7d1e53dcfa783003221b9f3b'])
      expect(tx.toHex()).to.be.equal(t.toHex())
    })

  })

  describe('#serialize', function() {
    var privateKey = '0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3';
    let tx = new Transaction({
      inputs: [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }],
      outputs: [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }]
    });

    it('roundtrip toBuffer and fromBuffer', function() {

      let tx2 = Transaction.shallowCopy(tx)
      var hex = '01000000015048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693000000006b483045022100a591d0ad121b2e8bb99a582dfe747d9cdde88f997e5359f73c289e352b1583db0220452b7c2f8024c28e93c84c6e607f6ca2719fdd7ae5233600edaa2612e7599d9e0121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1ffffffff0100c2eb0b000000001a76a915669eaf74a91b268dfd4717051ab299a1f23c9c5bdac5ac0c000000000000000000000000000852000000000000';
      expect(tx2.sign([privateKey]).toBuffer().toString('hex')).to.be.equal(hex);

    })
    it('roundtrip toUnsignBuffer and fromBuffer', function() {

      let tx2 = Transaction.fromBuffer(tx.toUnsignBuffer())
      expect(tx2.toHex()).to.deep.equal(tx.toHex())
    })

    it('roundtrip on toUnsignHex and fromHex', function() {
      let hex = tx.toUnsignHex()
      let tx2 = Transaction.fromHex(hex)
      expect(tx2.toHex()).to.deep.equal(tx.toHex())
    })

  })

  it('isCoinbase', function() {

    let tx = new Transaction({
      inputs: [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }],
      outputs: [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }]
    });
    expect(tx.isCoinbase()).to.be.equal(false)

    let tx2 = new Transaction({
      inputs: [{
        txid: '0000000000000000000000000000000000000000000000000000000000000000',
        vout: 4294967295,
        scriptPubKey: ''
      }],
      outputs: [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }]
    })

    expect(tx2.isCoinbase()).to.be.equal(true)

  })

  it('shallow copy', function() {

    let tx = new Transaction({
      inputs: [{
        address: "0x662250F9452AC336DaAEee722615619d2BA1422793",
        amount: 500000000,
        assets: "000000000000000000000000",
        scriptPubKey: "76a915662250f9452ac336daaeee722615619d2ba1422793c5ac",
        txid: "5048c6f29585c25c02c9dcf4174234fe798ed0ffefead3a76b1cc76aaf9f5693",
        vout: 0
      }],
      outputs: [{
        amount: 200000000,
        assets: '000000000000000000000000',
        address: '0x669eaf74a91b268dfd4717051ab299a1f23c9c5bda',
      }]
    })

    let tx2 = Transaction.shallowCopy(tx)

    expect(tx2.toHex()).to.be.equal(tx.toHex())

  })




});
