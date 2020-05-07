'use strict';
var expect = require('chai').expect;
var buffer = require('buffer')
var should = require('chai').should()
var Address = require('../../lib/index').Address
var Script = require('../../lib/index').Script
var PublicKey = require('../../lib/index').PublicKey;
var PrivateKey = require('../../lib/index').PrivateKey;
var Signature = require('../../lib/index').Signature;
var Networks = require('../../lib/index').Networks
var Opcode = require('../../lib/index').Opcode
describe('Script', function() {
  /**
   * Serilize
   */
  describe('#serialize', function() {

    it('script to string', function() {
      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let str = 'OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let script = new Script(hex)

      expect(script.toString()).to.be.equal(str)
    })

    it('script to asm', function() {

      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let asm = 'OP_DUP OP_HASH160 6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let script = new Script(hex)

      expect(script.toASM()).to.be.equal(asm)
    })


    it('script to buffer', function() {

      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let script = new Script(hex)

      expect(script.toBuffer().toString('hex')).to.be.equal(hex)

    })


    it('script to hex', function() {

      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let script = new Script(hex)

      expect(script.toHex()).to.be.equal(hex)

    })


    it('script to inspect', function() {

      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let inspect = '<Script: OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG>'
      let script = new Script(hex)

      expect(script.inspect()).to.be.equal(inspect)

    })
  })

  /**
   * Deserilize
   */

  describe('#deserialize', function() {

    it('empty script', function() {
      let script = new Script()
      let script1 = Script.empty()

      expect(script1).to.deep.equal(script)
    })

    it('create script', function() {
      let str = 'OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let buf = new Buffer(hex, 'hex')
      let script = new Script(hex)
      let obj = {
        chunks: script.chunks
      }

      expect(new Script(str).toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')
      expect(new Script(hex).toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')
      expect(new Script(buf).toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')
      expect(new Script(obj).toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')

    })
    it('create script from hex', function() {
      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let script = Script.fromHex(hex)

      expect(script.toASM()).to.be.equal('OP_DUP OP_HASH160 6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')

    })


    it('create script from asm', function() {

      let asm = 'OP_DUP OP_HASH160 6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let script = Script.fromASM(asm)


      expect(script.toHex()).to.be.equal('76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac')

    })


    it('create script from buffer', function() {

      let buf = new Buffer('76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac', 'hex')
      let script = Script.fromBuffer(buf)

      var buf1 = new Buffer([0, 0, 0, 1, 2, 3]);

      buf1[0] = Opcode.map.OP_PUSHDATA2;
      buf1.writeUInt16LE(3, 1);
      var script1 = Script.fromBuffer(buf1);

      var buf2 = new Buffer([0, 0, 0, 0, 0, 1, 2, 3]);
      buf2[0] = Opcode.map.OP_PUSHDATA4;
      buf2.writeUInt16LE(3, 1);
      var script2 = Script.fromBuffer(buf2);

      var buf3 = new Buffer([0, 0, 0, 0]);

      buf3[0] = Opcode.map.OP_PUSHDATA4;
      buf3.writeUInt16LE(3, 1);



      expect(script.toASM()).to.be.equal('OP_DUP OP_HASH160 6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')

      expect(script1.chunks.length).to.equal(1);
      expect(script1.chunks[0].buf.toString('hex')).to.equal('010203');

      expect(script2.chunks.length).to.equal(1);
      expect(script2.chunks[0].buf.toString('hex')).to.equal('010203');

      expect(script1.toBuffer().toString('hex')).to.equal('4d0300010203');
      expect(script2.toBuffer().toString('hex')).to.equal('4e03000000010203');

      (function() {
        Script.fromBuffer(buf3)
      }.should.throw("Invalid script buffer: can't parse valid script from given buffer 4e030000"))


    })

    it('create script from string', function() {

      (function() {
        Script.fromString('asdasd')
      }.should.throw('Invalid script: "asdasd"'));


      (function() {
        Script.fromString('OP_PUSHDATA1 5 1010101010')
      }.should.throw('Pushdata data must start with 0x'));

      let script = Script.fromString('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG');

      let script1 = Script.fromString('76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac');
      expect(script.toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG');

      expect(script1.toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG');

    })


    it('create script from object', function() {

      let hex = '76a9156632032786c61472128d1b3185c92626f8ff0ee4d3c5ac'
      let script = new Script(hex)
      let obj = {
        chunks: script.chunks
      }
      let script2 = Script.fromObject(obj)

      expect(script2.toHex()).to.be.equal(hex)

    })


    it('create script from address', function() {

      let string1 = 'OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let string2 = 'OP_CALL 21 0x6332032786c61472128d1b3185c92626f8ff0ee4d3'
      let string3 = 'OP_HASH160 21 0x7332032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUAL'
      let addr1 = new Address('0x6632032786c61472128d1b3185c92626f8ff0ee4d3')
      let addr2 = new Address('0x6332032786c61472128d1b3185c92626f8ff0ee4d3')
      let addr3 = new Address('0x7332032786c61472128d1b3185c92626f8ff0ee4d3')
      let script1 = new Script(addr1)
      let script2 = new Script(addr2)
      let script3 = new Script(addr3)
      let script4 = Script.fromAddress(addr1)
      let script5 = Script.fromAddress(addr2)
      let script6 = Script.fromAddress(addr3)




      expect(script1.toString()).to.be.equal(string1)
      expect(script2.toString()).to.be.equal(string2)
      expect(script3.toString()).to.be.equal(string3)
      expect(script4.toString()).to.be.equal(string1)
      expect(script5.toString()).to.be.equal(string2)
      expect(script6.toString()).to.be.equal(string3)

    })


    it('create multisign script from string', function() {

      let hex = '52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae'
      let script = new Script(hex)

      expect(script.toHex()).to.be.equal(hex)

    })
  })

  /**
   * Static build script function
   */
  describe('#build script', function() {
    // buildPayToPubKeyScript
    it('build Pay-To-PubKey(P2PK) Script', function() {
      let str = '33 0x0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a OP_CHECKSIG'
      let pub = '0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a'
      let publicKey = new PublicKey(pub)
      let script = Script.buildPayToPubKeyScript(publicKey)
      expect(script.toString()).to.be.equal(str)
    })


    //buildPayToPubKeyHashScript
    it('build Pay-To-PubKey-Hash(P2PKH) Script', function() {
      let str = 'OP_DUP OP_HASH160 21 0x66d125a4259bf9122c39b5812f01443737bc7d4b7e OP_IFLAG_EQUALVERIFY OP_CHECKSIG'
      let pub = '0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a'
      let publicKey = new PublicKey(pub)
      let address = new Address(publicKey)
      let addr = address.toString()
      let script1 = Script.buildPayToPubKeyHashScript(publicKey)

      let script2 = Script.buildPayToPubKeyHashScript(address)

      let script3 = Script.buildPayToPubKeyHashScript(addr)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)
      expect(script3.toString()).to.be.equal(str)

    })


    //buildPayToScriptHashScript
    it('build Pay-To-Script-Hash(P2SH) Script', function() {
      let str = 'OP_HASH160 21 0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387 OP_IFLAG_EQUAL'
      let address = new Address('0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387')
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let redeemScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)
      let script1 = Script.buildPayToScriptHashScript(address)
      let script2 = Script.buildPayToScriptHashScript(redeemScript)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)

    })


    //buildPayToContractHashScript
    it('build Pay-To-Contract-Hash Script', function() {
      let str = 'OP_CALL 21 0x6332032786c61472128d1b3185c92626f8ff0ee4d3'
      let addr = '0x6332032786c61472128d1b3185c92626f8ff0ee4d3'
      let address = new Address(addr)
      let script1 = Script.buildPayToContractHashScript(addr)
      let script2 = Script.buildPayToContractHashScript(address)

      let privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
      let script3 = Script.buildPayToContractHashScript(privateKey.publicKey)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)
      expect(script3.toString()).to.be.equal('OP_CALL 21 0x662250f9452ac336daaeee722615619d2ba1422793')

    })


    //buildCreateTemplateHashScript
    it('build Create-Template-Hash Script', function() {
      let str = 'OP_TEMPLATE'
      let addr = '0x6332032786c61472128d1b3185c92626f8ff0ee4d3'
      let address = new Address(addr)

      let script1 = Script.buildCreateTemplateHashScript(addr)
      let script2 = Script.buildCreateTemplateHashScript(address)

      let privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
      let script3 = Script.buildCreateTemplateHashScript(privateKey.publicKey)


      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)
      expect(script3.toString()).to.be.equal(str)
    })


    //buildCreateContractHashScript
    it('build Create-Contract-Hash Script', function() {
      let str = 'OP_CREATE'
      let addr = '0x662250f9452ac336daaeee722615619d2ba1422793'
      let address = new Address(addr)


      let script1 = Script.buildCreateContractHashScript(addr)
      let script2 = Script.buildCreateContractHashScript(address)

      let privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
      let script3 = Script.buildCreateContractHashScript(privateKey.publicKey)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)
      expect(script3.toString()).to.be.equal(str)

    })


    //buildVoteHashScript
    it('build Vote-Hash Script', function() {
      let str = 'OP_VOTE 21 0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1'
      let addr = '0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1'
      let address = new Address(addr)

      let script1 = Script.buildVoteHashScript(addr)
      let script2 = Script.buildVoteHashScript(address)

      let privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
      let script3 = Script.buildVoteHashScript(privateKey.publicKey)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)
      expect(script3.toString()).to.be.equal('OP_VOTE 21 0x662250f9452ac336daaeee722615619d2ba1422793')

    })


    //buildDataScript
    it('build Data Script', function() {

      let script1 = Script.buildDataScript()
      let script2 = Script.buildDataScript(new Buffer(''))
      let script3 = Script.buildDataScript(new Buffer('bacacafe0102030405', 'hex'))
      let script4 = Script.buildDataScript('hello world!!!')
      let script5 = Script.buildDataScript('abcdef0123456789', 'hex');

      expect(script1.toString()).to.be.equal('OP_RETURN')
      expect(script2.toString()).to.be.equal('OP_RETURN')
      expect(script3.toString()).to.be.equal('OP_RETURN 9 0xbacacafe0102030405')
      expect(script4.toString()).to.be.equal('OP_RETURN 14 0x68656c6c6f20776f726c64212121')
      expect(script5.toString()).to.be.equal('OP_RETURN 8 0xabcdef0123456789')
    })


    //buildMultisigOut
    it('build Multisig Out', function() {
      let equal = 'OP_2 33 0x037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9 33 0x0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1 33 0x025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c OP_3 OP_CHECKMULTISIG'
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'

      let script = Script.buildMultisigOut([pub1, pub2, pub3], 2)

      expect(script.toString()).to.be.equal(equal)

    })


    //buildPublicKeyIn
    it('build PublicKey In', function() {

      let str = '71 0x304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af01'

      let sig = '304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af'
      let buf = new Buffer(sig, 'hex')
      let signature = Signature.fromString(sig)
      let script1 = Script.buildPublicKeyIn(signature)
      let script2 = Script.buildPublicKeyIn(buf)

      expect(script1.toString()).to.be.equal(str)
      expect(script2.toString()).to.be.equal(str)

    })


    //buildPublicKeyHashIn
    it('build PublicKey-Hash In', function() {
      let equal = '72 0x3045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d01 33 0x0317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dca'
      let sig = '3045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d'
      let pub = '0317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dca'
      let signature = Signature.fromString(sig)
      let publicKey = new PublicKey(pub)
      let script = Script.buildPublicKeyHashIn(publicKey, signature)

      expect(script.toString()).to.be.equal(equal)

    })


    //buildMultisigIn
    //NOTE:sig1 and sig2 is come from function of Signature named toTxFormat which return raw hex contains signtype
    //and toString() return the signature hex without signtype
    it('build Multisig In', function() {

      let equal = '72 0x3045022100e86d171d456fa91a15dbae540fb2ff62f1aebc330911bd3f763afc42ecba1778022046acc757d9ea4fd56c01ec3fdd02f6b04a9d96ba0eb2aa2b3d68646e6cdf869a01 71 0x304402202bae39fd8017889412ab85e8c6340ffe99c572175cc3aa51381dfae479dda5bb02203f730f90797419848c6d80f0c244f3418b33fe3545dce46968c7bbc40f3eb86801'
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let sig1 = '3045022100e86d171d456fa91a15dbae540fb2ff62f1aebc330911bd3f763afc42ecba1778022046acc757d9ea4fd56c01ec3fdd02f6b04a9d96ba0eb2aa2b3d68646e6cdf869a01'
      let sig2 = '304402202bae39fd8017889412ab85e8c6340ffe99c572175cc3aa51381dfae479dda5bb02203f730f90797419848c6d80f0c244f3418b33fe3545dce46968c7bbc40f3eb86801'

      let signatures = [new Buffer(sig1, 'hex'), new Buffer(sig2, 'hex')]

      let script = Script.buildMultisigIn([pub1, pub2, pub3], 2, signatures)
      expect(script.toString()).to.be.equal(equal)

    })


    //buildP2SHMultisigIn
    it('build P2SH-Multisig In', function() {
      let equal = '72 0x3045022100fd2739982ea80cd5e36a650d060058ca275d23a44c7a717b54eb2bd85226a7d6022036965368d31ead2a27b5b7af1d7e0c9e4f38b70afc7329356e2a6fbffffc4fcc01 72 0x3045022100aa9a4025e926a77ae343f4f4630a62194af91e84c764095dbccdf6c0ee9aa68b02203099518205a36256c4d8b18ba9a697857398a73cd2a3b889c77031d74304b49d01 OP_PUSHDATA1 105 0x5221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53ae'
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let sig1 = '3045022100fd2739982ea80cd5e36a650d060058ca275d23a44c7a717b54eb2bd85226a7d6022036965368d31ead2a27b5b7af1d7e0c9e4f38b70afc7329356e2a6fbffffc4fcc01'
      let sig2 = '3045022100aa9a4025e926a77ae343f4f4630a62194af91e84c764095dbccdf6c0ee9aa68b02203099518205a36256c4d8b18ba9a697857398a73cd2a3b889c77031d74304b49d01'
      let signatures = [new Buffer(sig1, 'hex'), new Buffer(sig2, 'hex')]
      let redeemScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)

      let script1 = Script.buildP2SHMultisigIn([pub1, pub2, pub3], 2, signatures)
      let script2 = Script.buildP2SHMultisigIn([], 0, signatures, {
        cachedMultisig: redeemScript
      })

      expect(script1.toString()).to.be.equal(equal)
      expect(script2.toString()).to.be.equal(equal)

    })


    //payToAddressScript
    it('test pay To Address Script', function() {

      let script1 = Script.payToAddressScript(new Address('0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387'))
      let script2 = Script.payToAddressScript(new Address('0x6632032786c61472128d1b3185c92626f8ff0ee4d3'))

      expect(script1.toString()).to.be.equal('OP_HASH160 21 0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387 OP_IFLAG_EQUAL')
      expect(script2.toString()).to.be.equal('OP_DUP OP_HASH160 21 0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG')

    })
  })

  describe('#extract', function() {
    // getMultisigThreshold
    it('get multisig threshold from multisig output script', function() {
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let redeemScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)

      expect(redeemScript.getMultisigThreshold()).to.be.equal(2)

    })


    //getMultisigPublicKeys
    it('extract publickeys from multisig output script', function() {

      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let redeemScript = Script.buildMultisigOut([pub1, pub2, pub3], 2)
      let publickeys = redeemScript.getMultisigPublicKeys()

      expect(publickeys[0].toString('hex')).to.be.equal('037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9')
      expect(publickeys[1].toString('hex')).to.be.equal('0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1')
      expect(publickeys[2].toString('hex')).to.be.equal('025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c')

    })

    //getRedeemScript
    it('get redeem script from script hash in', function() {
      let str = '483045022100facd2ecaf5e78905a5d6cbabc840572770441ae4158f80b894c6bda439756e2f0220482192ff90efd6647fce45aa34f24b9aadf737ee31ea7b7a5767afa863f29b3201483045022100fca359fec157807916ec6c92510fc0916a49f9de4a867f6b639f0e345ede6c840220428e408500e06c4c5ce9bee4c9d8f9505e3c90a8ad6074d00775b8e71fc071fa014c6952210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae'
      let script = new Script(str)
      let redeemScript = script.getRedeemScript()

      expect(redeemScript.toHex()).to.be.equal('52210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae')

    })

    // getSignature
    it('get signature from P2PKH sig script', function() {
      let str = '483045022100e621a74d35686699114882dd6556d5fcaa714df85db0981944f4fe3911af9f5e02207d986ba1493b3ace7c607442e8b75c2d86f598af74ebb54865f3b7f1888901f50121028ff24dc9bf0a9020a191f734815ace4bcce694c280b5d380883138577737ebb1'
      let sigStr = '3045022100e621a74d35686699114882dd6556d5fcaa714df85db0981944f4fe3911af9f5e02207d986ba1493b3ace7c607442e8b75c2d86f598af74ebb54865f3b7f1888901f5'
      let script = new Script(str)
      let signature = script.getSignature()

      expect(signature.toString()).to.be.equal(sigStr)

    })


    //getSignatures
    it('get signatures from P2SH Multisig script', function() {
      let sigScriptStr = '47304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af0148304502210086ec93aaf67c3d2c721047572b61b7ae007b7e4822d056824a447766c31c970a0220793f2210bff42fffe53293a96eee4d817a2ce4770b70052bcab0e3681c947d07014c6952210235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a210301063747c18f5a33afd44eca1bc2605a49b2fa5b3cd9aa2b9192751ef079520b21039b1a47eeca1ab23cca77b965b406638b6091a12015b186e2311674ecbe5eb44b53ae'
      let script = new Script(sigScriptStr)
      let signatures = script.getSignatures()

      expect(signatures[0].toString()).to.be.equal('304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af')
      expect(signatures[1].toString()).to.be.equal('304502210086ec93aaf67c3d2c721047572b61b7ae007b7e4822d056824a447766c31c970a0220793f2210bff42fffe53293a96eee4d817a2ce4770b70052bcab0e3681c947d07')

    })
  })

  describe('#script classify', function() {


    //isPublicKeyOut
    it('judge if script is P2PK out script', function() {

      let script = Script.fromASM('0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a OP_CHECKSIG')

      expect(script.isPublicKeyOut()).to.be.equal(true)

    })
    //isPublicKeyIn
    it('judge if script is P2PK in script', function() {

      let script = Script.fromASM('304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af01')

      expect(script.isPublicKeyIn()).to.be.equal(true)

    })
    //isScriptHashOut
    it('judge if script is P2SH out script', function() {

      let script = Script.fromASM('OP_HASH160 7377e4d38ec8db336fe7e30b433bd6124ccfe80387 OP_IFLAG_EQUAL')

      expect(script.isScriptHashOut()).to.be.equal(true)

    })

    //isScriptHashIn
    it('judge if script is P2SH in script', function() {
      let script = Script.fromASM('304402206a820bdbb1cbf017e89112f8f4f3ba50989e43339f7d1b9277b82a1ea162786b02205784892cbac988b20877e216ed73c827de6a4f02bf6e6eecc2c9d9ba6d1834af 304502210086ec93aaf67c3d2c721047572b61b7ae007b7e4822d056824a447766c31c970a0220793f2210bff42fffe53293a96eee4d817a2ce4770b70052bcab0e3681c947d07 5221037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9210211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c121025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c53ae')
      expect(script.isScriptHashIn()).to.be.equal(true)
    })
    //isPublicKeyHashOut
    it('judge if script is P2PKH out script', function() {

      let script = Script.fromASM('OP_DUP OP_HASH160 66d125a4259bf9122c39b5812f01443737bc7d4b7e OP_IFLAG_EQUALVERIFY OP_CHECKSIG')

      expect(script.isPublicKeyHashOut()).to.be.equal(true)

    })
    //isPublicKeyHashIn
    it('judge if script is P2PKH in script', function() {

      let script = Script.fromASM('3045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d01 0317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dca')

      expect(script.isPublicKeyHashIn()).to.be.equal(true)

    })
    //isMultisigOut
    it('judge if script is Multisig out script', function() {

      let script = Script.fromASM('OP_2 037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9 0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1 025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c OP_3 OP_CHECKMULTISIG')
      expect(script.isMultisigOut()).to.be.equal(true)

    })
    //isMultisigIn
    it('judge if script is Multisig in script', function() {

      let script = Script.fromASM('3045022100e86d171d456fa91a15dbae540fb2ff62f1aebc330911bd3f763afc42ecba1778022046acc757d9ea4fd56c01ec3fdd02f6b04a9d96ba0eb2aa2b3d68646e6cdf869a01 304402202bae39fd8017889412ab85e8c6340ffe99c572175cc3aa51381dfae479dda5bb02203f730f90797419848c6d80f0c244f3418b33fe3545dce46968c7bbc40f3eb86801')
      expect(script.isMultisigIn()).to.be.equal(true)

    })
    //isDataOut
    it('judge if script is Data out script', function() {
      let buf40 = new Buffer(40)
      let buf80 = new Buffer(80)
      let buf81 = new Buffer(81)
      buf40.fill(0)
      buf80.fill(0)
      buf81.fill(0)
      let script1 = 'OP_RETURN'
      let script2 = 'OP_RETURN OP_PUSHDATA1 40 0x' + buf40.toString('hex')
      let script3 = 'OP_RETURN OP_PUSHDATA1 80 0x' + buf80.toString('hex')
      //let script4 = 'OP_RETURN OP_PUSHDATA1 81 0x' + buf81.toString('hex')

      expect(Script.fromASM(script1).isDataOut()).to.be.equal(true)
      expect(Script.fromASM(script2).isDataOut()).to.be.equal(true)
      expect(Script.fromASM(script3).isDataOut()).to.be.equal(true)
      //expect(new Script().fromASM(script4).isDataOut()).to.be.equal(false)

    })
    //isCreateOut
    it('judge if script is Create out script', function() {
      let script = Script.buildCreateContractHashScript('0x6632032786c61472128d1b3185c92626f8ff0ee4d3')

      expect(script.isCreateOut()).to.be.equal(true)
    })
    //isTemplateOut
    it('judge if script is Template out script', function() {
      let script = Script.buildCreateTemplateHashScript('0x6332032786c61472128d1b3185c92626f8ff0ee4d3')

      expect(script.isTemplateOut()).to.be.equal(true)
    })
    //isVoteOut
    it('judge if script is Vote out script', function() {
      let script = Script.buildVoteHashScript('0x6332032786c61472128d1b3185c92626f8ff0ee4d3')
      expect(script.isVoteOut()).to.be.equal(true)
    })
    //isCallOut
    it('judge if script is Call out script', function() {
      let script = Script.buildPayToContractHashScript('0x6332032786c61472128d1b3185c92626f8ff0ee4d3')
      expect(script.isCallOut()).to.be.equal(true)
    })
    //isPushOnly
    it('judge if script is Push only script', function() {
      expect(Script.fromASM('OP_NOP 1 0x01').isPushOnly()).to.be.equal(false);
      expect(Script.fromASM('OP_0').isPushOnly()).to.be.equal(true);
      expect(Script.fromASM('OP_0 OP_RETURN').isPushOnly()).to.be.equal(false);
      expect(Script.fromASM('OP_PUSHDATA1 5 0x1010101010').isPushOnly()).to.be.equal(true);
      // like bitcoind, we regard OP_RESERVED as being "push only"
      expect(Script.fromASM('OP_RESERVED').isPushOnly()).to.be.equal(true);
    })
    //isStandard
    it('judge if script is standard', function() {
      expect(Script.fromString('OP_RETURN 1 0x00').isStandard()).to.be.equal(true);
    })
  })

  // checkMinimalPush
  describe('#checkMinimalPush', function() {

    it('should check these minimal pushes', function() {
      new Script().add(1).checkMinimalPush(0).should.equal(true);
      new Script().add(0).checkMinimalPush(0).should.equal(true);
      new Script().add(-1).checkMinimalPush(0).should.equal(true);
      new Script().add(1000).checkMinimalPush(0).should.equal(true);
      new Script().add(0xffffffff).checkMinimalPush(0).should.equal(true);
      new Script().add(0xffffffffffffffff).checkMinimalPush(0).should.equal(true);
      new Script().add(new Buffer([0])).checkMinimalPush(0).should.equal(true);

      var buf = new Buffer(75);
      buf.fill(1);
      new Script().add(buf).checkMinimalPush(0).should.equal(true);

      buf = new Buffer(76);
      buf.fill(1);
      new Script().add(buf).checkMinimalPush(0).should.equal(true);

      buf = new Buffer(256);
      buf.fill(1);
      new Script().add(buf).checkMinimalPush(0).should.equal(true);
    });
  });

  //getData
  describe('getData returns associated data', function() {

    it('works with this testnet transaction', function() {

      var script = Script.fromBuffer(new Buffer('6a', 'hex'));
      var dataout = script.isDataOut();
      dataout.should.equal(true);
      var data = script.getData();
      data.should.deep.equal(new Buffer(0));

    });

    it('for a P2PKH address', function() {

      var address = Address.fromString('0x6632032786c61472128d1b3185c92626f8ff0ee4d3');
      var script = Script.buildPayToPubKeyHashScript(address);

      expect('0x' + script.getData().toString('hex')).to.be.equal(address.toString())

    });
    it('for a P2SH address', function() {

      var address = Address.fromString('0x7332032786c61472128d1b3185c92626f8ff0ee4d3');
      var script = new Script(address);

      expect('0x' + script.getData().toString('hex')).to.be.equal(address.toString('hex'))

    });

    it('for a standard opreturn output', function() {

      expect(new Script('OP_RETURN 1 0xFF').getData().toString('hex')).to.be.equal(new Buffer([255]).toString('hex'))

    });
    it('fails if content is not recognized', function() {
      (function() {
        return new Script('1 0xFF').getData();
      }.should.throw())
    });
  });

  //  getSignatureOperationsCount
  describe('#getSignatureOperationsCount', function() {
    // comes from bitcoind src/test/sigopcount_tests
    // only test calls to function with boolean param, not signature ref param
    var pubKeyHexes = [
      '022df8750480ad5b26950b25c7ba79d3e37d75f640f8e5d9bcd5b150a0f85014da',
      '03e3818b65bcc73a7d64064106a859cc1a5a728c4345ff0b641209fba0d90de6e9',
      '021f2f6e1e50cb6a953935c3601284925decd3fd21bc445712576873fb8c6ebc18',
    ];
    it('should return zero for empty scripts', function() {

      new Script().getSignatureOperationsCount(false).should.equal(0);
      new Script().getSignatureOperationsCount(true).should.equal(0);

    });

    it('should handle multi-sig multisig scripts from string', function() {

      var s1 = 'OP_1 01 FF OP_2 OP_CHECKMULTISIG';
      new Script(s1).getSignatureOperationsCount(true).should.equal(2);
      s1 += ' OP_IF OP_CHECKSIG OP_ENDIF';
      new Script(s1).getSignatureOperationsCount(true).should.equal(3);
      new Script(s1).getSignatureOperationsCount(false).should.equal(21);

    });

    it('should handle multi-sig-out scripts from utility function', function() {
      var sortKeys = pubKeyHexes.slice(0, 3).map(function (pubkey){
        return new PublicKey(pubkey)
      });
      var s2 = Script.buildMultisigOut(sortKeys, 1);
      new Script(s2).getSignatureOperationsCount(true).should.equal(3);
      new Script(s2).getSignatureOperationsCount(false).should.equal(20);

    });
    it('should handle P2SH-multisig-in scripts from utility', function() {
      // create a well-formed signature, does not need to match pubkeys
      var signature = Signature.fromString('30060201FF0201FF');
      var signatures = [signature.toBuffer()];
      var p2sh = Script.buildP2SHMultisigIn(pubKeyHexes, 1, signatures);
      p2sh.getSignatureOperationsCount(true).should.equal(0);
      p2sh.getSignatureOperationsCount(false).should.equal(0);
    });
    it('should default the one and only argument to true', function() {
      var s1 = 'OP_1 01 FF OP_2 OP_CHECKMULTISIG';
      var trueCount = new Script(s1).getSignatureOperationsCount(true);
      var falseCount = new Script(s1).getSignatureOperationsCount(false);
      var defaultCount = new Script(s1).getSignatureOperationsCount();
      trueCount.should.not.equal(falseCount);
      trueCount.should.equal(defaultCount);
    });
  });

  //findAndDelete
  describe('#findAndDelete', function() {

    it('should find and delete this buffer', function() {

      new Script('OP_RETURN 2 0xf0f0')
        .findAndDelete(new Script('2 0xf0f0'))
        .toString()
        .should.equal('OP_RETURN');

    });

    it('should do nothing', function() {

      new Script('OP_RETURN 2 0xf0f0')
        .findAndDelete(new Script('2 0xffff'))
        .toString()
        .should.equal('OP_RETURN 2 0xf0f0');
    });

  });

  //removeCodeseparators
  describe('#removeCodeseparators', function() {

    it('should remove any OP_CODESEPARATORs', function() {
      new Script('OP_CODESEPARATOR OP_0 OP_CODESEPARATOR').removeCodeseparators().toString().should.equal('OP_0');
    });

  });
  //toAddress
  describe('toAddress', function() {

    var pubkey = new PublicKey('027ffeb8c7795d529ee9cd96512d472cefe398a0597623438ac5d066a64af50072');
    var address = new Address(pubkey, Address.PayToPublicKeyHash, 'testnet')

    it('priorize the network argument', function() {
      var script = new Script(address);
      script.toAddress(Networks.testnet).toString().should.equal(address.toString());
      script.toAddress(Networks.testnet).network.should.equal(Networks.testnet);
    });

    it('use the inherited network', function() {
      var script = new Script(address);
      script.toAddress().toString().should.equal(address.toString());
    });
    it('uses default network', function() {
      var script = new Script('OP_DUP OP_HASH160 20 ' +
        '0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG');
      script.toAddress().network.should.equal(Networks.defaultNetwork);
    });
    it('for a P2PKH address', function() {
      var stringAddress = '0x6632032786c61472128d1b3185c92626f8ff0ee4d3';
      var address = new Address(stringAddress);
      var script = new Script(address);
      script.toAddress().toString().should.equal(stringAddress);
    });
    it('for a P2SH address', function() {
      var stringAddress = '0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387';
      var address = new Address(stringAddress);
      var script = new Script(address);
      script.toAddress().toString().should.equal(stringAddress);
    });

    it('fails if content is not recognized', function() {
      expect(new Script().toAddress(Networks.livenet)).to.be.equal(false)
    });

    it('works for p2pkh output', function() {

      var script = new Script('OP_DUP OP_HASH160 20 ' +
        '0x6632032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUALVERIFY OP_CHECKSIG');

      script.toAddress().toString().should.equal('0x6632032786c61472128d1b3185c92626f8ff0ee4d3');

    });

    it('works for p2pkh input', function() {

      var script = new Script('72 0x3045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d01 33 0x0317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dca')
      script.toAddress().toString().should.equal('0x6632032786c61472128d1b3185c92626f8ff0ee4d3');

    });

    it('works for p2sh output', function() {

      var script = new Script('OP_HASH160 21 0x7332032786c61472128d1b3185c92626f8ff0ee4d3 OP_IFLAG_EQUAL');
      script.toAddress().toString().should.equal('0x7332032786c61472128d1b3185c92626f8ff0ee4d3');
    });

    it('works for p2sh input', function() {

      var script = new Script('72 0x3045022100a16dac415ebd4a53224623e81b927a2a2255a9875121f6dd8e391ee6a3d2064b022067cce82b2956df0963d9188bacaab49cdd54b973684d473a8bee577863f22e2d01 33 0x0317788622b0ff5971fae5ba150c216a4d63b784cfd06aed40a2669db88d628dca');

      script.toAddress().toString().should.equal('0x6632032786c61472128d1b3185c92626f8ff0ee4d3');
    });

    //// no address scripts
    it('works for OP_RETURN script', function() {
      var script = new Script('OP_RETURN 20 0x99d29051af0c29adcb9040034752bba7dde33e35');

      script.toAddress().should.equal(false);
    });

  });

  describe('#add and #prepend', function() {

    it('should add these ops', function() {
      new Script().add(1).add(10).add(186).toString().should.equal('0x01 0x0a 0xba');
      new Script().add(1000).toString().should.equal('0x03e8');
      new Script().add('OP_CHECKMULTISIG').toString().should.equal('OP_CHECKMULTISIG');
      new Script().add('OP_1').add('OP_2').toString().should.equal('OP_1 OP_2');
      new Script().add(Opcode.map.OP_CHECKMULTISIG).toString().should.equal('OP_CHECKMULTISIG');
      new Script().add(Opcode.map.OP_CHECKMULTISIG).toString().should.equal('OP_CHECKMULTISIG');
    });

    it('should prepend these ops', function() {
      new Script().prepend('OP_CHECKMULTISIG').toString().should.equal('OP_CHECKMULTISIG');
      new Script().prepend('OP_1').prepend('OP_2').toString().should.equal('OP_2 OP_1');
    });

    it('should add and prepend correctly', function() {
      new Script().add('OP_1').prepend('OP_2').add('OP_3').prepend('OP_4').toString()
        .should.equal('OP_4 OP_2 OP_1 OP_3');
    });

    it('should add these push data', function() {
      var buf = new Buffer(1);
      buf.fill(0);
      new Script().add(buf).toString().should.equal('1 0x00');
      buf = new Buffer(255);
      buf.fill(0);
      new Script().add(buf).toString().should.equal('OP_PUSHDATA1 255 0x' + buf.toString('hex'));
      buf = new Buffer(256);
      buf.fill(0);
      new Script().add(buf).toString().should.equal('OP_PUSHDATA2 256 0x' + buf.toString('hex'));
      buf = new Buffer(Math.pow(2, 16));
      buf.fill(0);
      new Script().add(buf).toString().should.equal('OP_PUSHDATA4 ' + Math.pow(2, 16) + ' 0x' + buf.toString('hex'));
    });

    it('should add both pushdata and non-pushdata chunks', function() {
      new Script().add('OP_CHECKMULTISIG').toString().should.equal('OP_CHECKMULTISIG');
      new Script().add(Opcode.map.OP_CHECKMULTISIG).toString().should.equal('OP_CHECKMULTISIG');
      var buf = new Buffer(1);
      buf.fill(0);
      new Script().add(buf).toString().should.equal('1 0x00');
    });

    it('should work for no data OP_RETURN', function() {
      new Script().add(Opcode.map.OP_RETURN).add(new Buffer('')).toString().should.equal('OP_RETURN');
    });
    it('works with objects', function() {
      new Script().add({
        opcodenum: 106
      }).toString().should.equal('OP_RETURN');
    });
    it('works with another script', function() {
      var someScript = new Script('OP_2 21 0x038282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508 ' +
        '21 0x038282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508 OP_2 OP_CHECKMULTISIG');
      var s = new Script().add(someScript);
      s.toString()
        .should.equal(someScript.toString());
    });
    it('fails with wrong type', function() {
      var fails = function() {
        return new Script().add(true);
      };
      fails.should.throw('Invalid script chunk');
    });
  });

  describe('#equals', function() {
    it('returns true for same script', function() {
      new Script('OP_TRUE').equals(new Script('OP_TRUE')).should.equal(true);
    });
    it('returns false for different chunks sizes', function() {
      new Script('OP_TRUE').equals(new Script('OP_TRUE OP_TRUE')).should.equal(false);
    });
    it('returns false for different opcodes', function() {
      new Script('OP_TRUE OP_TRUE').equals(new Script('OP_TRUE OP_FALSE')).should.equal(false);
    });
    it('returns false for different data', function() {
      new Script().add(new Buffer('a')).equals(new Script('OP_TRUE')).should.equal(false);
    });
    it('returns false for different data', function() {
      new Script().add(new Buffer('a')).equals(new Script().add(new Buffer('b'))).should.equal(false);
    });
  });

  describe('#classifyInput', function() {
    it('shouldn\'t classify public key hash out', function() {
      new Script('OP_DUP OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_IFLAG_EQUALVERIFY OP_CHECKSIG').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('should classify public key hash in', function() {
      new Script('47 0x3044022077a8d81e656c4a1c1721e68ce35fa0b27f13c342998e75854858c12396a15ffa02206378a8c6959283c008c87a14a9c0ada5cf3934ac5ee29f1fef9cac6969783e9801 21 0x03993c230da7dabb956292851ae755f971c50532efc095a16bee07f83ab9d262df').classifyInput().should.equal(Script.types.PUBKEYHASH_IN);
    });
    it('shouldn\'t classify script hash out', function() {
      new Script('OP_HASH160 20 0x0000000000000000000000000000000000000000 OP_IFLAG_EQUAL').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('should classify script hash in', function() {
      new Script('OP_0 73 0x30460221008ca148504190c10eea7f5f9c283c719a37be58c3ad617928011a1bb9570901d2022100ced371a23e86af6f55ff4ce705c57d2721a09c4d192ca39d82c4239825f75a9801 72 0x30450220357011fd3b3ad2b8f2f2d01e05dc6108b51d2a245b4ef40c112d6004596f0475022100a8208c93a39e0c366b983f9a80bfaf89237fcd64ca543568badd2d18ee2e1d7501 OP_PUSHDATA1 105 0x5221024c02dff2f0b8263a562a69ec875b2c95ffad860f428acf2f9e8c6492bd067d362103546324a1351a6b601c623b463e33b6103ca444707d5b278ece1692f1aa7724a42103b1ad3b328429450069cc3f9fa80d537ee66ba1120e93f3f185a5bf686fb51e0a53ae').classifyInput().should.equal(Script.types.SCRIPTHASH_IN);
    });
    it('shouldn\'t classify MULTISIG out', function() {
      new Script('OP_2 21 0x038282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508 21 0x038282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508 OP_2 OP_CHECKMULTISIG').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('should classify MULTISIG in', function() {
      new Script('0x47 0x3044022002a27769ee33db258bdf7a3792e7da4143ec4001b551f73e6a190b8d1bde449d02206742c56ccd94a7a2e16ca52fc1ae4a0aa122b0014a867a80de104f9cb18e472c01 0x47 0x3044022002a27769ee33db258bdf7a3792e7da4143ec4001b551f73e6a190b8d1bde449d02206742c56ccd94a7a2e16ca52fc1ae4a0aa122b0014a867a80de104f9cb18e472c01').classifyInput().should.equal(Script.types.MULTISIG_IN);
    });
    it('shouldn\'t classify OP_RETURN data out', function() {
      new Script('OP_RETURN 1 0x01').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('shouldn\'t classify public key out', function() {
      new Script('41 0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8 OP_CHECKSIG').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('should classify public key in', function() {
      new Script('47 0x3044022007415aa37ce7eaa6146001ac8bdefca0ddcba0e37c5dc08c4ac99392124ebac802207d382307fd53f65778b07b9c63b6e196edeadf0be719130c5db21ff1e700d67501').classifyInput().should.equal(Script.types.PUBKEY_IN);
    });
    it('should classify unknown', function() {
      new Script('OP_TRUE OP_FALSE').classifyInput().should.equal(Script.types.UNKNOWN);
    });
    it('should classify scriptHashIn, eventhough it\'s opreturn', function() {
      new Script('6a1c3630fd3792f7e847ae5e27985dfb127542ef37ac2a5147c3b9cec7ba').classifyInput().should.equal(Script.types.SCRIPTHASH_IN);
    });
  });


});
