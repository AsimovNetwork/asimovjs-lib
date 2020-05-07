'use strict';

import * as _ from "lodash";
import * as bs58 from "bs58";
import * as buffer from "buffer";

var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');


export class Base58 {
  public buf: any;
  constructor(obj) {
    /* jshint maxcomplexity: 8 */
    if (!(this instanceof Base58)) {
      return new Base58(obj);
    }
    if (Buffer.isBuffer(obj)) {
      var buf = obj;
      this.fromBuffer(buf);
    } else if (typeof obj === 'string') {
      var str = obj;
      this.fromString(str);
    } else if (obj) {
      this.set(obj);
    }
  }

  static validCharacters(chars) {
    if (buffer.Buffer.isBuffer(chars)) {
      chars = chars.toString();
    }
    return _.every(_.map(chars, function(char) { return _.includes(ALPHABET, char); }));
  };

  public set(obj) {
    this.buf = obj.buf || this.buf || undefined;
    return this;
  };

  static encode(buf) {
    if (!buffer.Buffer.isBuffer(buf)) {
      throw new Error('Input should be a buffer');
    }
    return bs58.encode(buf);
  };

  static decode(str) {
    if (typeof str !== 'string') {
      throw new Error('Input should be a string');
    }
    return Buffer.from(bs58.decode(str));
  };

  public fromBuffer(buf) {
    this.buf = buf;
    return this;
  };

  public fromString(str) {
    var buf = Base58.decode(str);
    this.buf = buf;
    return this;
  };

  public toBuffer() {
    return this.buf;
  };

  public toString() {
    return Base58.encode(this.buf);
  };
}
