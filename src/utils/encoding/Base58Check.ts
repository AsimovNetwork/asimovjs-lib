import * as _ from "lodash";
import * as hash from "../Hash";
import { Buffer } from "buffer";
import { Base58 } from "./Base58"


var sha256sha256 = hash.sha256sha256;

export class Base58Check {
  public buf: any;
  constructor(obj) {
    if (!(this instanceof Base58Check))
      return new Base58Check(obj);
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

  public set(obj) {
    this.buf = obj.buf || this.buf || undefined;
    return this;
  };

  public fromBuffer(buf) {
    this.buf = buf;
    return this;
  };

  public fromString(str) {
    var buf = Base58Check.decode(str);
    this.buf = buf;
    return this;
  };

  public toBuffer() {
    return this.buf;
  };

  public toString() {
    return Base58Check.encode(this.buf);
  };

  static validChecksum(data, checksum) {
  // static validChecksum(data, checksum) {
    if (_.isString(data)) {
      data = new Buffer(Base58.decode(data));
    }
    if (_.isString(checksum)) {
      checksum = new Buffer(Base58.decode(checksum));
    }
    if (!checksum) {
      checksum = data.slice(-4);
      data = data.slice(0, -4);
    }
    return Base58Check.checksum(data).toString('hex') === checksum.toString('hex');
  };

  static decode(s) {
  // public decode(s) {
    if (typeof s !== 'string')
      throw new Error('Input must be a string');

    var buf = Buffer.from(Base58.decode(s));

    if (buf.length < 4)
      throw new Error("Input string too short");

    var data = buf.slice(0, -4);
    var csum = buf.slice(-4);

    var hash = sha256sha256(data);
    var hash4 = hash.slice(0, 4);

    if (csum.toString('hex') !== hash4.toString('hex'))
      throw new Error("Checksum mismatch");

    return data;
  };

  static checksum(buffer) {
    return sha256sha256(buffer).slice(0, 4);
  };

  static encode(buf) {
  // public encode(buf) {
    if (!Buffer.isBuffer(buf))
      throw new Error('Input must be a buffer');
    var checkedBuf = Buffer.alloc(buf.length + 4);
    var hash = Base58Check.checksum(buf);
    buf.copy(checkedBuf);
    hash.copy(checkedBuf, buf.length);
    return Base58.encode(checkedBuf);
  };
}
