"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const $ = require("../utils/Preconditions");
const BitcoreBuffer = require("../utils/BitcoreBuffer");
const JSUtil = require("../utils/Js");
const buffer_1 = require("buffer");
const Output_1 = require("./Output");
const Script_1 = require("./Script");
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const SignHash_1 = require("./SignHash");
const Bn_1 = require("../utils/Bn");
const MAXINT = 0xffffffff; //s Math.pow(2, 32) - 1;
const DEFAULT_RBF_SEQNUMBER = MAXINT - 2;
const DEFAULT_SEQNUMBER = MAXINT;
const DEFAULT_LOCKTIME_SEQNUMBER = MAXINT - 1;
class Input {
    constructor(params) {
        let prevTxId;
        if (_.isString(params.txid) && JSUtil.isHexa(params.txid)) {
            this.prevTxId = params.txid; // util.buffer.hexToBuffer(params.txid); // new Buffer(params.txid, 'hex');
        }
        else if (_.isUndefined(params.txid)) {
            throw new Error("Previous transaction id is required when create input");
        }
        else {
            this.prevTxId = params.txid;
        }
        this.vout = params.vout;
        if (!params.prevOut) {
            let config = {};
            if (params.address || params.scriptPubKey || params.scriptPubKeyBuffer) {
                let pkScript = params.scriptPubKey || (params.scriptPubKeyBuffer && params.scriptPubKeyBuffer.toString('hex'));
                config.address = params.address;
                config.pkScript = pkScript;
            }
            if (params.assets) {
                $.checkArgument(_.isString(params.assets), "input asset type is incorrect");
                config.assets = params.assets;
            }
            if (params.amount !== undefined) {
                $.checkArgument(_.isString(params.amount) || _.isNumber(params.amount) || (params.amount instanceof Bn_1.Bn), "input amount is incorrect");
                config.amount = params.amount;
            }
            this.output = new Output_1.Output(config);
        }
        else if (params.prevOut instanceof Output_1.Output) {
            this.output = params.prevOut;
        }
        else {
            this.output = new Output_1.Output(params.prevOut);
        }
        this.sequence = _.isUndefined(params.sequence) ? DEFAULT_SEQNUMBER : params.sequence;
        if (params.scriptPubKey || params.scriptPubKeyBuffer) {
            this.setScript(params.scriptPubKeyBuffer || params.scriptPubKey);
        }
        if (params.redeemScript || params.redeemScriptBuffer) {
            this.redeemScript = params.redeemScript || params.redeemScriptBuffer;
        }
        if (params.sigScript || params.sigScriptBuffer) {
            this.setSigScript(params.sigScript || params.sigScriptBuffer);
        }
        return this;
    }
    get redeemScript() {
        return this._redeemScript;
    }
    set redeemScript(script) {
        if (script instanceof Script_1.Script) {
            this._redeemScript = script;
        }
        else if (_.isString(script)) {
            this._redeemScript = new Script_1.Script(script);
        }
        else if (BitcoreBuffer.isBuffer(script)) {
            this._redeemScript = new Script_1.Script(script);
        }
        this.initSignatures();
    }
    getScript() {
        if (this.isNull()) {
            return null;
        }
        if (!this._script) {
            this._script = new Script_1.Script(this._scriptPubKeyBuffer);
            this._script._isInput = true;
        }
        return this._script;
    }
    /**
     * Set unlock script and script buffer of input.
     * @param {any} script instance, hex string or buffer of unlock script.
     */
    setScript(script) {
        this._script = null;
        if (script instanceof Script_1.Script) {
            this._script = script;
            this._script._isInput = true;
            this._scriptPubKeyBuffer = script.toBuffer();
        }
        else if (JSUtil.isHexa(script)) {
            // hex string script
            this._scriptPubKeyBuffer = new buffer_1.Buffer(script, 'hex');
            this._script = new Script_1.Script(this._scriptPubKeyBuffer);
        }
        else if (_.isString(script)) {
            // human readable string script
            this._script = new Script_1.Script(script);
            this._script._isInput = true;
            this._scriptPubKeyBuffer = this._script.toBuffer();
        }
        else if (BitcoreBuffer.isBuffer(script)) {
            this._script = new Script_1.Script(script);
            this._script._isInput = true;
            // buffer script
            this._scriptPubKeyBuffer = new buffer_1.Buffer(script);
        }
        else {
            throw new TypeError('Invalid argument type: script');
        }
        this.output.pkScript = this._script;
        this.initSignatures();
        return this;
    }
    initSignatures() {
        let script;
        if (this._script.isMultisigOut()) {
            script = this._script;
        }
        else if (this._script.isScriptHashOut() && this._redeemScript) {
            script = this._redeemScript;
        }
        else {
            return;
        }
        let publickeys = script.getMultisigPublicKeys();
        this.signatures = new Array(publickeys.length);
    }
    addSignature(signature, index) {
        this.signatures[index] = signature;
    }
    //TODO:update sigScript?
    /**
     * Set signatures of input.
     * @param {Signature} signature - [description]
     */
    setSignatures(signatures) {
        this.signatures = signatures;
    }
    /**
     * Get signatures of signed input.
     * @returns {Signature} signature
     */
    getSignatures() {
        return this.signatures;
    }
    setSignature(signature) {
        this.signature = signature;
    }
    getSignature() {
        return this.signature;
    }
    //TODO:update signatures?
    /**
     * Set sign script of input
     * @param {Script | Buffer | string} script - Script instance,buffer or string of sign script.
     */
    setSigScript(script) {
        if (script instanceof Script_1.Script) {
            this._sigScript = script;
        }
        else if (_.isString(script)) {
            this._sigScript = new Script_1.Script(script);
        }
        else if (BitcoreBuffer.isBuffer(script)) {
            this._sigScript = new Script_1.Script(script);
        }
    }
    /**
     * Get sign script.
     * @param {Script} script Script instance of sign script.
     */
    getSigScript(script) {
        return this._sigScript;
    }
    /**
     * Get previous output which UTXO refers to.
     * @returns Output
     */
    getPrevOut() {
        return this.output;
    }
    /**
     * Set previous output which UTXO refers to.
     * @param {Output} prevOut Output instance.
     */
    setPrevOut(prevOut) {
        this.output = prevOut;
    }
    /**
     * @returns {Object} A plain object with the input information.
     */
    toObject() {
        let obj = {
            txid: this.prevTxId,
            vout: this.vout,
            sequence: this.sequence
        };
        if (this._scriptPubKeyBuffer) {
            obj.scriptPubKey = this._scriptPubKeyBuffer.toString('hex');
        }
        // add human readable form if input contains valid script
        if (this._sigScript) {
            obj.sigScript = this._sigScript.toBuffer().toString('hex');
        }
        if (this.output) {
            obj.prevOut = this.output.toObject();
        }
        return obj;
    }
    /**
     * @returns {Object} A json formate data with input information.
     */
    toJSON() {
        return this.toObject();
    }
    /**
     * Buffer of input which only contains unlock script other than
     * the sign script.(it is usually used to generate unsigned transaction hex)
     *
     * @returns {BufferWriter} Buffer writer
     */
    toUnsignBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        writer.write(BitcoreBuffer.hexToBuffer(this.prevTxId));
        writer.writeUInt32LE(this.vout);
        if (this.redeemScript) {
            let script = this.redeemScript;
            //unsigned  P2SH multisig transaction
            let buf = script.toBuffer();
            writer.writeVarintNum(buf.length);
            writer.write(buf);
        }
        else if (this._scriptPubKeyBuffer) {
            //unsigned P2PH transaction
            writer.writeVarintNum(this._scriptPubKeyBuffer.length);
            writer.write(this._scriptPubKeyBuffer);
        }
        else {
            writer.writeVarintNum(0);
        }
        writer.writeUInt32LE(this.sequence);
        return writer;
    }
    /**
     * Buffer of input.
     *
     * @returns {BufferWriter} Buffer writer
     */
    toBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        writer.write(BitcoreBuffer.hexToBuffer(this.prevTxId));
        writer.writeUInt32LE(this.vout);
        if (this._sigScript) {
            let buf = this._sigScript.toBuffer();
            writer.writeVarintNum(buf.length);
            writer.write(buf);
        }
        else {
            writer.writeVarintNum(0);
        }
        writer.writeUInt32LE(this.sequence);
        return writer;
    }
    /**
     * Check if signature is valid.
     *
     * @param {[type]} transaction - transaction instance
     * @param {[type]} signature - signature instance
     */
    isValidSignature(transaction, signature) {
        // FIXME: Refactor signature so this is not necessary
        signature.signature.nhashtype = signature.sigtype;
        return SignHash_1.SignHash.verify(transaction, signature.signature, signature.publicKey, signature.inputIndex, this.output.pkScript);
    }
    /**
     * @returns true if this is a coinbase input (represents no input)
     */
    isNull() {
        return this.prevTxId === '0000000000000000000000000000000000000000000000000000000000000000' &&
            this.vout === 0xffffffff;
    }
    /**
     * Estimate buffer size of input
     *
     * @returns {number}
     */
    estimateSize() {
        return this.toBufferWriter().toBuffer().length;
    }
    /**
     * Judge whether the input is fully signed
     */
    isFullySigned() {
        if (this._sigScript.isPublicKeyHashIn() || this._sigScript.isPublicKeyIn()) {
            return !!this.getSignature();
        }
        else if (this._sigScript.isScriptHashIn()) {
            let redeemScript = this._sigScript.getRedeemScript();
            let threshold = redeemScript.getMultisigThreshold();
            let signatures = this.getSignatures();
            return signatures.length == threshold;
        }
    }
    /**
     * Generate input from object.
     *
     * @param {[type]} obj - A plain object with input config information
     * @returns {Input} Input instance
     */
    static fromObject(obj) {
        $.checkArgument(_.isObject(obj));
        let input = new Input(obj);
        return input;
    }
    /**
     * Generate input from buffer
     *
     * @param {BufferReader} reader [description]
     * @returns {Input} Input instance
     */
    static fromBufferReader(reader) {
        let txid = BitcoreBuffer.bufferToHex(reader.read(32));
        let vout = reader.readUInt32LE();
        let scriptLen = reader.readVarintNum();
        let scriptBuffer;
        let config = {
            txid: txid,
            vout: vout
        };
        if (scriptLen !== 0) {
            let buf = reader.read(scriptLen);
            let script = new Script_1.Script(buf);
            if (script.isPublicKeyHashOut()) {
                //P2PK output
                config.scriptPubKey = script;
            }
            else if (script.isPublicKeyHashIn()) {
                //P2PK input
                config.sigScript = script;
            }
            else if (script.isScriptHashIn()) {
                //P2SH input
                config.redeemScript = script.getRedeemScript();
                config.sigScript = script;
                config.scriptPubKey = config.redeemScript.toScriptHashOut();
            }
            else if (script.isMultisigOut()) {
                //m-n multisig
                config.redeemScript = script;
                config.scriptPubKey = config.redeemScript.toScriptHashOut();
            }
            else {
                throw new Error('Script does not match any type of script');
            }
        }
        config.sequence = reader.readUInt32LE();
        let input = new Input(config);
        return input;
    }
}
exports.Input = Input;
Input.MAXINT = MAXINT;
Input.DEFAULT_SEQNUMBER = DEFAULT_SEQNUMBER;
Input.DEFAULT_LOCKTIME_SEQNUMBER = DEFAULT_LOCKTIME_SEQNUMBER;
Input.DEFAULT_RBF_SEQNUMBER = DEFAULT_RBF_SEQNUMBER;
//# sourceMappingURL=Input.js.map