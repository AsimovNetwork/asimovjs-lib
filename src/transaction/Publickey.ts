
import * as Hash from '../utils/Hash'
import * as JSUtil from '../utils/Js'
import * as _ from 'lodash'
import * as $ from '../utils/Preconditions'
import * as Networks from './Networks'

import { Bn } from "../utils/Bn";
import { Point } from "../utils/Point";
import { Address } from "./Address";

/**
 * Instantiate a PublicKey from a {@link PrivateKey}, {@link Point}, `string`, or `Buffer`.
 *
 * There are two internal properties, `network` and `compressed`, that deal with importing
 * a PublicKey from a PrivateKey in WIF format. More details described on {@link PrivateKey}
 *
 * @example
 * ```javascript
 * // instantiate from a private key
 * var key = PublicKey(privateKey, true);
 *
 * // export to as a DER hex encoded string
 * var exported = key.toString();
 *
 * // import the public key
 * var imported = PublicKey.fromString(exported);
 * ```import { PrivateKey } from 'bitcore-lib';

 *
 * @param {string} data - The encoded data in various formats
 * @param {Object} extra - additional options
 * @param {Network=} extra.network - Which network should the address for this public key be for
 * @param {String=} extra.compressed - If the public key is compressed
 * @returns {PublicKey} A new valid instance of an PublicKey
 * @constructor
 */
export class PublicKey {
  public point: any;
  public compressed: any;
  public network: any;
  constructor(data?: any, extra?: any) {
    if (!(this instanceof PublicKey)) {
      return new PublicKey(data, extra);
    }

    $.checkArgument(data, 'First argument is required, please include public key data.');

    if (data instanceof PublicKey) {
      // Return copy, but as it's an immutable object, return same argument
      return data;
    }
    extra = extra || {};

    var info = this._classifyArgs(data, extra);

    // validation
    info.point.validate();

    JSUtil.defineImmutable(this, {
      point: info.point,
      compressed: info.compressed,
      network: info.network || Networks.defaultNetwork
    });

    //return this;
  }

  /**
   * Internal function to differentiate between arguments passed to the constructor
   * @param {*} data
   * @param {Object} extra
   */
  public _classifyArgs(data, extra) {
    /* jshint maxcomplexity: 10 */
    var info: any = {
      compressed: _.isUndefined(extra.compressed) || extra.compressed
    };

    // detect type of data
    if (data instanceof Point) {
      info.point = data;
    } else if (data.x && data.y) {
      info = PublicKey._transformObject(data);
    } else if (typeof(data) === 'string') {
      info = PublicKey._transformDER(Buffer.from(data, 'hex'), null);
    } else if (PublicKey._isBuffer(data)) {
      info = PublicKey._transformDER(data, null);
    } else if (PublicKey._isPrivateKey(data)) {
      info = PublicKey._transformPrivateKey(data);
    } else {
      throw new TypeError('First argument is an unrecognized data format.');
    }
    if (!info.network) {
      info.network = _.isUndefined(extra.network) ? undefined : Networks.get(extra.network);
    }
    return info;
  };

  /**
   * Internal function to detect if an object is a {@link PrivateKey}
   *
   * @param {*} param - object to test
   * @returns {boolean}
   * @private
   */
  static _isPrivateKey(param) {
    var PrivateKey = require('./Privatekey').PrivateKey;
    return param instanceof PrivateKey;
  };

  /**
   * Internal function to detect if an object is a Buffer
   *
   * @param {*} param - object to test
   * @returns {boolean}
   * @private
   */
  static _isBuffer(param) {
    return (param instanceof Buffer) || (param instanceof Uint8Array);
  };

  /**
   * Internal function to transform a private key into a public key point
   *
   * @param {PrivateKey} privkey - An instance of PrivateKey
   * @returns {Object} An object with keys: point and compressed
   * @private
   */
  static _transformPrivateKey(privkey) {
    $.checkArgument(PublicKey._isPrivateKey(privkey), 'Must be an instance of PrivateKey');
    var info: any = {};
    info.point = Point.getG().mul(privkey.bn);
    info.compressed = privkey.compressed;
    info.network = privkey.network;
    return info;
  };

  /**
   * Internal function to transform DER into a public key point
   *
   * @param {Buffer} buf - An hex encoded buffer
   * @param {bool=} strict - if set to false, will loosen some conditions
   * @returns {Object} An object with keys: point and compressed
   * @private
   */
  static _transformDER(buf, strict) {
    /* jshint maxstatements: 30 */
    /* jshint maxcomplexity: 12 */
    $.checkArgument(PublicKey._isBuffer(buf), 'Must be a hex buffer of DER encoded public key');
    var info: any = {};

    strict = _.isUndefined(strict) ? true : strict;

    var x;
    var y;
    var xbuf;
    var ybuf;

    if (buf[0] === 0x04 || (!strict && (buf[0] === 0x06 || buf[0] === 0x07))) {
      xbuf = buf.slice(1, 33);
      ybuf = buf.slice(33, 65);
      if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
        throw new TypeError('Length of x and y must be 32 bytes');
      }
      x = new Bn(xbuf);
      y = new Bn(ybuf);
      info.point = new Point(x, y);
      info.compressed = false;
    } else if (buf[0] === 0x03) {
      xbuf = buf.slice(1);
      x = new Bn(xbuf);
      info = PublicKey._transformX(true, x);
      info.compressed = true;
    } else if (buf[0] === 0x02) {
      xbuf = buf.slice(1);
      x = new Bn(xbuf);
      info = PublicKey._transformX(false, x);
      info.compressed = true;
    } else {
      throw new TypeError('Invalid DER format public key');
    }
    return info;
  };

  /**
   * Internal function to transform X into a public key point
   *
   * @param {Boolean} odd - If the point is above or below the x axis
   * @param {Point} x - The x point
   * @returns {Object} An object with keys: point and compressed
   * @private
   */
  static _transformX(odd, x) {
    $.checkArgument(typeof odd === 'boolean', 'Must specify whether y is odd or not (true or false)');
    var info: any = {};
    info.point = Point.fromX(odd, x);
    return info;
  };

  /**
   * Internal function to transform a JSON into a public key point
   *
   * @param {String|Object} json - a JSON string or plain object
   * @returns {Object} An object with keys: point and compressed
   * @private
   */
  static _transformObject(json) {
    var x = new Bn(json.x, 'hex');
    var y = new Bn(json.y, 'hex');
    var point = new Point(x, y);
    return new PublicKey(point, {
      compressed: json.compressed
    });
  };

  /**
   * Instantiate a PublicKey from a PrivateKey
   *
   * @param {PrivateKey} privkey - An instance of PrivateKey
   * @returns {PublicKey} A new valid instance of PublicKey
   */
  static fromPrivateKey(privkey) {
    $.checkArgument(PublicKey._isPrivateKey(privkey), 'Must be an instance of PrivateKey');
    var info = PublicKey._transformPrivateKey(privkey);
    return new PublicKey(info.point, {
      compressed: info.compressed,
      network: info.network
    });
  };

  /**
   * Instantiate a PublicKey from a Buffer
   * @param {Buffer} buf - A DER hex buffer
   * @param {bool=} strict - if set to false, will loosen some conditions
   * @returns {PublicKey} A new valid instance of PublicKey
   */
  static fromDER(buf, strict) {
    $.checkArgument(PublicKey._isBuffer(buf), 'Must be a hex buffer of DER encoded public key');
    var info = PublicKey._transformDER(buf, strict);
    return new PublicKey(info.point, {
      compressed: info.compressed
    });
  };

  static fromBuffer(buf, strict) {
    $.checkArgument(PublicKey._isBuffer(buf), 'Must be a hex buffer of DER encoded public key');
    var info = PublicKey._transformDER(buf, strict);
    return new PublicKey(info.point, {
      compressed: info.compressed
    });
  };

  /**
   * Instantiate a PublicKey from a Point
   *
   * @param {Point} point - A Point instance
   * @param {boolean=} compressed - whether to store this public key as compressed format
   * @returns {PublicKey} A new valid instance of PublicKey
   */
  static fromPoint(point, compressed) {
    $.checkArgument(point instanceof Point, 'First argument must be an instance of Point.');
    return new PublicKey(point, {
      compressed: compressed
    });
  };

  /**
   * Instantiate a PublicKey from a DER hex encoded string
   *
   * @param {string} str - A DER hex string
   * @param {String=} encoding - The type of string encoding
   * @returns {PublicKey} A new valid instance of PublicKey
   */
  static fromString(str, encoding) {
    var buf = Buffer.from(str, encoding || 'hex');
    var info = PublicKey._transformDER(buf, null);
    return new PublicKey(info.point, {
      compressed: info.compressed
    });
  };

  /**
   * Instantiate a PublicKey from an X Point
   *
   * @param {Boolean} odd - If the point is above or below the x axis
   * @param {Point} x - The x point
   * @returns {PublicKey} A new valid instance of PublicKey
   */
  static fromX(odd, x) {
    var info = PublicKey._transformX(odd, x);
    return new PublicKey(info.point, {
      compressed: info.compressed
    });
  };

  /**
   * Check if there would be any errors when initializing a PublicKey
   *
   * @param {string} data - The encoded data in various formats
   * @returns {null|Error} An error if exists
   */
  static getValidationError(data) {
    var error;
    try {
      /* jshint nonew: false */
      new PublicKey(data, null);
    } catch (e) {
      error = e;
    }
    return error;
  };

  /**
   * Check if the parameters are valid
   *
   * @param {string} data - The encoded data in various formats
   * @returns {Boolean} If the public key would be valid
   */
  static isValid(data) {
    return !PublicKey.getValidationError(data);
  };

  /**
   * @returns {Object} A plain object of the PublicKey
   */
  public toObject() {
    return {
      x: this.point.getX().toString('hex', 2),
      y: this.point.getY().toString('hex', 2),
      compressed: this.compressed
    };
  };

  public toJSON() {
    return {
      x: this.point.getX().toString('hex', 2),
      y: this.point.getY().toString('hex', 2),
      compressed: this.compressed
    };
  };

  /**
   * Will output the PublicKey to a DER Buffer
   *
   * @returns {Buffer} A DER hex encoded buffer
   */
  public toBuffer() {
    var x = this.point.getX();
    var y = this.point.getY();

    var xbuf = x.toBuffer({
      size: 32
    });
    var ybuf = y.toBuffer({
      size: 32
    });

    var prefix;
    if (!this.compressed) {
      prefix = Buffer.from([0x04]);
      return Buffer.concat([prefix, xbuf, ybuf]);
    } else {
      var odd = ybuf[ybuf.length - 1] % 2;
      if (odd) {
        prefix = Buffer.from([0x03]);
      } else {
        prefix = Buffer.from([0x02]);
      }
      return Buffer.concat([prefix, xbuf]);
    }
  };

  public toDER() {
    var x = this.point.getX();
    var y = this.point.getY();

    var xbuf = x.toBuffer({
      size: 32
    });
    var ybuf = y.toBuffer({
      size: 32
    });

    var prefix;
    if (!this.compressed) {
      prefix = Buffer.from([0x04]);
      return Buffer.concat([prefix, xbuf, ybuf]);
    } else {
      var odd = ybuf[ybuf.length - 1] % 2;
      if (odd) {
        prefix = Buffer.from([0x03]);
      } else {
        prefix = Buffer.from([0x02]);
      }
      return Buffer.concat([prefix, xbuf]);
    }
  };

  /**
   * Will return a sha256 + ripemd160 hash of the serialized public key
   * @see https://github.com/bitcoin/bitcoin/blob/master/src/pubkey.h#L141
   * @returns {Buffer}
   */
  public _getID() {
    return Hash.sha256ripemd160(this.toBuffer());
  };

  /**
   * Will return an address for the public key
   *
   * @param {String|Network=} network - Which network should the address be for
   * @returns {Address} An address generated from the public key
   */
  public toAddress(network?: string) {
    return Address.fromPublicKey(this, network || this.network);
  };

  /**
   * Will output the PublicKey to a DER encoded hex string
   *
   * @returns {string} A DER hex encoded string
   */
  public toString() {
    return this.toDER().toString('hex');
  };

  /**
   * Will return a string formatted for the console
   *
   * @returns {string} Public key
   */
  public inspect() {
    return '<PublicKey: ' + this.toString() +
      (this.compressed ? '' : ', uncompressed') + '>';
  };
};
