"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const hash = require("../Hash");
const buffer_1 = require("buffer");
const Base58_1 = require("./Base58");
var sha256sha256 = hash.sha256sha256;
class Base58Check {
    constructor(obj) {
        if (!(this instanceof Base58Check))
            return new Base58Check(obj);
        if (buffer_1.Buffer.isBuffer(obj)) {
            var buf = obj;
            this.fromBuffer(buf);
        }
        else if (typeof obj === 'string') {
            var str = obj;
            this.fromString(str);
        }
        else if (obj) {
            this.set(obj);
        }
    }
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        return this;
    }
    ;
    fromBuffer(buf) {
        this.buf = buf;
        return this;
    }
    ;
    fromString(str) {
        var buf = Base58Check.decode(str);
        this.buf = buf;
        return this;
    }
    ;
    toBuffer() {
        return this.buf;
    }
    ;
    toString() {
        return Base58Check.encode(this.buf);
    }
    ;
    static validChecksum(data, checksum) {
        // static validChecksum(data, checksum) {
        if (_.isString(data)) {
            data = new buffer_1.Buffer(Base58_1.Base58.decode(data));
        }
        if (_.isString(checksum)) {
            checksum = new buffer_1.Buffer(Base58_1.Base58.decode(checksum));
        }
        if (!checksum) {
            checksum = data.slice(-4);
            data = data.slice(0, -4);
        }
        return Base58Check.checksum(data).toString('hex') === checksum.toString('hex');
    }
    ;
    static decode(s) {
        // public decode(s) {
        if (typeof s !== 'string')
            throw new Error('Input must be a string');
        var buf = buffer_1.Buffer.from(Base58_1.Base58.decode(s));
        if (buf.length < 4)
            throw new Error("Input string too short");
        var data = buf.slice(0, -4);
        var csum = buf.slice(-4);
        var hash = sha256sha256(data);
        var hash4 = hash.slice(0, 4);
        if (csum.toString('hex') !== hash4.toString('hex'))
            throw new Error("Checksum mismatch");
        return data;
    }
    ;
    static checksum(buffer) {
        return sha256sha256(buffer).slice(0, 4);
    }
    ;
    static encode(buf) {
        // public encode(buf) {
        if (!buffer_1.Buffer.isBuffer(buf))
            throw new Error('Input must be a buffer');
        var checkedBuf = buffer_1.Buffer.alloc(buf.length + 4);
        var hash = Base58Check.checksum(buf);
        buf.copy(checkedBuf);
        hash.copy(checkedBuf, buf.length);
        return Base58_1.Base58.encode(checkedBuf);
    }
    ;
}
exports.Base58Check = Base58Check;
//# sourceMappingURL=Base58Check.js.map