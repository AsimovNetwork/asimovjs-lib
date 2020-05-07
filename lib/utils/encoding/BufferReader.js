'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const BufferUtil = require("../BitcoreBuffer");
const $ = require("../Preconditions");
const _ = require("lodash");
const BN = require("../Bn");
class BufferReader {
    constructor(buf) {
        this.pos = 0;
        this.finished = this.eof;
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
        }
        else if (_.isString(buf)) {
            this.set({
                buf: Buffer.from(buf, 'hex'),
            });
        }
        else if (_.isObject(buf)) {
            var obj = buf;
            this.set(obj);
        }
        else {
            throw new TypeError('Unrecognized argument for BufferReader');
        }
    }
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        this.pos = obj.pos || this.pos || 0;
        return this;
    }
    ;
    eof() {
        if (this.buf) {
            return this.pos >= this.buf.length;
        }
        else {
            return true;
        }
    }
    ;
    read(len) {
        $.checkArgument(!_.isUndefined(len), 'Must specify a length');
        var buf = this.buf.slice(this.pos, this.pos + len);
        this.pos = this.pos + len;
        return buf;
    }
    ;
    readAll() {
        var buf = this.buf.slice(this.pos, this.buf.length);
        this.pos = this.buf.length;
        return buf;
    }
    ;
    readUInt8() {
        var val = this.buf.readUInt8(this.pos);
        this.pos = this.pos + 1;
        return val;
    }
    ;
    readUInt16BE() {
        var val = this.buf.readUInt16BE(this.pos);
        this.pos = this.pos + 2;
        return val;
    }
    ;
    readUInt16LE() {
        var val = this.buf.readUInt16LE(this.pos);
        this.pos = this.pos + 2;
        return val;
    }
    ;
    readUInt32BE() {
        var val = this.buf.readUInt32BE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    ;
    readUInt32LE() {
        var val = this.buf.readUInt32LE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    ;
    readInt32LE() {
        var val = this.buf.readInt32LE(this.pos);
        this.pos = this.pos + 4;
        return val;
    }
    ;
    readUInt64BEBN() {
        var buf = this.buf.slice(this.pos, this.pos + 8);
        var bn = BN.Bn.fromBuffer(buf);
        this.pos = this.pos + 8;
        return bn;
    }
    ;
    readUInt64LEBN() {
        var second = this.buf.readUInt32LE(this.pos);
        var first = this.buf.readUInt32LE(this.pos + 4);
        var combined = (first * 0x100000000) + second;
        var bn;
        if (combined <= 0x1fffffffffffff) {
            bn = new BN.Bn(combined);
        }
        else {
            var data = Array.prototype.slice.call(this.buf, this.pos, this.pos + 8);
            bn = new BN.Bn(data, 10, 'le');
        }
        this.pos = this.pos + 8;
        return bn;
    }
    ;
    readVarintNum() {
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
                }
                else {
                    throw new Error('number too large to retain precision - use readVarintBN');
                }
                break;
            default:
                return first;
        }
    }
    ;
    /**
     * reads a length prepended buffer
     */
    readVarLengthBuffer() {
        var len = this.readVarintNum();
        var buf = this.read(len);
        $.checkState(buf.length === len, 'Invalid length while reading varlength buffer. ' +
            'Expected to read: ' + len + ' and read ' + buf.length);
        return buf;
    }
    ;
    readVarintBuf() {
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
    }
    ;
    readVarintBN() {
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
    }
    ;
    reverse() {
        var buf = Buffer.alloc(this.buf.length);
        for (var i = 0; i < buf.length; i++) {
            buf[i] = this.buf[this.buf.length - 1 - i];
        }
        this.buf = buf;
        return this;
    }
    ;
    readReverse(len) {
        if (_.isUndefined(len)) {
            len = this.buf.length;
        }
        var buf = this.buf.slice(this.pos, this.pos + len);
        this.pos = this.pos + len;
        return BufferUtil.reverse(buf);
    }
    ;
}
exports.BufferReader = BufferReader;
//# sourceMappingURL=BufferReader.js.map