"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BN = require('bn.js');
const $ = require("./Preconditions");
const _ = require("lodash");
// import * as BN from 'bn.js';
class Bn extends BN.BN {
    constructor(str, base, endian) {
        super(str, base, endian);
        // export const Zero = new BN(0);
        // export const One = new BN(1);
        this.Minus1 = new BN(-1);
        let bn = new BN.BN(str, base, endian);
        Object.assign(this, bn);
        return this;
    }
    toNumber() {
        return parseInt(super.toString(10), 10);
    }
    ;
    /**
     * The corollary to the above, with the notable exception that we do not throw
     * an error if the output is larger than four bytes. (Which can happen if
     * performing a numerical operation that results in an overflow to more than 4
     * bytes).
     */
    toScriptNumBuffer() {
        return this.toSM({
            endian: 'little'
        });
    }
    ;
    toBuffer(opts) {
        var buf, hex;
        if (opts && opts.size) {
            hex = super.toString(16, 2);
            var natlen = hex.length / 2;
            buf = Buffer.from(hex, 'hex');
            if (natlen === opts.size) {
                buf = buf;
            }
            else if (natlen > opts.size) {
                buf = Bn.trim(buf, natlen);
            }
            else if (natlen < opts.size) {
                buf = Bn.pad(buf, natlen, opts.size);
            }
        }
        else {
            hex = super.toString(16, 2);
            buf = Buffer.from(hex, 'hex');
        }
        if (typeof opts !== 'undefined' && opts.endian === 'little') {
            buf = Bn.reversebuf(buf);
        }
        return buf;
    }
    ;
    toSMBigEndian() {
        var buf;
        if (this.cmp(new BN(0)) === -1) {
            buf = this.neg().toBuffer();
            if (buf[0] & 0x80) {
                buf = Buffer.concat([Buffer.from([0x80]), buf]);
            }
            else {
                buf[0] = buf[0] | 0x80;
            }
        }
        else {
            buf = this.toBuffer();
            if (buf[0] & 0x80) {
                buf = Buffer.concat([Buffer.from([0x00]), buf]);
            }
        }
        if (buf.length === 1 && buf[0] === 0) {
            buf = Buffer.from([]);
        }
        return buf;
    }
    ;
    toSM(opts) {
        var endian = opts ? opts.endian : 'big';
        var buf = this.toSMBigEndian();
        if (endian === 'little') {
            buf = Bn.reversebuf(buf);
        }
        return buf;
    }
    ;
    static reversebuf(buf) {
        var buf2 = Buffer.alloc(buf.length);
        for (var i = 0; i < buf.length; i++) {
            buf2[i] = buf[buf.length - 1 - i];
        }
        return buf2;
    }
    ;
    static fromNumber(n) {
        $.checkArgument(_.isNumber(n));
        return new Bn(n);
    }
    ;
    static fromString(str, base) {
        $.checkArgument(_.isString(str));
        return new Bn(str, base);
    }
    ;
    static fromBuffer(buf, opts) {
        if (typeof opts !== 'undefined' && opts.endian === 'little') {
            buf = Bn.reversebuf(buf);
        }
        var hex = buf.toString('hex');
        var bn = new Bn(hex, 16);
        return bn;
    }
    ;
    /**
     * Instantiate a BigNumber from a "signed magnitude buffer"
     * (a buffer where the most significant bit represents the sign (0 = positive, -1 = negative))
     */
    static fromSM(buf, opts) {
        var ret;
        if (buf.length === 0) {
            return Bn.fromBuffer(Buffer.from([0]));
        }
        var endian = 'big';
        if (opts) {
            endian = opts.endian;
        }
        if (endian === 'little') {
            buf = Bn.reversebuf(buf);
        }
        if (buf[0] & 0x80) {
            buf[0] = buf[0] & 0x7f;
            ret = Bn.fromBuffer(buf);
            ret.neg().copy(ret);
        }
        else {
            ret = Bn.fromBuffer(buf);
        }
        return ret;
    }
    ;
    /**
     * Create a BN from a "ScriptNum":
     * This is analogous to the constructor for CScriptNum in bitcoind. Many ops in
     * bitcoind's script interpreter use CScriptNum, which is not really a proper
     * bignum. Instead, an error is thrown if trying to input a number bigger than
     * 4 bytes. We copy that behavior here. A third argument, `size`, is provided to
     * extend the hard limit of 4 bytes, as some usages require more than 4 bytes.
     */
    static fromScriptNumBuffer(buf, fRequireMinimal, size) {
        var nMaxNumSize = size || 4;
        $.checkArgument(buf.length <= nMaxNumSize, new Error('script number overflow'));
        if (fRequireMinimal && buf.length > 0) {
            // Check that the number is encoded with the minimum possible
            // number of bytes.
            //
            // If the most-significant-byte - excluding the sign bit - is zero
            // then we're not minimal. Note how this test also rejects the
            // negative-zero encoding, 0x80.
            if ((buf[buf.length - 1] & 0x7f) === 0) {
                // One exception: if there's more than one byte and the most
                // significant bit of the second-most-significant-byte is set
                // it would conflict with the sign bit. An example of this case
                // is +-255, which encode to 0xff00 and 0xff80 respectively.
                // (big-endian).
                if (buf.length <= 1 || (buf[buf.length - 2] & 0x80) === 0) {
                    throw new Error('non-minimally encoded script number');
                }
            }
        }
        return Bn.fromSM(buf, {
            endian: 'little'
        });
    }
    ;
    static trim(buf, natlen) {
        return buf.slice(natlen - buf.length, buf.length);
    }
    ;
    static pad(buf, natlen, size) {
        var rbuf = Buffer.alloc(size);
        for (var i = 0; i < buf.length; i++) {
            rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i];
        }
        for (i = 0; i < size - natlen; i++) {
            rbuf[i] = 0;
        }
        return rbuf;
    }
    ;
}
exports.Bn = Bn;
//# sourceMappingURL=Bn.js.map