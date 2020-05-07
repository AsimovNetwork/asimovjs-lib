"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const BitcoreBuffer = require("../utils/BitcoreBuffer");
const JSUtil = require("../utils/Js");
const $ = require("../utils/Preconditions");
const Networks = require("./Networks");
const Hash = require("../utils/Hash");
const buffer_1 = require("buffer");
const Opcode_1 = require("./Opcode");
const Address_1 = require("./Address");
const Publickey_1 = require("./Publickey");
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const BufferReader_1 = require("../utils/encoding/BufferReader");
const Signature_1 = require("../utils/Signature");
const OP_RETURN_STANDARD_SIZE = 80;
class Script {
    constructor(from) {
        this.chunks = [];
        if (_.isUndefined(from)) {
            return;
        }
        if (BitcoreBuffer.isBuffer(from)) {
            return Script.fromBuffer(from);
        }
        else if (from instanceof Address_1.Address) {
            this.set(Script.fromAddress(from));
        }
        else if (from instanceof Script) {
            return Script.fromBuffer(from.toBuffer());
        }
        else if (JSUtil.isHexa(from)) {
            return Script.fromHex(from);
        }
        else if (_.isString(from)) {
            return Script.fromString(from);
        }
        else if (_.isObject(from) && _.isArray(from.chunks)) {
            this.set(from);
        }
    }
    set(obj) {
        $.checkArgument(_.isObject(obj));
        $.checkArgument(_.isArray(obj.chunks));
        this.chunks = obj.chunks;
        return this;
    }
    //TODO:if pushed buffer is 0x000000000000000
    //the chunks buf is empty buffer it should be the buffer filled with zero
    static fromASM(str) {
        var script = new Script();
        script.chunks = [];
        var tokens = str.split(' ');
        var i = 0;
        while (i < tokens.length) {
            var token = tokens[i];
            var opcode = new Opcode_1.Opcode(token);
            var opcodenum = opcode.toNumber();
            if (_.isUndefined(opcodenum)) {
                var buf = buffer_1.Buffer.from(tokens[i], 'hex');
                script.chunks.push({
                    buf: buf,
                    len: buf.length,
                    opcodenum: buf.length
                });
                i = i + 1;
            }
            else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA4) {
                script.chunks.push({
                    buf: buffer_1.Buffer.from(tokens[i + 2], 'hex'),
                    len: parseInt(tokens[i + 1]),
                    opcodenum: opcodenum
                });
                i = i + 3;
            }
            else {
                script.chunks.push({
                    opcodenum: opcodenum
                });
                i = i + 1;
            }
        }
        return script;
    }
    static fromBuffer(buffer) {
        var script = new Script();
        script.chunks = [];
        var br = new BufferReader_1.BufferReader(buffer);
        while (!br.finished()) {
            try {
                var opcodenum = br.readUInt8();
                var len, buf;
                if (opcodenum > 0 && opcodenum < Opcode_1.Opcode.map.OP_PUSHDATA1) {
                    len = opcodenum;
                    script.chunks.push({
                        buf: br.read(len),
                        len: len,
                        opcodenum: opcodenum
                    });
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1) {
                    len = br.readUInt8();
                    buf = br.read(len);
                    script.chunks.push({
                        buf: buf,
                        len: len,
                        opcodenum: opcodenum
                    });
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2) {
                    len = br.readUInt16LE();
                    buf = br.read(len);
                    script.chunks.push({
                        buf: buf,
                        len: len,
                        opcodenum: opcodenum
                    });
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA4) {
                    len = br.readUInt32LE();
                    buf = br.read(len);
                    script.chunks.push({
                        buf: buf,
                        len: len,
                        opcodenum: opcodenum
                    });
                }
                else {
                    script.chunks.push({
                        opcodenum: opcodenum
                    });
                }
            }
            catch (e) {
                if (e instanceof RangeError) {
                    throw Error('Invalid script buffer: can\'t parse valid script from given buffer ' + buffer.toString('hex'));
                }
                throw e;
            }
        }
        return script;
    }
    static fromString(str) {
        if (JSUtil.isHexa(str) || str.length === 0) {
            return new Script(new buffer_1.Buffer(str, 'hex'));
        }
        var script = new Script();
        script.chunks = [];
        var tokens = str.split(' ');
        var i = 0;
        while (i < tokens.length) {
            var token = tokens[i];
            var opcode = new Opcode_1.Opcode(token);
            var opcodenum = opcode.toNumber();
            if (_.isUndefined(opcodenum)) {
                opcodenum = parseInt(token);
                if (opcodenum > 0 && opcodenum < Opcode_1.Opcode.map.OP_PUSHDATA1) {
                    script.chunks.push({
                        buf: buffer_1.Buffer.from(tokens[i + 1].slice(2), 'hex'),
                        len: opcodenum,
                        opcodenum: opcodenum
                    });
                    i = i + 2;
                }
                else {
                    throw new Error('Invalid script: ' + JSON.stringify(str));
                }
            }
            else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA4) {
                if (tokens[i + 2].slice(0, 2) !== '0x') {
                    throw new Error('Pushdata data must start with 0x');
                }
                script.chunks.push({
                    buf: buffer_1.Buffer.from(tokens[i + 2].slice(2), 'hex'),
                    len: parseInt(tokens[i + 1]),
                    opcodenum: opcodenum
                });
                i = i + 3;
            }
            else {
                script.chunks.push({
                    opcodenum: opcodenum
                });
                i = i + 1;
            }
        }
        return script;
    }
    static fromHex(str) {
        var buf = BitcoreBuffer.hexToBuffer(str);
        return Script.fromBuffer(buf);
    }
    static fromAddress(address) {
        address = new Address_1.Address(address);
        if (address.isPayToScriptHash()) {
            return Script.buildPayToScriptHashScript(address);
        }
        else if (address.isPayToContractHash()) {
            return Script.buildPayToContractHashScript(address);
        }
        else if (address.isPayToPublicKeyHash()) {
            return Script.buildPayToPubKeyHashScript(address);
        }
        throw new Error('Expected argument ' + address + ' to be an address');
    }
    toBuffer() {
        var bw = new BufferWriter_1.BufferWriter();
        for (var i = 0; i < this.chunks.length; i++) {
            var chunk = this.chunks[i];
            var opcodenum = chunk.opcodenum;
            bw.writeUInt8(chunk.opcodenum);
            if (chunk.buf) {
                if (opcodenum < Opcode_1.Opcode.map.OP_PUSHDATA1) {
                    bw.write(chunk.buf);
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1) {
                    bw.writeUInt8(chunk.len);
                    bw.write(chunk.buf);
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2) {
                    bw.writeUInt16LE(chunk.len);
                    bw.write(chunk.buf);
                }
                else if (opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA4) {
                    bw.writeUInt32LE(chunk.len);
                    bw.write(chunk.buf);
                }
            }
        }
        return bw.concat();
    }
    static fromObject(obj) {
        return new Script(obj);
    }
    toASM() {
        var str = '';
        for (var i = 0; i < this.chunks.length; i++) {
            var chunk = this.chunks[i];
            str += this.chunkToString(chunk, 'asm');
        }
        return str.substr(1);
    }
    toString() {
        var str = '';
        for (var i = 0; i < this.chunks.length; i++) {
            var chunk = this.chunks[i];
            str += this.chunkToString(chunk);
        }
        return str.substr(1);
    }
    toHex() {
        return this.toBuffer().toString('hex');
    }
    inspect() {
        return '<Script: ' + this.toString() + '>';
    }
    chunkToString(chunk, type) {
        var opcodenum = chunk.opcodenum;
        var asm = (type === 'asm');
        var str = '';
        if (!chunk.buf) {
            // no data chunk
            if (typeof Opcode_1.Opcode.reverseMap[opcodenum] !== 'undefined') {
                if (asm) {
                    // A few cases where the opcode name differs from reverseMap
                    // aside from 1 to 16 data pushes.
                    if (opcodenum === 0) {
                        // OP_0 -> 0
                        str = str + ' 0';
                    }
                    else if (opcodenum === 79) {
                        // OP_1NEGATE -> 1
                        str = str + ' -1';
                    }
                    else {
                        str = str + ' ' + new Opcode_1.Opcode(opcodenum).toString();
                    }
                }
                else {
                    str = str + ' ' + new Opcode_1.Opcode(opcodenum).toString();
                }
            }
            else {
                var numstr = opcodenum.toString(16);
                if (numstr.length % 2 !== 0) {
                    numstr = '0' + numstr;
                }
                if (asm) {
                    str = str + ' ' + numstr;
                }
                else {
                    str = str + ' ' + '0x' + numstr;
                }
            }
        }
        else {
            // data chunk
            if (!asm && opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2 ||
                opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA4) {
                str = str + ' ' + new Opcode_1.Opcode(opcodenum).toString();
            }
            if (chunk.len > 0) {
                if (asm) {
                    str = str + ' ' + chunk.buf.toString('hex');
                }
                else {
                    str = str + ' ' + chunk.len + ' ' + '0x' + chunk.buf.toString('hex');
                }
            }
        }
        return str;
    }
    // high level script builder methods
    /**
     * @return {Script} an output script built from the address
     */
    static payToAddressScript(address) {
        address = new Address_1.Address(address);
        if (address.isPayToScriptHash()) {
            return Script.buildPayToScriptHashScript(address);
        }
        else if (address.isPayToPublicKeyHash()) {
            return Script.buildPayToPubKeyHashScript(address);
        }
        throw new Error('Expected argument ' + address + ' to be an address');
    }
    /**
     * @returns {Script} a new pay to public key output for the given
     *  public key
     */
    static buildPayToPubKeyScript(pubkey) {
        $.checkArgument(pubkey instanceof Publickey_1.PublicKey);
        var s = new Script();
        s.add(pubkey.toBuffer())
            .add(Opcode_1.Opcode.map.OP_CHECKSIG);
        return s;
    }
    /**
     * @returns {Script} a new pay to public key hash output for the given
     * address or public key
     * @param {(Address|PublicKey)} to - destination address or public key
     */
    static buildPayToPubKeyHashScript(to) {
        $.checkArgument(!_.isUndefined(to));
        $.checkArgument(to instanceof Publickey_1.PublicKey || to instanceof Address_1.Address || _.isString(to));
        let t;
        if (to instanceof Publickey_1.PublicKey) {
            t = new Address_1.Address(to);
        }
        else if (_.isString(to)) {
            t = new Address_1.Address(to);
        }
        else if (to instanceof Address_1.Address) {
            t = to;
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_DUP)
            .add(Opcode_1.Opcode.map.OP_HASH160)
            .add(t.toBuffer())
            .add(Opcode_1.Opcode.map.OP_IFLAG_EQUALVERIFY)
            .add(Opcode_1.Opcode.map.OP_CHECKSIG);
        s._network = t.network;
        return s;
    }
    /**
     * @param {Script|Address} script - the redeemScript for the new p2sh output.
     *    It can also be a p2sh address
     * @returns {Script} new pay to script hash script for given script
     */
    static buildPayToScriptHashScript(script) {
        $.checkArgument(script instanceof Script ||
            (script instanceof Address_1.Address && script.isPayToScriptHash()));
        let buf = script;
        if (script instanceof Address_1.Address) {
            buf = script.toBuffer();
        }
        else {
            let addr = new Address_1.Address(Hash.sha256ripemd160(script.toBuffer()));
            buf = addr.toBuffer();
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_HASH160)
            .add(buf)
            .add(Opcode_1.Opcode.map.OP_IFLAG_EQUAL);
        s._network = script._network || script.network;
        return s;
    }
    /**
     * @param {Address|String} address - the contract address
     * @returns {Script} new pay to contract hash script for given address
     */
    static buildPayToContractHashScript(address) {
        $.checkArgument(!_.isUndefined(address));
        $.checkArgument(address instanceof Address_1.Address || address instanceof Publickey_1.PublicKey || _.isString(address));
        let t;
        if (address instanceof Publickey_1.PublicKey) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (_.isString(address)) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (address instanceof Address_1.Address) {
            t = address;
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_CALL);
        s.add(t.toBuffer());
        s._network = t.network;
        return s;
    }
    /**
     * @param {Address|String} address - the template warehouse contract address
     * @returns {Script} new pay to contract hash script for given address
     */
    static buildCreateTemplateHashScript(address) {
        $.checkArgument(!_.isUndefined(address));
        $.checkArgument(address instanceof Address_1.Address || address instanceof Publickey_1.PublicKey || _.isString(address));
        let t;
        if (address instanceof Publickey_1.PublicKey) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (_.isString(address)) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (address instanceof Address_1.Address) {
            t = address;
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_TEMPLATE);
        s._network = t.network;
        return s;
    }
    /**
     * @param {Address|String} address - the template warehouse contract address
     * @returns {Script} new pay to contract hash script for given address
     */
    static buildCreateContractHashScript(address) {
        $.checkArgument(!_.isUndefined(address));
        $.checkArgument(address instanceof Address_1.Address || address instanceof Publickey_1.PublicKey || _.isString(address));
        let t;
        if (address instanceof Publickey_1.PublicKey) {
            t = new Address_1.Address(address);
        }
        else if (_.isString(address)) {
            t = new Address_1.Address(address);
        }
        else if (address instanceof Address_1.Address) {
            t = address;
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_CREATE);
        s._network = t.network;
        return s;
    }
    /**
     * @param {Address|String} address - the contract address
     * @returns {Script} new pay to contract hash script for given address
     */
    static buildVoteHashScript(address) {
        $.checkArgument(!_.isUndefined(address));
        $.checkArgument(address instanceof Address_1.Address || address instanceof Publickey_1.PublicKey || _.isString(address));
        let t;
        if (address instanceof Publickey_1.PublicKey) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (_.isString(address)) {
            let type = Address_1.Address.PayToContractHash;
            t = new Address_1.Address(address, type);
        }
        else if (address instanceof Address_1.Address) {
            t = address;
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_VOTE);
        s.add(t.toBuffer());
        s._network = t.network;
        return s;
    }
    /**
     * @returns {Script} a new OP_RETURN script with data
     * @param {(string|Buffer)} data - the data to embed in the output
     * @param {(string)} encoding - the type of encoding of the string
     */
    static buildDataScript(data, encoding) {
        $.checkArgument(_.isUndefined(data) || _.isString(data) || BitcoreBuffer.isBuffer(data));
        if (_.isString(data)) {
            data = new buffer_1.Buffer(data, encoding);
        }
        var s = new Script();
        s.add(Opcode_1.Opcode.map.OP_RETURN);
        if (!_.isUndefined(data)) {
            s.add(data);
        }
        return s;
    }
    /**
     * Builds a scriptSig (a script for an input) that signs a public key output script.
     *
     * @param {Signature|Buffer} signature - a Signature object, or the signature in DER canonical encoding
     * @param {number=} sigtype - the type of the signature (defaults to SIGHASH_ALL)
     */
    static buildPublicKeyIn(signature, sigtype) {
        $.checkArgument(signature instanceof Signature_1.Signature || BitcoreBuffer.isBuffer(signature));
        $.checkArgument(_.isUndefined(sigtype) || _.isNumber(sigtype));
        if (signature instanceof Signature_1.Signature) {
            signature = signature.toBuffer();
        }
        var script = new Script();
        script.add(BitcoreBuffer.concat([
            signature,
            BitcoreBuffer.integerAsSingleByteBuffer(sigtype || Signature_1.Signature.SIGHASH_ALL)
        ]));
        return script;
    }
    /**
     * Builds a scriptSig (a script for an input) that signs a public key hash
     * output script.
     *
     * @param {Buffer|string|PublicKey} publicKey
     * @param {Signature|Buffer} signature - a Signature object, or the signature in DER canonical encoding
     * @param {number=} sigtype - the type of the signature (defaults to SIGHASH_ALL)
     */
    static buildPublicKeyHashIn(publicKey, signature, sigtype) {
        $.checkArgument(signature instanceof Signature_1.Signature || BitcoreBuffer.isBuffer(signature));
        $.checkArgument(_.isUndefined(sigtype) || _.isNumber(sigtype));
        if (signature instanceof Signature_1.Signature) {
            signature = signature.toBuffer();
        }
        var script = new Script()
            .add(BitcoreBuffer.concat([
            signature,
            BitcoreBuffer.integerAsSingleByteBuffer(sigtype || Signature_1.Signature.SIGHASH_ALL)
        ]))
            .add(publicKey.toBuffer());
        return script;
    }
    /**
     * @returns {Script} a new Multisig output script for given public keys,
     * requiring m of those public keys to spend
     * @param {PublicKey[]} publicKeys - list of all public keys controlling the output
     * @param {number} threshold - amount of required signatures to spend the output
     * @param {Object=} opts - Several options:
     *        - noSorting: defaults to false, if true, don't sort the given
     *                      public keys before creating the script
     */
    static buildMultisigOut(publicKeys, threshold, opts = { noSorting: true }) {
        $.checkArgument(threshold <= publicKeys.length, 'Number of required signatures must be less than or equal to the number of public keys');
        opts = opts || {};
        var script = new Script();
        script.add(Opcode_1.Opcode.smallInt(threshold));
        // publicKeys = _.map(publicKeys, PublicKey);
        let keys = [];
        publicKeys.forEach(pbkey => {
            let eachPb = new Publickey_1.PublicKey(pbkey);
            keys.push(eachPb);
        });
        var sorted = keys;
        if (!opts.noSorting) {
            sorted = _.sortBy(publicKeys, function (publicKey) {
                return publicKey.toString('hex');
            });
        }
        for (var i = 0; i < sorted.length; i++) {
            var publicKey = sorted[i];
            script.add(publicKey.toBuffer());
        }
        script.add(Opcode_1.Opcode.smallInt(publicKeys.length));
        script.add(Opcode_1.Opcode.map.OP_CHECKMULTISIG);
        return script;
    }
    /**
     * A new Multisig input script for the given public keys, requiring m of those public keys to spend
     *
     * @param {PublicKey[]} pubkeys list of all public keys controlling the output
     * @param {number} threshold amount of required signatures to spend the output
     * @param {Array} signatures and array of signature buffers to append to the script
     * @param {Object=} opts
     * @param {boolean=} opts.noSorting don't sort the given public keys before creating the script (false by default)
     * @param {Script=} opts.cachedMultisig don't recalculate the redeemScript
     *
     * @returns {Script}
     */
    static buildMultisigIn(pubkeys, threshold, signatures, opts = {}) {
        $.checkArgument(_.isArray(pubkeys));
        $.checkArgument(_.isNumber(threshold));
        $.checkArgument(_.isArray(signatures));
        var s = new Script();
        //s.add(Opcode.map.OP_0);
        _.each(signatures, function (signature) {
            $.checkArgument(BitcoreBuffer.isBuffer(signature), 'Signatures must be an array of Buffers');
            // TODO: allow signatures to be an array of Signature objects
            s.add(signature);
        });
        return s;
    }
    /**
     * A new P2SH Multisig input script for the given public keys, requiring m of those public keys to spend
     *
     * @param {PublicKey[]} pubkeys list of all public keys controlling the output
     * @param {number} threshold amount of required signatures to spend the output
     * @param {Array} signatures and array of signature buffers to append to the script
     * @param {Object=} opts
     * @param {boolean=} opts.noSorting don't sort the given public keys before creating the script (false by default)
     * @param {Script=} opts.cachedMultisig don't recalculate the redeemScript
     *
     * @returns {Script}
     */
    static buildP2SHMultisigIn(pubkeys, threshold, signatures, opts) {
        $.checkArgument(_.isArray(pubkeys));
        $.checkArgument(_.isNumber(threshold));
        $.checkArgument(_.isArray(signatures));
        var s = new Script();
        //s.add(Opcode.map.OP_0);
        _.each(signatures, function (signature) {
            $.checkArgument(BitcoreBuffer.isBuffer(signature), 'Signatures must be an array of Buffers');
            // TODO: allow 5signatures to be an array of Signature objects
            s.add(signature);
        });
        s.add((opts && opts.cachedMultisig || Script.buildMultisigOut(pubkeys, threshold, opts)).toBuffer());
        return s;
    }
    // script classification methods
    /**
     * parse sig script to get signature , signatures,public key, public key hash or redeem script
     */
    getPublicKey() {
        $.checkState(this.isPublicKeyOut(), 'Can\'t retrieve PublicKey from a non-PK output');
        return this.chunks[0].buf;
    }
    getPublicKeyHash() {
        $.checkState(this.isPublicKeyHashOut(), 'Can\'t retrieve PublicKeyHash from a non-PKH output');
        return this.chunks[2].buf;
    }
    /**
     * Get multi sign public key threshold from multi sign out script or redeem script
     */
    getMultisigThreshold() {
        $.checkState(this.isMultisigOut(), 'Can\'t retrieve PublicKeyHash from a non-Miltisign output');
        if (Opcode_1.Opcode.isSmallIntOp(this.chunks[0].opcodenum)) {
            return this._decodeOP_N(this.chunks[0].opcodenum);
            //return Number(opcode.toString().replace('OP_', ''))
        }
        else {
            throw new TypeError('Threshold is not a int');
        }
    }
    /**
     * Get public keys from multi sign out script or redeem script
     */
    getMultisigPublicKeys() {
        let pubs = [];
        $.checkState(this.isMultisigOut(), 'Can\'t retrieve PublicKeyHash from a non-Miltisign output');
        this.chunks.slice(1, this.chunks.length - 2).every(function (obj) {
            if (obj.buf && BitcoreBuffer.isBuffer(obj.buf)) {
                pubs.push(obj.buf);
                return true;
            }
        });
        return pubs;
    }
    /**
     *  Get the redeem script from P2SH multi sign sign script
     */
    getRedeemScript() {
        let redeemScript;
        if (!this.isScriptHashIn() || this.chunks.length <= 1) {
            return new Script();
        }
        var redeemChunk = this.chunks[this.chunks.length - 1];
        var redeemBuf = redeemChunk.buf;
        if (!redeemBuf) {
            return new Script();
        }
        try {
            redeemScript = new Script(redeemBuf);
        }
        catch (e) {
            // if (e instanceof errors.Script.InvalidBuffer) {
            //   return new Script()
            // }
            throw e;
        }
        var type = redeemScript.classify();
        if (type == Script.types.UNKNOWN) {
            return new Script();
        }
        return redeemScript;
    }
    /**
     * Get signature from pay to public key hash sign script
     */
    getSignature() {
        if (this.isPublicKeyHashIn()) {
            let signatureBuf = this.chunks[0].buf;
            return Signature_1.Signature.fromTxFormat(signatureBuf);
        }
    }
    /**
     * Get signatures from P2SH multi sign sign script
     */
    getSignatures() {
        let signatures = [];
        if (this.isScriptHashIn()) {
            let redeemScript = this.getRedeemScript();
            let publickeys = redeemScript.getMultisigPublicKeys();
            let signs = new Array(publickeys.length);
            this.chunks.slice(0, this.chunks.length - 1).forEach((obj) => {
                if (obj.buf && BitcoreBuffer.isBuffer(obj.buf) && Signature_1.Signature.isTxDER(obj.buf)) {
                    signatures.push(Signature_1.Signature.fromTxFormat(obj.buf));
                }
            });
        }
        return signatures;
    }
    /**
     * @returns {boolean} if this is a pay to pubkey hash output script
     */
    isPublicKeyHashOut() {
        return !!(this.chunks.length === 5 &&
            this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_DUP &&
            this.chunks[1].opcodenum === Opcode_1.Opcode.map.OP_HASH160 &&
            this.chunks[2].buf &&
            this.chunks[2].buf.length === 21 &&
            this.chunks[3].opcodenum === Opcode_1.Opcode.map.OP_IFLAG_EQUALVERIFY &&
            this.chunks[4].opcodenum === Opcode_1.Opcode.map.OP_CHECKSIG);
    }
    /**
     * @returns {boolean} if this is a pay to public key hash input script
     */
    isPublicKeyHashIn() {
        if (this.chunks.length === 2) {
            var signatureBuf = this.chunks[0].buf;
            var pubkeyBuf = this.chunks[1].buf;
            if (signatureBuf &&
                signatureBuf.length &&
                signatureBuf[0] === 0x30 &&
                pubkeyBuf &&
                pubkeyBuf.length) {
                var version = pubkeyBuf[0];
                if ((version === 0x04 ||
                    version === 0x06 ||
                    version === 0x07) && pubkeyBuf.length === 65) {
                    return true;
                }
                else if ((version === 0x03 || version === 0x02) && pubkeyBuf.length === 33) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * @returns {boolean} if this is a public key output script
     */
    isPublicKeyOut() {
        if (this.chunks.length === 2 &&
            this.chunks[0].buf &&
            this.chunks[0].buf.length &&
            this.chunks[1].opcodenum === Opcode_1.Opcode.map.OP_CHECKSIG) {
            var pubkeyBuf = this.chunks[0].buf;
            var version = pubkeyBuf[0];
            var isVersion = false;
            if ((version === 0x04 ||
                version === 0x06 ||
                version === 0x07) && pubkeyBuf.length === 65) {
                isVersion = true;
            }
            else if ((version === 0x03 || version === 0x02) && pubkeyBuf.length === 33) {
                isVersion = true;
            }
            if (isVersion) {
                return Publickey_1.PublicKey.isValid(pubkeyBuf);
            }
        }
        return false;
    }
    /**
     * @returns {boolean} if this is a pay to public key input script
     */
    isPublicKeyIn() {
        if (this.chunks.length === 1) {
            var signatureBuf = this.chunks[0].buf;
            if (signatureBuf &&
                signatureBuf.length &&
                signatureBuf[0] === 0x30) {
                return true;
            }
        }
        return false;
    }
    /**
     * @returns {boolean} if this is a p2sh output script
     * eg:
     * P2SH Multisig script hash out
     * OP_HASH160 <HASH160(redeemScript)> OP_EQUAL
     *
     * script hash out
     * OP_HASH160 <script hash> OP_EQUAL
     */
    isScriptHashOut() {
        var buf = this.toBuffer();
        return (buf.length === 24 &&
            buf[0] === Opcode_1.Opcode.map.OP_HASH160 &&
            buf[1] === 0x15 &&
            buf[buf.length - 1] === Opcode_1.Opcode.map.OP_IFLAG_EQUAL);
    }
    /**
     * @returns {boolean} if this is a p2sh input script
     * Note that these are frequently indistinguishable from pubkeyhashin
     * eg:
     *
     * P2SH Multisig script hash in
     * <signature> <signature> 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
     *
     */
    isScriptHashIn() {
        if (this.chunks.length <= 1) {
            return false;
        }
        var redeemChunk = this.chunks[this.chunks.length - 1];
        var redeemBuf = redeemChunk.buf;
        if (!redeemBuf) {
            return false;
        }
        var redeemScript;
        try {
            redeemScript = new Script(redeemBuf);
        }
        catch (e) {
            // if (e instanceof errors.Script.InvalidBuffer) {
            //   return false;
            // }
            throw e;
        }
        var type = redeemScript.classify();
        return type !== Script.types.UNKNOWN;
    }
    /**
     * @returns {boolean} if this is a mutlsig output script
     */
    isMultisigOut() {
        return (this.chunks.length > 3 &&
            Opcode_1.Opcode.isSmallIntOp(this.chunks[0].opcodenum) &&
            this.chunks.slice(1, this.chunks.length - 2).every(function (obj) {
                return obj.buf && BitcoreBuffer.isBuffer(obj.buf);
            }) &&
            Opcode_1.Opcode.isSmallIntOp(this.chunks[this.chunks.length - 2].opcodenum) &&
            this.chunks[this.chunks.length - 1].opcodenum === Opcode_1.Opcode.map.OP_CHECKMULTISIG);
    }
    /**
     * @returns {boolean} if this is a multisig input script
     */
    isMultisigIn() {
        return this.chunks.length >= 2 &&
            this.chunks.slice(0, this.chunks.length).every(function (obj) {
                return obj.buf &&
                    BitcoreBuffer.isBuffer(obj.buf) &&
                    Signature_1.Signature.isTxDER(obj.buf);
            });
    }
    /**
     * @returns {boolean} true if this is a valid standard OP_RETURN output
     */
    //TODO:empty buffer judge
    isDataOut() {
        return this.chunks.length >= 1 &&
            this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_RETURN &&
            (this.chunks.length === 1 ||
                (this.chunks.length === 2 &&
                    this.chunks[1].buf &&
                    this.chunks[1].buf.length <= OP_RETURN_STANDARD_SIZE));
    }
    /**
     * output to invoke contract in asimov, can be type of `create`, `template`, `vote` and `call`
     */
    isCreateOut() {
        if (this.chunks.length === 1 && this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_CREATE) {
            return true;
        }
        else {
            return false;
        }
    }
    isTemplateOut() {
        if (this.chunks.length === 1 && this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_TEMPLATE) {
            return true;
        }
        else {
            return false;
        }
    }
    isVoteOut() {
        if (this.chunks.length === 2 && this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_VOTE) {
            return true;
        }
        else {
            return false;
        }
    }
    isCallOut() {
        if (this.chunks.length === 2 && this.chunks[0].opcodenum === Opcode_1.Opcode.map.OP_CALL) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Retrieve the associated data for this script.
     * In the case of a pay to public key hash or P2SH, return the hash.
     * In the case of a standard OP_RETURN, return the data
     * @returns {Buffer}
     */
    getData() {
        if (this.isDataOut() || this.isScriptHashOut()) {
            if (_.isUndefined(this.chunks[1])) {
                return new buffer_1.Buffer(0);
            }
            else {
                return new buffer_1.Buffer(this.chunks[1].buf);
            }
        }
        if (this.isPublicKeyHashOut()) {
            return new buffer_1.Buffer(this.chunks[2].buf);
        }
        throw new Error('Unrecognized script type to get data from');
    }
    /**
     * @returns {boolean} if the script is only composed of data pushing
     * opcodes or small int opcodes (OP_0, OP_1, ..., OP_16)
     */
    isPushOnly() {
        return _.every(this.chunks, function (chunk) {
            return chunk.opcodenum <= Opcode_1.Opcode.map.OP_16;
        });
    }
    /**
     * @returns {object} The Script type if it is a known form,
     * or Script.UNKNOWN if it isn't
     */
    //TODO:classify script type
    classify() {
        if (this._isInput) {
            return this.classifyInput();
        }
        else if (this._isOutput) {
            return this.classifyOutput();
        }
        else {
            var outputType = this.classifyOutput();
            return outputType != Script.types.UNKNOWN ? outputType : this.classifyInput();
        }
    }
    /**
     * @returns {object} The Script type if it is a known form,
     * or Script.UNKNOWN if it isn't
     */
    classifyOutput() {
        if (this.isPublicKeyOut()) {
            return Script.types.PUBKEY_OUT;
        }
        else if (this.isPublicKeyHashOut()) {
            return Script.types.PUBKEYHASH_OUT;
        }
        else if (this.isMultisigOut()) {
            return Script.types.MULTISIG_OUT;
        }
        else if (this.isScriptHashOut()) {
            return Script.types.SCRIPTHASH_OUT;
        }
        else if (this.isDataOut()) {
            return Script.types.DATA_OUT;
        }
        else if (this.isCreateOut()) {
            return Script.types.CREATE_OUT;
        }
        else if (this.isTemplateOut()) {
            return Script.types.TEMPLATE_OUT;
        }
        else if (this.isVoteOut()) {
            return Script.types.VOTE_OUT;
        }
        else if (this.isCallOut()) {
            return Script.types.CALL_OUT;
        }
        else {
            return Script.types.UNKNOWN;
        }
    }
    /**
     * @returns {object} The Script type if it is a known form,
     * or Script.UNKNOWN if it isn't
     */
    classifyInput() {
        if (this.isPublicKeyIn()) {
            return Script.types.PUBKEY_IN;
        }
        else if (this.isPublicKeyHashIn()) {
            return Script.types.PUBKEYHASH_IN;
        }
        else if (this.isMultisigIn()) {
            return Script.types.MULTISIG_IN;
        }
        else if (this.isScriptHashIn()) {
            return Script.types.SCRIPTHASH_IN;
        }
        else {
            return Script.types.UNKNOWN;
        }
    }
    /**
     * @returns {boolean} if script is one of the known types
     */
    isStandard() {
        // TODO: Add BIP62 compliance
        return this.classify() !== Script.types.UNKNOWN;
    }
    // Script construction methods
    /**
     * Adds a script element at the start of the script.
     * @param {*} obj a string, number, Opcode, Buffer, or object to add
     * @returns {Script} this script instance
     */
    prepend(obj) {
        this._addByType(obj, true);
        return this;
    }
    /**
     * Compares a script with another script
     */
    equals(script) {
        $.checkState(script instanceof Script, 'Must provide another script');
        if (this.chunks.length !== script.chunks.length) {
            return false;
        }
        var i;
        for (i = 0; i < this.chunks.length; i++) {
            if (BitcoreBuffer.isBuffer(this.chunks[i].buf) && !BitcoreBuffer.isBuffer(script.chunks[i].buf)) {
                return false;
            }
            if (BitcoreBuffer.isBuffer(this.chunks[i].buf) && !BitcoreBuffer.equals(this.chunks[i].buf, script.chunks[i].buf)) {
                return false;
            }
            else if (this.chunks[i].opcodenum !== script.chunks[i].opcodenum) {
                return false;
            }
        }
        return true;
    }
    /**
     * Adds a script element to the end of the script.
     *
     * @param {*} obj a string, number, Opcode, Buffer, or object to add
     * @returns {Script} this script instance
     *
     */
    add(obj) {
        this._addByType(obj, false);
        return this;
    }
    _addByType(obj, prepend) {
        if (typeof obj === 'string') {
            this._addOpcode(obj, prepend);
        }
        else if (typeof obj === 'number') {
            this._addOpcode(obj, prepend);
        }
        else if (obj instanceof Opcode_1.Opcode) {
            this._addOpcode(obj, prepend);
        }
        else if (BitcoreBuffer.isBuffer(obj)) {
            this._addBuffer(obj, prepend);
        }
        else if (obj instanceof Script) {
            this.chunks = this.chunks.concat(obj.chunks);
        }
        else if (typeof obj === 'object') {
            this._insertAtPosition(obj, prepend);
        }
        else {
            throw new Error('Invalid script chunk');
        }
    }
    _insertAtPosition(op, prepend) {
        if (prepend) {
            this.chunks.unshift(op);
        }
        else {
            this.chunks.push(op);
        }
    }
    _addOpcode(opcode, prepend) {
        var op;
        if (typeof opcode === 'number') {
            op = opcode;
        }
        else if (opcode instanceof Opcode_1.Opcode) {
            op = opcode.toNumber();
        }
        else {
            op = new Opcode_1.Opcode(opcode).toNumber();
        }
        this._insertAtPosition({
            opcodenum: op
        }, prepend);
        return this;
    }
    _addBuffer(buf, prepend) {
        var opcodenum;
        var len = buf.length;
        if (len >= 0 && len < Opcode_1.Opcode.map.OP_PUSHDATA1) {
            opcodenum = len;
        }
        else if (len < Math.pow(2, 8)) {
            opcodenum = Opcode_1.Opcode.map.OP_PUSHDATA1;
        }
        else if (len < Math.pow(2, 16)) {
            opcodenum = Opcode_1.Opcode.map.OP_PUSHDATA2;
        }
        else if (len < Math.pow(2, 32)) {
            opcodenum = Opcode_1.Opcode.map.OP_PUSHDATA4;
        }
        else {
            throw new Error('You can\'t push that much data');
        }
        this._insertAtPosition({
            buf: buf,
            len: len,
            opcodenum: opcodenum
        }, prepend);
        return this;
    }
    removeCodeseparators() {
        var chunks = [];
        for (var i = 0; i < this.chunks.length; i++) {
            if (this.chunks[i].opcodenum !== Opcode_1.Opcode.map.OP_CODESEPARATOR) {
                chunks.push(this.chunks[i]);
            }
        }
        this.chunks = chunks;
        return this;
    }
    /**
     * @returns {Script} an empty script
     */
    static empty() {
        return new Script();
    }
    /**
     * @returns {Script} a new pay to script hash script that pays to this script
     */
    toScriptHashOut() {
        return Script.buildPayToScriptHashScript(this);
    }
    /**
     * Will return the associated address information object
     * @return {Address|boolean}
     */
    getAddressInfo() {
        if (this._isInput) {
            return this._getInputAddressInfo();
        }
        else if (this._isOutput) {
            return this._getOutputAddressInfo();
        }
        else {
            var info = this._getOutputAddressInfo();
            if (!info || _.isEmpty(info)) {
                return this._getInputAddressInfo();
            }
            return info;
        }
    }
    /**
     * Will return the associated output scriptPubKey address information object
     * @return {Address|boolean}
     * @private
     */
    _getOutputAddressInfo() {
        let info = {};
        if (this.isScriptHashOut()) {
            info.hashBuffer = this.getData();
            info.type = Address_1.Address.PayToScriptHash;
        }
        else if (this.isPublicKeyHashOut()) {
            info.hashBuffer = this.getData();
            info.type = Address_1.Address.PayToPublicKeyHash;
        }
        return info;
    }
    /**
     * Will return the associated input scriptSig address information object
     * @return {Address|boolean}
     * @private
     */
    _getInputAddressInfo() {
        var info = {};
        if (this.isPublicKeyHashIn()) {
            // hash the publickey found in the scriptSig
            info.hashBuffer = Hash.sha256ripemd160(this.chunks[1].buf);
            info.type = Address_1.Address.PayToPublicKeyHash;
        }
        else if (this.isScriptHashIn()) {
            // hash the redeemscript found at the end of the scriptSig
            info.hashBuffer = Hash.sha256ripemd160(this.chunks[this.chunks.length - 1].buf);
            info.type = Address_1.Address.PayToScriptHash;
        }
        return info;
    }
    /**
     * @param {Network=} network
     * @return {Address|boolean} the associated address for this script if possible, or false
     */
    toAddress(network) {
        var info = this.getAddressInfo();
        if (_.isEmpty(info)) {
            return false;
        }
        info.network = Networks.get(network) || this._network || Networks.defaultNetwork;
        return new Address_1.Address(info);
    }
    /**
     * Analogous to bitcoind's FindAndDelete. Find and delete equivalent chunks,
     * typically used with push data chunks.  Note that this will find and delete
     * not just the same data, but the same data with the same push data op as
     * produced by default. i.e., if a pushdata in a tx does not use the minimal
     * pushdata op, then when you try to remove the data it is pushing, it will not
     * be removed, because they do not use the same pushdata op.
     */
    findAndDelete(script) {
        var buf = script.toBuffer();
        var hex = buf.toString('hex');
        for (var i = 0; i < this.chunks.length; i++) {
            var script2 = new Script({
                chunks: [this.chunks[i]]
            });
            var buf2 = script2.toBuffer();
            var hex2 = buf2.toString('hex');
            if (hex === hex2) {
                this.chunks.splice(i, 1);
            }
        }
        return this;
    }
    /**
     * Comes from bitcoind's script interpreter CheckMinimalPush function
     * @returns {boolean} if the chunk {i} is the smallest way to push that particular data.
     */
    checkMinimalPush(i) {
        var chunk = this.chunks[i];
        var buf = chunk.buf;
        var opcodenum = chunk.opcodenum;
        if (!buf) {
            return true;
        }
        if (buf.length === 0) {
            // Could have used OP_0.
            return opcodenum === Opcode_1.Opcode.map.OP_0;
        }
        else if (buf.length === 1 && buf[0] >= 1 && buf[0] <= 16) {
            // Could have used OP_1 .. OP_16.
            return opcodenum === Opcode_1.Opcode.map.OP_1 + (buf[0] - 1);
        }
        else if (buf.length === 1 && buf[0] === 0x81) {
            // Could have used OP_1NEGATE
            return opcodenum === Opcode_1.Opcode.map.OP_1NEGATE;
        }
        else if (buf.length <= 75) {
            // Could have used a direct push (opcode indicating number of bytes pushed + those bytes).
            return opcodenum === buf.length;
        }
        else if (buf.length <= 255) {
            // Could have used OP_PUSHDATA.
            return opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA1;
        }
        else if (buf.length <= 65535) {
            // Could have used OP_PUSHDATA2.
            return opcodenum === Opcode_1.Opcode.map.OP_PUSHDATA2;
        }
        return true;
    }
    /**
     * Comes from bitcoind's script DecodeOP_N function
     * @param {number} opcode
     * @returns {number} numeric value in range of 0 to 16
     */
    _decodeOP_N(opcode) {
        if (opcode === Opcode_1.Opcode.map.OP_0) {
            return 0;
        }
        else if (opcode >= Opcode_1.Opcode.map.OP_1 && opcode <= Opcode_1.Opcode.map.OP_16) {
            return opcode - (Opcode_1.Opcode.map.OP_1 - 1);
        }
        else {
            throw new Error('Invalid opcode: ' + JSON.stringify(opcode));
        }
    }
    /**
     * Comes from bitcoind's script GetSigOpCount(boolean) function
     * @param {boolean} use current (true) or pre-version-0.6 (false) logic
     * @returns {number} number of signature operations required by this script
     */
    getSignatureOperationsCount(accurate) {
        accurate = (_.isUndefined(accurate) ? true : accurate);
        var self = this;
        var n = 0;
        var lastOpcode = Opcode_1.Opcode.map.OP_INVALIDOPCODE;
        _.each(self.chunks, function getChunk(chunk) {
            var opcode = chunk.opcodenum;
            if (opcode == Opcode_1.Opcode.map.OP_CHECKSIG || opcode == Opcode_1.Opcode.map.OP_CHECKSIGVERIFY) {
                n++;
            }
            else if (opcode == Opcode_1.Opcode.map.OP_CHECKMULTISIG || opcode == Opcode_1.Opcode.map.OP_CHECKMULTISIGVERIFY) {
                if (accurate && lastOpcode >= Opcode_1.Opcode.map.OP_1 && lastOpcode <= Opcode_1.Opcode.map.OP_16) {
                    n += self._decodeOP_N(lastOpcode);
                }
                else {
                    n += 20;
                }
            }
            lastOpcode = opcode;
        });
        return n;
    }
}
exports.Script = Script;
Script.types = {
    UNKNOWN: 'Unknown',
    PUBKEY_OUT: 'Pay to public key',
    PUBKEY_IN: 'Spend from public key',
    PUBKEYHASH_OUT: 'Pay to public key hash',
    PUBKEYHASH_IN: 'Spend from public key hash',
    SCRIPTHASH_OUT: 'Pay to script hash',
    SCRIPTHASH_IN: 'Spend from script hash',
    MULTISIG_OUT: 'Pay to multisig',
    MULTISIG_IN: 'Spend from multisig',
    DATA_OUT: 'Data push',
    CREATE_OUT: 'Create contract',
    TEMPLATE_OUT: 'Submit template',
    VOTE_OUT: 'Vote',
    CALL_OUT: 'CALL contract'
};
/**
 *isPublicKeyOut
 *isPublicKeyHashOut
 *isMultisigOut
 *isScriptHashOut
 *isDataOut
 *isCreateOut
 *isTemplateOut
 *isVoteOut
 *isCallOut
 */
Script.outputIdentifiers = {
    PUBKEY_OUT: "publickkey",
    PUBKEYHASH_OUT: "publickkeyhash",
    MULTISIG_OUT: "multisig",
    SCRIPTHASH_OUT: "scripthash",
    DATA_OUT: "data",
    CREATE_OUT: 'create',
    TEMPLATE_OUT: 'template',
    VOTE_OUT: 'vote',
    CALL_OUT: 'call'
};
/**
 *isPublicKeyIn
 *isPublicKeyHashIn
 *isMultisigIn
 *isScriptHashIn
 */
Script.inputIdentifiers = {
    PUBKEY_IN: "publickkey",
    PUBKEYHASH_IN: "publickkeyhash",
    MULTISIG_IN: "multisig",
    SCRIPTHASH_IN: "scripthash"
};
//# sourceMappingURL=Script.js.map