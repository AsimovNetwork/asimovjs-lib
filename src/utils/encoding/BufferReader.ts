'use strict';

import * as BufferUtil from '../BitcoreBuffer'
import * as $ from '../Preconditions'
import * as _ from 'lodash'
import * as BN from '../Bn'

export class BufferReader{
  public buf: Buffer;
  public pos = 0
  constructor(buf) {
    if (!(this instanceof BufferReader)) {
      return new BufferReader(buf);
    }
    if (_.isUndefined(buf)) {
      return;
    }
    if (Buffer.isBuffer(buf)) {
      this.set({
        buf: buf
      });
    } else if (_.isString(buf)) {
      this.set({
        buf: Buffer.from(buf, 'hex'),
      });
    } else if (_.isObject(buf)) {
      var obj = buf;
      this.set(obj);
    } else {
      throw new TypeError('Unrecognized argument for BufferReader');
    }
  }

  public set(obj) {
    this.buf = obj.buf || this.buf || undefined;
    this.pos = obj.pos || this.pos || 0;
    return this;
  };

  public eof() {
    if(this.buf) {
      return this.pos >= this.buf.length;
    } else {
      return true;
    }
  };

  public finished = this.eof;

  public read(len) {
    $.checkArgument(!_.isUndefined(len), 'Must specify a length');
    var buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    return buf;
  };

  public readAll() {
    var buf = this.buf.slice(this.pos, this.buf.length);
    this.pos = this.buf.length;
    return buf;
  };

  public readUInt8() {
    var val = this.buf.readUInt8(this.pos);
    this.pos = this.pos + 1;
    return val;
  };

  public readUInt16BE() {
    var val = this.buf.readUInt16BE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  public readUInt16LE() {
    var val = this.buf.readUInt16LE(this.pos);
    this.pos = this.pos + 2;
    return val;
  };

  public readUInt32BE() {
    var val = this.buf.readUInt32BE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  public readUInt32LE() {
    var val = this.buf.readUInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  public readInt32LE() {
    var val = this.buf.readInt32LE(this.pos);
    this.pos = this.pos + 4;
    return val;
  };

  public readUInt64BEBN() {
    var buf = this.buf.slice(this.pos, this.pos + 8);
    var bn = BN.Bn.fromBuffer(buf);
    this.pos = this.pos + 8;
    return bn;
  };

  public readUInt64LEBN() {
    var second = this.buf.readUInt32LE(this.pos);
    var first = this.buf.readUInt32LE(this.pos + 4);
    var combined = (first * 0x100000000) + second;
    var bn;
    if (combined <= 0x1fffffffffffff) {
      bn = new BN.Bn(combined);
    } else {
      var data = Array.prototype.slice.call(this.buf, this.pos, this.pos + 8);
      bn = new BN.Bn(data, 10, 'le');
    }
    this.pos = this.pos + 8;
    return bn;
  };

  public readVarintNum() {
    var first = this.readUInt8();
    switch (first) {
      case 0xFD:
        return this.readUInt16LE();
      case 0xFE:
        return this.readUInt32LE();
      case 0xFF:
        var bn = this.readUInt64LEBN();
        var n = bn.toNumber();
        if (n <= Math.pow(2, 53)) {
          return n;
        } else {
          throw new Error('number too large to retain precision - use readVarintBN');
        }
        break;
      default:
        return first;
    }
  };

  /**
   * reads a length prepended buffer
   */
  public readVarLengthBuffer() {
    var len = this.readVarintNum();
    var buf = this.read(len);
    $.checkState(buf.length === len, 'Invalid length while reading varlength buffer. ' +
      'Expected to read: ' + len + ' and read ' + buf.length);
    return buf;
  };

  public readVarintBuf() {
    var first = this.buf.readUInt8(this.pos);
    switch (first) {
      case 0xFD:
        return this.read(1 + 2);
      case 0xFE:
        return this.read(1 + 4);
      case 0xFF:
        return this.read(1 + 8);
      default:
        return this.read(1);
    }
  };

  public readVarintBN() {
    var first = this.readUInt8();
    switch (first) {
      case 0xFD:
        return new BN.Bn(this.readUInt16LE());
      case 0xFE:
        return new BN.Bn(this.readUInt32LE());
      case 0xFF:
        return this.readUInt64LEBN();
      default:
        return new BN.Bn(first);
    }
  };

  public reverse() {
    var buf: any = Buffer.alloc(this.buf.length);
    for (var i = 0; i < buf.length; i++) {
      buf[i] = this.buf[this.buf.length - 1 - i];
    }
    this.buf = buf;
    return this;
  };

  public readReverse(len?: number) {
    if (_.isUndefined(len)) {
      len = this.buf.length;
    }
    var buf = this.buf.slice(this.pos, this.pos + len);
    this.pos = this.pos + len;
    return BufferUtil.reverse(buf);
  };
}
