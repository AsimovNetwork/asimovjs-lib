'use strict';
var expect = require('chai').expect;
var Buffer = require('buffer').Buffer;

var PrivateKey = require('../../lib/transaction/Privatekey').PrivateKey
var PublicKey = require('../../lib/transaction/Publickey').PublicKey
var Hash = require('../../lib/utils/Hash')
var Address = require('../../lib/index').Address
var testnet = require('../../lib/index').testnet
var Script = require('../../lib/index').Script
// var bitcore = require('bitcore-lib')


describe('Address', function() {

  describe('#create', function() {

    it('create address from string', function() {
      let addrStr1 = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let addrStr2 = '0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1';
      let addrStr3 = '0x73589699149aaf48b1be5a707df6874ced3f11bb42';
      let address1 = new Address(addrStr1)
      let address2 = new Address(addrStr2)
      let address3 = new Address(addrStr3)

      expect(address1.toString()).to.be.equal(addrStr1);
      expect(address2.toString()).to.be.equal(addrStr2);
      expect(address3.toString()).to.be.equal(addrStr3);
    })

    it('create address from publickey', function() {
      let pub = '0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a'
      let publicKey = new PublicKey(pub)
      let address = new Address(publicKey)

      expect(address.toString()).to.be.equal('0x66d125a4259bf9122c39b5812f01443737bc7d4b7e')
    })


    it('create address from 20-bytes buffer (script hash buffer)', function() {

      let buf = Hash.sha256ripemd160(new Buffer('0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a', 'hex'))
      let address = new Address(buf)
      expect(address.toString()).to.be.equal('0x73d125a4259bf9122c39b5812f01443737bc7d4b7e')

    })
    it('create address from 21-bytes buffer', function() {

      let buf21 = Hash.sha256ripemd160(new Buffer('0235655e52bcf2db2558e4340c408a8c1f44048256a9678d9f844cc690cab08e3a', 'hex'))
      let prefix = new Buffer('66', 'hex')
      let buf = Buffer.concat([prefix, buf21])
      let address = new Address(buf)

      expect(address.toString()).to.be.equal('0x66d125a4259bf9122c39b5812f01443737bc7d4b7e')

    })
    it('create P2PH address from  string', function() {
      let addrStr = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let address = new Address(addrStr)

      expect(address.toString()).to.be.equal(addrStr);
    })

    it('create P2PH address from  string and same type', function() {
      let addrStr = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let address = new Address(addrStr, Address.PayToPublicKeyHash)
      expect(address.toString()).to.be.equal(addrStr)

    })

    it('create P2PH address from  string and different type', function() {
      let addrStr = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let errStr

      try {
        let address = new Address(addrStr, Address.PayToContractHash)
      } catch (e) {
        errStr = e.toString()
      }
      expect(errStr).to.be.equal('TypeError: Address has mismatched type.')
    })

    it('create P2PH address from buffer', function() {
      let addrStr = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let addrBuffer = new Buffer(addrStr.replace('0x', ''), 'hex')
      let address = new Address(addrBuffer)

      expect(address.toString()).to.be.equal(addrStr);
    })
    it('create P2PH address from public key', function() {
      let privateKey = new PrivateKey('0d7f27f7495c2779f1eee61e12fc1185fb7dd161997a7b64c7907eaa5ff7cdc3');
      let addrStr = '0x662250f9452ac336daaeee722615619d2ba1422793';
      let address = new Address(privateKey.publicKey)

      expect(address.toString()).to.be.equal(addrStr);
    })

    it('create P2SH Multisig address from public keys', function() {
      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'

      expect(new Address([pub1, pub2, pub3], 2, 'testnet').toString()).to.be.equal('0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387');
    })

  })
  describe('#deserialize', function() {

    it('deserialize public key to address', function() {

      let pub = new PublicKey('037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9')

      expect(Address.fromPublicKey(pub).toString()).to.be.equal('0x668eabe5100b044f34f58736a9b031ae10769e303d')

    })

    it('deserialize public key hash to address', function() {

      let pub = new PublicKey('037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9')
      let buf = Hash.sha256ripemd160(pub.toBuffer())

      expect(Address.fromPublicKeyHash(buf).toString()).to.be.equal('0x668eabe5100b044f34f58736a9b031ae10769e303d')

    })
    it('deserialize script hash to address', function() {

      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let buf = Hash.sha256ripemd160(Script.buildMultisigOut([pub1, pub2, pub3], 2).toBuffer())

      expect(Address.fromScriptHash(buf).toString()).to.be.equal('0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387')

    })
    it('deserialize script to address', function() {

      let pub1 = '037a6cefb3c9e1623618cb4ba7550ef02677469edb6edbdc1819b4de540cd8ccd9'
      let pub2 = '0211a7d12a523786744cd4cc6eec2db6cc3dcedda78c39c93157da81e5032c90c1'
      let pub3 = '025bd3fb6e0186ef23e22f7c8a354d6fe5883ca3be7a773fce067a56508172681c'
      let script = Script.buildMultisigOut([pub1, pub2, pub3], 2).toScriptHashOut()

      expect(Address.fromScript(script).toString()).to.be.equal('0x7377e4d38ec8db336fe7e30b433bd6124ccfe80387')

    })
    it('deserialize buffer to address', function() {

      let buf = new Buffer('668eabe5100b044f34f58736a9b031ae10769e303d', 'hex')

      expect(Address.fromBuffer(buf).toString()).to.be.equal('0x668eabe5100b044f34f58736a9b031ae10769e303d')

    })
    it('deserialize string to address', function() {

      expect(Address.fromString('0x668eabe5100b044f34f58736a9b031ae10769e303d').toString()).to.be.equal('0x668eabe5100b044f34f58736a9b031ae10769e303d')

    })
    it('deserialize object to address', function() {
      let obj = {
        hash: '8eabe5100b044f34f58736a9b031ae10769e303d',
        type: Address.PayToPublicKeyHash,
        network: 'testnet'
      }
      expect(Address.fromObject(obj).toString()).to.be.equal('0x668eabe5100b044f34f58736a9b031ae10769e303d')
    })
  })


  describe('#serialize', function() {

    it('address to buffer format', function() {

      let address = new Address('0x662250f9452ac336daaeee722615619d2ba1422793')

      expect('0x' + address.toBuffer().toString('hex')).to.be.equal('0x662250f9452ac336daaeee722615619d2ba1422793')

    })

    it('address to object format', function() {

      let address = new Address('0x662250f9452ac336daaeee722615619d2ba1422793')
      let obj = address.toObject()

      expect(obj.hash).to.be.equal('2250f9452ac336daaeee722615619d2ba1422793')
      expect(obj.type).to.be.equal('pubkeyhash')
      expect(obj.network).to.be.equal('testnet')

    })

    it('address to json format', function() {

      let address = new Address('0x662250f9452ac336daaeee722615619d2ba1422793')
      let json = address.toJSON()

      expect(json.hash).to.be.equal('2250f9452ac336daaeee722615619d2ba1422793')
      expect(json.type).to.be.equal('pubkeyhash')
      expect(json.network).to.be.equal('testnet')

    })

    it('address to string format', function() {

      let address = new Address('0x662250f9452ac336daaeee722615619d2ba1422793')

      expect(address.toString()).to.be.equal('0x662250f9452ac336daaeee722615619d2ba1422793')

    })
    it('address to inspect format', function() {

      let address = new Address('0x662250f9452ac336daaeee722615619d2ba1422793')
      expect(address.inspect()).to.be.equal('<Address: 0x662250f9452ac336daaeee722615619d2ba1422793, type: pubkeyhash, network: testnet>')

    })
  })

  describe('#validation', function() {
    it('validate different type of address', function() {

      expect(Address.IsValidateAddress('0x662250f9452ac336daaeee722615619d2ba1422793')).to.be.equal(true)
      expect(Address.IsValidateAddress('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1')).to.be.equal(true)
      expect(Address.IsValidateAddress('0x73589699149aaf48b1be5a707df6874ced3f11bb42')).to.be.equal(true)

    })

    it('validate address instance', function() {
      let address = new Address('0x66253e82b4f11a056774f6f97b03df4c32d2583e0d')
      expect(address.isValid('0x662250f9452ac336daaeee722615619d2ba1422793')).to.be.equal(true)
      expect(address.isValid('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1')).to.be.equal(true)
      expect(address.isValid('0x73589699149aaf48b1be5a707df6874ced3f11bb42')).to.be.equal(true)
    })

    it('get address type', function() {

      expect(Address.GetAddressType('0x662250f9452ac336daaeee722615619d2ba1422793')).to.be.equal(Address.PayToPublicKeyHash)
      expect(Address.GetAddressType('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1')).to.be.equal(Address.PayToContractHash)
      expect(Address.GetAddressType('0x73589699149aaf48b1be5a707df6874ced3f11bb42')).to.be.equal(Address.PayToScriptHash)
    })

  })

  describe('#classify address', function() {
    //isPayToPublicKeyHash
    it('judge if address is P2PKH address', function() {
      expect(new Address('0x662250f9452ac336daaeee722615619d2ba1422793').isPayToPublicKeyHash()).to.be.equal(true)
      expect(new Address('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1').isPayToPublicKeyHash()).to.be.equal(false)
      expect(new Address('0x73589699149aaf48b1be5a707df6874ced3f11bb42').isPayToPublicKeyHash()).to.be.equal(false)

    })
    //isPayToScriptHash
    it('judge if address is P2SH address', function() {
      expect(new Address('0x662250f9452ac336daaeee722615619d2ba1422793').isPayToScriptHash()).to.be.equal(false)
      expect(new Address('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1').isPayToScriptHash()).to.be.equal(false)
      expect(new Address('0x73589699149aaf48b1be5a707df6874ced3f11bb42').isPayToScriptHash()).to.be.equal(true)
    })
    //isPayToContractHash
    it('judge if address is P2CH address', function() {
      expect(new Address('0x662250f9452ac336daaeee722615619d2ba1422793').isPayToContractHash()).to.be.equal(false)
      expect(new Address('0x63b13e104f6c38ccda1bc66fa94ffd0b6987513be1').isPayToContractHash()).to.be.equal(true)
      expect(new Address('0x73589699149aaf48b1be5a707df6874ced3f11bb42').isPayToContractHash()).to.be.equal(false)
    })

  })

})
