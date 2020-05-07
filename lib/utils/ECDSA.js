'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const BN = require("./Bn");
const Random = require("./Random");
const Hash = require("./Hash");
const BufferUtil = require("./BitcoreBuffer");
const _ = require("lodash");
const $ = require("../utils/Preconditions");
const Constant = require("../Constant");
const Point_1 = require("./Point");
const Signature_1 = require("./Signature");
const Publickey_1 = require("../transaction/Publickey");
class ECDSA {
    constructor(obj) {
        if (!(this instanceof ECDSA)) {
            return new ECDSA(obj);
        }
        if (obj) {
            this.set(obj);
        }
    }
    /* jshint maxcomplexity: 9 */
    set(obj) {
        this.hashbuf = obj.hashbuf || this.hashbuf;
        this.endian = obj.endian || this.endian; //the endianness of hashbuf
        this.privkey = obj.privkey || this.privkey;
        this.pubkey = obj.pubkey || (this.privkey ? this.privkey.publicKey : this.pubkey);
        this.sig = obj.sig || this.sig;
        this.k = obj.k || this.k;
        this.verified = obj.verified || this.verified;
        return this;
    }
    ;
    privkey2pubkey() {
        this.pubkey = this.privkey.toPublicKey();
    }
    ;
    calci() {
        for (var i = 0; i < 4; i++) {
            this.sig.i = i;
            var Qprime;
            try {
                Qprime = this.toPublicKey();
            }
            catch (e) {
                console.error(e);
                continue;
            }
            if (Qprime.point.eq(this.pubkey.point)) {
                this.sig.compressed = this.pubkey.compressed;
                return this;
            }
        }
        this.sig.i = undefined;
        throw new Error('Unable to find valid recovery factor');
    }
    ;
    static fromString(str) {
        var obj = JSON.parse(str);
        return new ECDSA(obj);
    }
    ;
    randomK() {
        var N = Point_1.Point.getN();
        var k;
        do {
            k = BN.Bn.fromBuffer(Random.getRandomBuffer(32));
        } while (!(k.lt(N) && k.gt(Constant.Zero)));
        this.k = k;
        return this;
    }
    ;
    // https://tools.ietf.org/html/rfc6979#section-3.2
    deterministicK(badrs) {
        /* jshint maxstatements: 25 */
        // if r or s were invalid when this function was used in signing,
        // we do not want to actually compute r, s here for efficiency, so,
        // we can increment badrs. explained at end of RFC 6979 section 3.2
        if (_.isUndefined(badrs)) {
            badrs = 0;
        }
        var v = Buffer.alloc(32);
        v.fill(0x01);
        var k = Buffer.alloc(32);
        k.fill(0x00);
        var x = this.privkey.bn.toBuffer({
            size: 32
        });
        var hashbuf = this.endian === 'little' ? BufferUtil.reverse(this.hashbuf) : this.hashbuf;
        k = Hash.sha256hmac(Buffer.concat([v, Buffer.from([0x00]), x, hashbuf]), k);
        v = Hash.sha256hmac(v, k);
        k = Hash.sha256hmac(Buffer.concat([v, Buffer.from([0x01]), x, hashbuf]), k);
        v = Hash.sha256hmac(v, k);
        v = Hash.sha256hmac(v, k);
        var T = BN.Bn.fromBuffer(v);
        var N = Point_1.Point.getN();
        // also explained in 3.2, we must ensure T is in the proper range (0, N)
        for (var i = 0; i < badrs || !(T.lt(N) && T.gt(Constant.Zero)); i++) {
            k = Hash.sha256hmac(Buffer.concat([v, Buffer.from([0x00])]), k);
            v = Hash.sha256hmac(v, k);
            v = Hash.sha256hmac(v, k);
            T = BN.Bn.fromBuffer(v);
        }
        this.k = T;
        return this;
    }
    ;
    // Information about public key recovery:
    // https://bitcointalk.org/index.php?topic=6430.0
    // http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
    toPublicKey() {
        /* jshint maxstatements: 25 */
        var i = this.sig.i;
        $.checkArgument(i === 0 || i === 1 || i === 2 || i === 3, new Error('i must be equal to 0, 1, 2, or 3'));
        var e = BN.Bn.fromBuffer(this.hashbuf);
        var r = this.sig.r;
        var s = this.sig.s;
        // A set LSB signifies that the y-coordinate is odd
        var isYOdd = i & 1;
        // The more significant bit specifies whether we should use the
        // first or second candidate key.
        var isSecondKey = i >> 1;
        var n = Point_1.Point.getN();
        var G = Point_1.Point.getG();
        // 1.1 Let x = r + jn
        var x = isSecondKey ? r.add(n) : r;
        var R = Point_1.Point.fromX(isYOdd, x);
        // 1.4 Check that nR is at infinity
        var nR = R.mul(n);
        if (!nR.isInfinity()) {
            throw new Error('nR is not a valid curve point');
        }
        // Compute -e from e
        var eNeg = e.neg().umod(n);
        // 1.6.1 Compute Q = r^-1 (sR - eG)
        // Q = r^-1 (sR + -eG)
        var rInv = r.invm(n);
        //var Q = R.multiplyTwo(s, G, eNeg).mul(rInv);
        var Q = R.mul(s).add(G.mul(eNeg)).mul(rInv);
        var pubkey = Publickey_1.PublicKey.fromPoint(Q, this.sig.compressed);
        return pubkey;
    }
    ;
    sigError() {
        /* jshint maxstatements: 25 */
        if (!BufferUtil.isBuffer(this.hashbuf) || this.hashbuf.length !== 32) {
            return 'hashbuf must be a 32 byte buffer';
        }
        var r = this.sig.r;
        var s = this.sig.s;
        if (!(r.gt(Constant.Zero) && r.lt(Point_1.Point.getN())) || !(s.gt(Constant.Zero) && s.lt(Point_1.Point.getN()))) {
            return 'r and s not in range';
        }
        var e = BN.Bn.fromBuffer(this.hashbuf, this.endian ? {
            endian: this.endian
        } : undefined);
        var n = Point_1.Point.getN();
        var sinv = s.invm(n);
        var u1 = sinv.mul(e).umod(n);
        var u2 = sinv.mul(r).umod(n);
        var p = Point_1.Point.getG().mulAdd(u1, this.pubkey.point, u2);
        if (p.isInfinity()) {
            return 'p is infinity';
        }
        if (p.getX().umod(n).cmp(r) !== 0) {
            return 'Invalid signature';
        }
        else {
            return false;
        }
    }
    ;
    static toLowS(s) {
        //enforce low s
        //see BIP 62, "low S values in signatures"
        if (s.gt(BN.Bn.fromBuffer(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
            s = Point_1.Point.getN().sub(s);
        }
        return s;
    }
    ;
    _findSignature(d, e) {
        var N = Point_1.Point.getN();
        var G = Point_1.Point.getG();
        // try different values of k until r, s are valid
        var badrs = 0;
        var k, Q, r, s;
        do {
            if (!this.k || badrs > 0) {
                this.deterministicK(badrs);
            }
            badrs++;
            k = this.k;
            Q = G.mul(k);
            r = Q.x.umod(N);
            s = k.invm(N).mul(e.add(d.mul(r))).umod(N);
        } while (r.cmp(Constant.Zero) <= 0 || s.cmp(Constant.Zero) <= 0);
        s = ECDSA.toLowS(s);
        let obj = {
            s: s,
            r: r
        };
        return obj;
    }
    ;
    sign() {
        var hashbuf = this.hashbuf;
        var privkey = this.privkey;
        var d = privkey.bn;
        $.checkState(hashbuf && privkey && d, new Error('invalid parameters'));
        $.checkState(BufferUtil.isBuffer(hashbuf) && hashbuf.length === 32, new Error('hashbuf must be a 32 byte buffer'));
        var e = BN.Bn.fromBuffer(hashbuf, this.endian ? {
            endian: this.endian
        } : undefined);
        var obj = this._findSignature(d, e);
        obj.compressed = this.pubkey.compressed;
        this.sig = new Signature_1.Signature(obj);
        return this;
    }
    ;
    signRandomK() {
        this.randomK();
        return this.sign();
    }
    ;
    toString() {
        var obj = {};
        if (this.hashbuf) {
            obj.hashbuf = this.hashbuf.toString('hex');
        }
        if (this.privkey) {
            obj.privkey = this.privkey.toString();
        }
        if (this.pubkey) {
            obj.pubkey = this.pubkey.toString();
        }
        if (this.sig) {
            obj.sig = this.sig.toString();
        }
        if (this.k) {
            obj.k = this.k.toString();
        }
        return JSON.stringify(obj);
    }
    ;
    verify() {
        if (!this.sigError()) {
            this.verified = true;
        }
        else {
            this.verified = false;
        }
        return this;
    }
    ;
    static sign(hashbuf, privkey, endian) {
        return new ECDSA().set({
            hashbuf: hashbuf,
            endian: endian,
            privkey: privkey
        }).sign().sig;
    }
    ;
    static verify(hashbuf, sig, pubkey, endian) {
        return new ECDSA().set({
            hashbuf: hashbuf,
            endian: endian,
            sig: sig,
            pubkey: pubkey
        }).verify().verified;
    }
    ;
}
exports.ECDSA = ECDSA;
//# sourceMappingURL=ECDSA.js.map