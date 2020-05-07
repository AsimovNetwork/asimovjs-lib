'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const bs58 = require("bs58");
const buffer = require("buffer");
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');
class Base58 {
    constructor(obj) {
        /* jshint maxcomplexity: 8 */
        if (!(this instanceof Base58)) {
            return new Base58(obj);
        }
        if (Buffer.isBuffer(obj)) {
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
    static validCharacters(chars) {
        if (buffer.Buffer.isBuffer(chars)) {
            chars = chars.toString();
        }
        return _.every(_.map(chars, function (char) { return _.includes(ALPHABET, char); }));
    }
    ;
    set(obj) {
        this.buf = obj.buf || this.buf || undefined;
        return this;
    }
    ;
    static encode(buf) {
        if (!buffer.Buffer.isBuffer(buf)) {
            throw new Error('Input should be a buffer');
        }
        return bs58.encode(buf);
    }
    ;
    static decode(str) {
        if (typeof str !== 'string') {
            throw new Error('Input should be a string');
        }
        return Buffer.from(bs58.decode(str));
    }
    ;
    fromBuffer(buf) {
        this.buf = buf;
        return this;
    }
    ;
    fromString(str) {
        var buf = Base58.decode(str);
        this.buf = buf;
        return this;
    }
    ;
    toBuffer() {
        return this.buf;
    }
    ;
    toString() {
        return Base58.encode(this.buf);
    }
    ;
}
exports.Base58 = Base58;
//# sourceMappingURL=Base58.js.map