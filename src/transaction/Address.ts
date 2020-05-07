import * as _ from "lodash"
import * as $ from '../utils/Preconditions'
import * as Networks from "./Networks";
import * as JSUtil from '../utils/Js'
import * as Hash from "../utils/Hash"

import { Buffer } from "buffer";
import { Script } from "./Script"
import { GENESIS_CONTRACT } from "../Constant";
import { PublicKey } from "./Publickey"

export interface AddressBase {
  /**
   * Address buffer which sha256 and ripemd160 of public key
   * @type {[type]}
   */
  hashBuffer ? : any
  /**
   * Network of environment .Default livenet
   * @type {[type]}
   */
  network ? : Networks.Network | string
  /**
   * Type of address. 'pubkeyhash', 'scripthash', 'contracthash'
   * @type {[type]}
   */
  type ? : string
}

/**
 * Instantiate an address from an address String or Buffer, a public key or script hash Buffer,
 * or an instance of PublicKey from bitcore-lib or {@link Script}.
 *
 *   This is an immutable class, and if the first parameter provided to this constructor is an
 * `Address` instance, the same argument will be returned.
 *
 *   An address has two key properties: `network` and `type`. The type can be
 * `Address.PayToPublicKeyHash` (value is the `'pubkeyhash'` string)
 * or `Address.PayToScriptHash` (the string `'scripthash'`)
 * or `Address.PayToContractHash` (the string `'contracthash'`)
 *
 *   The network is an instance of {@link Network}.
 * You can quickly check whether an address is of a given kind by using the methods
 * `isAddress.PayToPublicKeyHash` and `isAddress.PayToScriptHash` and `isAddress.PayToContractHash`
 *
 * @example
 * ```javascript
 * // validate that an input field is valid
 * var error = this.getValidationError(input, 'testnet');
 * if (!error) {
 *   var address = Address(input, 'testnet');
 * } else {
 *   // invalid network or checksum (typo?)
 *   var message = error.messsage;
 * }
 *
 * // get an address from a public key
 * var address = Address(publicKey, 'testnet').toString();
 */
export class Address implements AddressBase {

  static PayToPublicKeyHash: string = "pubkeyhash"
  static PayToScriptHash: string = "scripthash"
  static PayToContractHash: string = "contracthash"

  public hashBuffer: any

  constructor(public data, public type ? : string, public network: Networks.Network | string = 'testnet') {

    if (_.isArray(data) && _.isNumber(type)) {
      return Address.createMultisig(data, type, network);
    }

    if (data instanceof Address) {
      // Immutable instance
      return data;
    }

    // $.checkArgument(data, 'First argument is required, please include address data.', 'guide/address.html');

    if (typeof(network) === 'string' && network !== "livenet" && network !== "testnet") {
      throw new TypeError(' Network argument must be "livenet" or "testnet".');
    }

    if (type && (type !== Address.PayToPublicKeyHash && type !== Address.PayToScriptHash && type !== Address.PayToContractHash)) {
      throw new TypeError('Type argument must be "pubkeyhash" or "scripthash" or "contracthash".');
    }
    if (data) {
      var info = this._classifyArguments(data, network, type);

      this.hashBuffer = info.hashBuffer;
      this.network = info.network;
      this.type = info.type;
    }

    return this;
  }



  /**
   * Internal function to discover the network and type based on the first data byte
   *
   * @param {Buffer} buffer - An instance of a hex encoded address Buffer
   * @returns {Object} An object with keys: network and type
   * @private
   */
  static _classifyFromVersion(buffer) {

    var version: AddressBase = {};

    var pubkeyhashNetwork = Networks.get(buffer[0], 'pubkeyhash');
    var scripthashNetwork = Networks.get(buffer[0], 'scripthash');
    var contracthashNetwork = Networks.get(buffer[0], 'contracthash');

    if (pubkeyhashNetwork) {
      version.network = pubkeyhashNetwork;
      version.type = Address.PayToPublicKeyHash;
    } else if (scripthashNetwork) {
      version.network = scripthashNetwork;
      version.type = Address.PayToScriptHash;
    } else if (contracthashNetwork) {
      version.network = contracthashNetwork;
      version.type = Address.PayToContractHash;
    }

    return version;
  }

  /**
   * @param {Buffer} hash - An instance of a hash Buffer
   * @returns {Object} An object with keys: hashBuffer
   * @private
   */
  static _transformHash(hash) {
    var info: AddressBase = {};
    if (!(hash instanceof Buffer) && !(hash instanceof Uint8Array)) {
      throw new TypeError('Address supplied is not a buffer.');
    }
    if (hash.length !== 20) {
      throw new TypeError('Address hashbuffers must be exactly 20 bytes.');
    }
    info.hashBuffer = hash;
    info.type = Address.PayToScriptHash;
    return info;
  }

  /**
   * Deserializes an address serialized through `Address#toObject()`
   * @param {Object} data
   * @param {string} data.hash - the hash that this address encodes
   * @param {string} data.type - either 'pubkeyhash' or 'scripthash'
   * @param {Network=} data.network - the name of the network associated
   * @return {Address}
   */
  static _transformObject(data) {
    $.checkArgument(data.hash || data.hashBuffer, 'Must provide a `hash` or `hashBuffer` property');
    $.checkArgument(data.type, 'Must provide a `type` property');
    let buf = data.hash ? new Buffer(data.hash, 'hex') : data.hashBuffer
    let hashBuffer
    if (buf.length == 20) {
      hashBuffer = buf
    } else {
      hashBuffer = buf.slice(1)
    }

    return {
      hashBuffer: hashBuffer,
      network: Networks.get(data.network) || Networks.defaultNetwork,
      type: data.type
    };
  }

  /**
   * transformBuffer support 20-bytes and 21bytes format buffer
   * NOTE: 20-bytes buffer type must be supported
   * @param {[type]} buffer  [description]
   * @param {[type]} network [description]
   * @param {[type]} type    [description]
   */
  static _transformBuffer(buffer, network, type) {
    /* jshint maxcomplexity: 9 */
    var info: AddressBase = {};
    if (!(buffer instanceof Buffer) && !(buffer instanceof Uint8Array)) {
      throw new TypeError('Address supplied is not a buffer.');
    }
    if (buffer.length !== 1 + 20 && buffer.length !== 20) {
      throw new TypeError('Address buffers must be exactly 21 bytes.');
    }

    var networkObj = Networks.get(network);
    var bufferVersion
    if (buffer.length == 20) {
      bufferVersion = Address._classifyFromVersion(new Buffer([networkObj[type]]))
    } else {
      bufferVersion = Address._classifyFromVersion(buffer);
    }

    if (network && !networkObj) {
      throw new TypeError('Unknown network');
    }

    if (!bufferVersion.network || (networkObj && networkObj !== bufferVersion.network)) {
      throw new TypeError('Address has mismatched network type.');
    }

    if (!bufferVersion.type) {

      if (!type) {
        throw new TypeError('Address type is missing')
      } else {
        bufferVersion.type = type
      }

    } else {
      if (type && type !== bufferVersion.type) {
        throw new TypeError('Address has mismatched type.')
      }
    }

    if (buffer.length == 20) {
      info.hashBuffer = buffer
    } else {
      info.hashBuffer = buffer.slice(1)
    }

    info.network = bufferVersion.network;
    info.type = bufferVersion.type;
    return info;
  }

  /**
   * Internal function to transform a bitcoin address string
   *
   * @param {string} data
   * @param {String|Network=} network - either a Network instance, 'livenet', or 'testnet'
   * @param {string=} type - The type: 'pubkeyhash' or 'scripthash'
   * @returns {Object} An object with keys: hashBuffer, network and type
   * @private
   */
  static _transformString(data, network, type) {
    if (typeof(data) !== 'string') {
      throw new TypeError('data parameter supplied is not a string.');
    }
    data = data.trim();
    data = data.replace('0x', '');
    var addressBuffer = new Buffer(data, 'hex')
    var info = Address._transformBuffer(addressBuffer, network, type);
    return info;
  }

  /**
   * Internal function to transform a {@link PublicKey}
   *
   * @param {PublicKey} pubkey - An instance of PublicKey
   * @returns {Object} An object with keys: hashBuffer, type
   * @private
   */
  static _transformPublicKey(pubkey, network) {
    var info: AddressBase = {};
    if (!(pubkey instanceof PublicKey)) {
      throw new TypeError('Address must be an instance of PublicKey.');
    }
    var networkObj = Networks.get(network);

    if (network && !networkObj) {
      throw new TypeError('Unknown network');
    }

    info.hashBuffer = Hash.sha256ripemd160(pubkey.toBuffer());
    info.type = Address.PayToPublicKeyHash;
    info.network = networkObj;
    return info;
  }

  /**
   * Internal function to transform a {@link Script} into a `info` object.
   *
   * @param {Script} script - An instance of Script
   * @returns {Object} An object with keys: hashBuffer, type
   * @private
   */
  static _transformScript(script, network) {
    $.checkArgument(script instanceof Script, 'script must be a Script instance');
    var info = script.getAddressInfo(network);
    if (!info) {
      throw new Error('Can\'t derive address associated with script '+script+', needs to be p2pkh in, p2pkh out, p2sh in, or p2sh out.');
    }
    return info;
  }

  /**
   * check whether the address is PayToContractHash type
   *
   * @param {string} address [address hex start with 0x]
   */
  static IsPayToContractHash(address: string) {
    let type = Address.GetAddressType(address)
    return type == Address.PayToContractHash
  }

  /**
   * check whether the given address belongs to system contracts
   * note `genesis contract` is used interchangeable with `system contract` in the project
   *
   * @param {string} address [address hex start with 0x]
   */
  static IsGenesisContractAddress(address: string) {
    let addr = address.replace('0x', '')
    var addressNumber = Number('0x' + addr);
    return addressNumber >= GENESIS_CONTRACT.MIN && addressNumber <= GENESIS_CONTRACT.MAX
  }

  /**
   * check whether the given address is a valid Asimov address
   *
   * @param {string} address [address hex start with 0x]
   */
  static IsValidateAddress(address: string) {
    return !!Address.GetAddressType(address)
  }

  /**
   * get the type of the given address, type can be `pubkeyhash`, `scripthash` or `contracthash`
   *
   * @param {string} address [address hex start with 0x]
   */
  static GetAddressType(address: string) {
    if (typeof(address) !== 'string' || !(/^0x[0-9A-Fa-f]{42}$/).test(address)) {
      return ''
    }
    let addrStr = address.replace('0x', '');
    let addressBuffer = new Buffer(addrStr, 'hex')
    let version = Address._classifyFromVersion(addressBuffer)

    return version.type
  }

  /**
   * Internal function used to split different kinds of arguments of the constructor
   * @param {*} data - The encoded data in various formats
   * @param {Network|String|number=} network - The network: 'livenet' or 'testnet'
   * @param {string=} type - The type of address: 'script' or 'pubkey' or 'contract'
   * @returns {Object} An "info" object with "type", "network", and "hashBuffer"
   */
  private _classifyArguments(data, network, type) {
    /* jshint maxcomplexity: 10 */
    // transform and validate input data
    let res
    if ((data instanceof Buffer || data instanceof Uint8Array) && data.length === 20) {

      if (type == Address.PayToPublicKeyHash || type == Address.PayToContractHash) {
        res = Address._transformBuffer(data, network, type)
      } else {
        res = Address._transformHash(data)
      }
      res.network = Networks.get(network) || Networks.defaultNetwork

    } else if ((data instanceof Buffer || data instanceof Uint8Array) && data.length === 21) {

      res = Address._transformBuffer(data, network, type)
    } else if (data instanceof PublicKey) {

      res = Address._transformPublicKey(data, network)
    } else if (data instanceof Script) {

      res = Address._transformScript(data, network)
    } else if (typeof(data) === 'string') {

      res = Address._transformString(data, network, type)
    } else if (_.isObject(data)) {

      res = Address._transformObject(data)
    } else {
      throw new TypeError('First argument is an unrecognized data format.')
    }
    return res
  }


  /**
   * Will return a validation error if exists
   *
   * @example
   * ```javascript
   * // a network mismatch error
   * var error = this.getValidationError('15vkcKf7gB23wLAnZLmbVuMiiVDc1Nm4a2', 'testnet');
   * ```
   *
   * @param {string} data - The encoded data
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @param {string} type - The type of address: 'script' or 'pubkey' or 'contract'
   * @returns {null|Error} The corresponding error message
   */
  private getValidationError(data, network, type) {
    var error;
    try {
      /* jshint nonew: false */
      new Address(data, type, network);
    } catch (e) {
      error = e;
    }
    return error;
  }

  /**
   * Instantiate an address from a PublicKey instance
   *
   * @param {PublicKey} data
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromPublicKey(data, network) {
    var info = Address._transformPublicKey(data, network);
    network = info.network || Networks.defaultNetwork;
    return new Address(info.hashBuffer, info.type, network);
  }

  /**
   * Instantiate an address from a ripemd160 public key hash
   *
   * @param {Buffer} hash - An instance of buffer of the hash
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromPublicKeyHash(hash, network) {
    var info = Address._transformHash(hash);
    return new Address(info.hashBuffer, Address.PayToPublicKeyHash, network);
  }

  /**
   * Instantiate an address from a ripemd160 script hash
   *
   * @param {Buffer} hash - An instance of buffer of the hash
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromScriptHash(hash, network) {
    $.checkArgument(hash, 'hash parameter is required');
    var info = Address._transformHash(hash);
    return new Address(info.hashBuffer, Address.PayToScriptHash, network);
  }

  /**
   * Extract address from a Script. The script must be of one
   * of the following types: p2pkh input, p2pkh output, p2sh input
   * or p2sh output.
   * This will analyze the script and extract address information from it.
   * If you want to transform any script to a p2sh Address paying
   * to that script's hash instead, use {{Address#payingTo}}
   *
   * @param {Script} script - An instance of Script
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromScript(script, network) {
    $.checkArgument(script instanceof Script, 'script must be a Script instance');
    var info = Address._transformScript(script, network);
    return new Address(info.hashBuffer, info.type, network);
  }

  /**
   * Instantiate an address from a buffer of the address
   *
   * @param {Buffer} buffer - An instance of buffer of the address
   * @param {String|Network=} network - either a Network instance, 'livenet', or 'testnet'
   * @param {string=} type - The type of address: 'script' or 'pubkey' or 'contract'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromBuffer(buffer, network, type) {
    var info = Address._transformBuffer(buffer, network, type);
    return new Address(info.hashBuffer, info.type, info.network);
  }

  /**
   * Instantiate an address from an address string
   *
   * @param {string} str - An string of the bitcoin address
   * @param {String|Network=} network - either a Network instance, 'livenet', or 'testnet'
   * @param {string=} type - The type of address: 'script' or 'pubkey' or 'contract'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static fromString(str, network, type) {
    var info = Address._transformString(str, network, type);
    return new Address(info.hashBuffer, info.type, info.network);
  }

  /**
   * Instantiate an address from an Object
   *
   * @param {string} json - An JSON string or Object with keys: hash, network and type
   * @returns {Address} A new valid instance of an Address
   */
  public static fromObject(obj) {
    $.checkState(
      JSUtil.isHexa(obj.hash),
      'Unexpected hash property, "' + obj.hash + '", expected to be hex.'
    );
    var hashBuffer = new Buffer(obj.hash, 'hex');
    return new Address(hashBuffer, obj.type, obj.network);
  }
  /**
   * Will return a boolean if an address is valid
   *
   * @example
   * ```javascript
   * assert(this.isValid('15vkcKf7gB23wLAnZLmbVuMiiVDc1Nm4a2', 'livenet'));
   * ```
   *
   * @param {string} data - The encoded data
   * @param {String|Network} network - either a Network instance, 'livenet', or 'testnet'
   * @param {string} type - The type of address: 'script' or 'pubkey' or 'contract'
   * @returns {boolean} The corresponding error message
   */
  public isValid(data, network, type) {
    return !this.getValidationError(data, network, type);
  }

  /**
   * Creates a P2SH address from a set of public keys and a threshold.
   *
   * The addresses will be sorted lexicographically, as that is the trend in bitcoin.
   * To create an address from unsorted public keys, use the {@link Script#buildMultisigOut}
   * interface.
   *
   * @param {Array} publicKeys - a set of public keys to create an address
   * @param {number} threshold - the number of signatures needed to release the funds
   * @param {String | Network} network - either a Network instance, 'livenet', or 'testnet'
   * @return {Address}
   */
  public static createMultisig(publicKeys, threshold, network) {
    network = network || publicKeys[0].network || Networks.defaultNetwork;
    return Address.payingTo(Script.buildMultisigOut(publicKeys, threshold), network);
  }

  /**
   * Builds a p2sh address paying to script. This will hash the script and
   * use that to create the address.
   * If you want to extract an address associated with a script instead,
   * see {{Address#fromScript}}
   *
   * @param script - An instance of Script
   * @param network - either a Network instance, 'livenet', or 'testnet'
   * @returns {Address} A new valid and frozen instance of an Address
   */
  public static payingTo(script: Script, network: string | Networks.Network) {
    $.checkArgument(script, 'script is required');
    $.checkArgument(script instanceof Script, 'script must be instance of Script');

    return this.fromScriptHash(Hash.sha256ripemd160(script.toBuffer()), network);
  }

  /**
   * Returns true if an address is of pay to public key hash type
   * @return boolean
   */
  public isPayToPublicKeyHash() {
    return this.type === Address.PayToPublicKeyHash;
  }

  /**
   * Returns true if an address is of pay to script hash type
   * @return boolean
   */
  public isPayToScriptHash() {
    return this.type === Address.PayToScriptHash;
  }
  /**
   * Returns true if an address is of pay to contract hash type
   * @return boolean
   */
  public isPayToContractHash() {
    return this.type === Address.PayToContractHash;
  }

  /**
   * Will return a buffer representation of the address
   *
   * @returns {Buffer} Bitcoin address buffer
   */
  public toBuffer() {
    var version = new Buffer([this.network[this.type]]);
    var buf = Buffer.concat([version, this.hashBuffer]);
    return buf;
  }

  /**
   * @returns {Object} A plain object with the address information
   */

  public toObject() {
    return this.toJSON();
  }
  /**
   * @returns {Object} a json formate data with address information
   */
  public toJSON() {
    return {
      hash: this.hashBuffer.toString('hex'),
      type: this.type,
      network: this.network.toString()
    };
  }

  /**
   * Will return a the string representation of the address
   *
   * @returns {string} Bitcoin address
   */
  public toString() {
    return '0x' + this.toBuffer().toString('hex');
  }

  /**
   * Will return a string formatted for the console
   *
   * @returns {string} Bitcoin address
   */
  public inspect() {
    return '<Address: ' + this.toString() + ', type: ' + this.type + ', network: ' + this.network + '>';
  }

  /**
   * Set address network
   * @param {Network | string} network [description]
   */
  public setNetwork(network: Networks.Network | string) {
    if (typeof(network) === 'string') {
      if (network !== "livenet" && network !== "testnet") {
        throw new TypeError(' Network argument must be "livenet" or "testnet".');
      } else {
        this.network = Networks.get(network)
      }
    } else {
      this.network = network
    }
  }

}
