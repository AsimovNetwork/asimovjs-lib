"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Signature = require("../utils/Signature");
const Hash = require("../utils/Hash");
const BitcoreBuffer = require("../utils/BitcoreBuffer");
const $ = require("../utils/Preconditions");
const Input_1 = require("./Input");
const Output_1 = require("./Output");
const TxContract_1 = require("./TxContract");
const SignHash_1 = require("./SignHash");
const Constant_1 = require("../Constant");
const Script_1 = require("./Script");
const Privatekey_1 = require("./Privatekey");
const Publickey_1 = require("./Publickey");
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const BufferReader_1 = require("../utils/encoding/BufferReader");
class Transaction {
    constructor(config) {
        this.config = config;
        this.inputs = [];
        this.outputs = [];
        this.version = Constant_1.TRANSACTION.DEFAULT_VERSION;
        this.lockTime = Constant_1.TRANSACTION.DEFAULT_LOCK_TIME;
        $.checkArgument(config.inputs && config.inputs.length, "Input length is 0");
        $.checkArgument(config.outputs && config.outputs.length, "Output length is 0");
        //inputs
        config.inputs.forEach(i => {
            if (i instanceof Input_1.Input) {
                this.inputs.push(_.cloneDeep(i));
            }
            else {
                this.inputs.push(new Input_1.Input(i));
            }
        });
        //outputs
        config.outputs.forEach(i => {
            if (i instanceof Output_1.Output) {
                this.outputs.push(_.cloneDeep(i));
            }
            else {
                this.outputs.push(new Output_1.Output(i));
            }
        });
        //gas limit
        let txContractConfig = {
            gasLimit: config.gasLimit
        };
        this.txContract = new TxContract_1.TxContract(txContractConfig);
        if (!_.isUndefined(config.lockTime)) {
            this.lockTime = config.lockTime;
        }
        if (!_.isUndefined(config.version) && _.isNumber(config.version)) {
            this.version = config.version;
        }
    }
    // Version 4 bytes + TxType 4 bytes + Serialized varint size for the
    // number of transaction inputs and outputs.
    toBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        //Version 4 bytes
        writer.writeInt32LE(this.version);
        writer.writeVarintNum(this.inputs.length);
        _.each(this.inputs, function (input) {
            input.toBufferWriter(writer);
        });
        writer.writeVarintNum(this.outputs.length);
        _.each(this.outputs, function (output) {
            output.toBufferWriter(writer);
        });
        //gasLimit 4 bytes
        this.txContract.toBufferWriter(writer);
        //LockTime 4 bytes
        writer.writeUInt32LE(this.lockTime);
        return writer;
    }
    toUnsignBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        //Version 4 bytes
        writer.writeInt32LE(this.version);
        writer.writeVarintNum(this.inputs.length);
        _.each(this.inputs, function (input) {
            input.toUnsignBufferWriter(writer);
        });
        writer.writeVarintNum(this.outputs.length);
        _.each(this.outputs, function (output) {
            output.toBufferWriter(writer);
        });
        //gasLimit 4 bytes
        this.txContract.toBufferWriter(writer);
        //LockTime 4 bytes
        writer.writeUInt32LE(this.lockTime);
        return writer;
    }
    toBuffer() {
        var writer = new BufferWriter_1.BufferWriter();
        return this.toBufferWriter(writer).toBuffer();
    }
    toUnsignBuffer() {
        var writer = new BufferWriter_1.BufferWriter();
        return this.toUnsignBufferWriter(writer).toBuffer();
    }
    toHex() {
        return this.toBuffer().toString('hex');
    }
    toUnsignHex() {
        return this.toUnsignBuffer().toString('hex');
    }
    isCoinbase() {
        return (this.inputs.length === 1 && this.inputs[0].isNull());
    }
    getHashKeyMap(privateKey) {
        let hashKeyMap = {};
        if (_.isArray(privateKey)) {
            _.each(privateKey, (p) => {
                let privKey;
                if (p instanceof Privatekey_1.PrivateKey) {
                    privKey = p;
                }
                else {
                    p = p.replace('0x', '');
                    privKey = new Privatekey_1.PrivateKey(p);
                }
                let hashDataBuffer = Hash.sha256ripemd160(privKey.publicKey.toBuffer());
                let hashDataHex = BitcoreBuffer.bufferToHex(hashDataBuffer);
                hashKeyMap[hashDataHex] = privKey;
            });
        }
        else {
            let privKey;
            if (privateKey instanceof Privatekey_1.PrivateKey) {
                privKey = privateKey;
            }
            else {
                privKey = new Privatekey_1.PrivateKey(privateKey);
            }
            let hashDataBuffer = Hash.sha256ripemd160(privKey.publicKey.toBuffer());
            let hashDataHex = BitcoreBuffer.bufferToHex(hashDataBuffer);
            hashKeyMap[hashDataHex] = privKey;
        }
        return hashKeyMap;
    }
    sign(privateKey, sigtype = Signature.Signature.SIGHASH_ALL) {
        let hashKeyMap = this.getHashKeyMap(privateKey);
        _.each(this.inputs, (input, index) => {
            if (input._script.isScriptHashOut()) {
                this.signP2SHMultisigScript(hashKeyMap, sigtype, input, index);
            }
            else if (input._script.isMultisigOut()) {
                this.signMultisigScript(hashKeyMap, sigtype, input, index);
            }
            else {
                this.signPayToPublickeyHash(hashKeyMap, sigtype, input, index);
            }
        });
        return this;
    }
    signPayToPublickeyHash(hashKeyMap, sigtype, input, index) {
        let signature, sigScript;
        let pubKeyHashBuffer = input.output.pkScript.getPublicKeyHash();
        let hashDataHex = BitcoreBuffer.bufferToHex(pubKeyHashBuffer.slice(1));
        let privateKey = hashKeyMap[hashDataHex];
        if (privateKey) {
            signature = SignHash_1.SignHash.sign(this, privateKey, sigtype, index, input._script);
            sigScript = Script_1.Script.buildPublicKeyHashIn(privateKey.publicKey, signature, sigtype);
        }
        else {
            throw Error("input #" + index + " do not have matched private key");
        }
        input.setSignature(signature);
        input.setSigScript(sigScript);
        return sigScript;
    }
    signP2SHMultisigScript(hashKeyMap, sigtype, input, index) {
        let publickeys = input.redeemScript.getMultisigPublicKeys();
        let threshold = input.redeemScript.getMultisigThreshold();
        let signatures = input.getSignatures();
        let sigScript = input.getSigScript();
        if (!_.isNumber(threshold)) {
            throw Error('threshold is not a number');
        }
        let otherSignatures = sigScript && sigScript.getSignatures() || [];
        /**
         * Add signatures in sign script
         */
        if (otherSignatures.length) {
            otherSignatures.forEach(signature => {
                publickeys.forEach((pubkey, signatureIndex) => {
                    let publickey = new Publickey_1.PublicKey(pubkey);
                    if (SignHash_1.SignHash.verify(this, signature, publickey, index, input.redeemScript)) {
                        signatures[signatureIndex] = signature;
                    }
                });
            });
        }
        publickeys.forEach((pubkey, signatureIndex) => {
            let pubkeyHex = Hash.sha256ripemd160(pubkey).toString('hex');
            if (hashKeyMap[pubkeyHex]) {
                signatures[signatureIndex] = SignHash_1.SignHash.sign(this, hashKeyMap[pubkeyHex], sigtype, index, input.redeemScript);
            }
        });
        let bufs = [];
        signatures.forEach(signature => {
            if (!_.isUndefined(signature)) {
                bufs.push(BitcoreBuffer.concat([
                    signature.toDER(),
                    BitcoreBuffer.integerAsSingleByteBuffer(signature.nhashtype)
                ]));
            }
        });
        let script = Script_1.Script.buildP2SHMultisigIn(publickeys, threshold, bufs, {
            cachedMultisig: input.redeemScript
        });
        input.setSignatures(signatures);
        input.setSigScript(script);
        return script;
    }
    signMultisigScript(hashKeyMap, sigtype, input, index) {
        let publickeys = input._script.getMultisigPublicKeys();
        let threshold = input._script.getMultisigThreshold();
        let signatures = input.getSignatures();
        if (!_.isNumber(threshold)) {
            throw Error('threshold is not a number');
        }
        publickeys.forEach((pubkey, signatureIndex) => {
            let pubkeyHex = Hash.sha256ripemd160(pubkey).toString('hex');
            if (hashKeyMap[pubkeyHex]) {
                signatures[signatureIndex] = SignHash_1.SignHash.sign(this, hashKeyMap[pubkeyHex], sigtype, index, input._script);
            }
        });
        let bufs = [];
        signatures.forEach(signature => {
            if (!_.isUndefined(signature)) {
                bufs.push(BitcoreBuffer.concat([
                    signature.toDER(),
                    BitcoreBuffer.integerAsSingleByteBuffer(signature.nhashtype)
                ]));
            }
        });
        let sigScript = Script_1.Script.buildMultisigIn(publickeys, threshold, bufs);
        input.setSignatures(signatures);
        input.setSigScript(sigScript);
        return sigScript;
    }
    static shallowCopy(transaction) {
        var copy = new Transaction(transaction.config);
        return copy;
    }
    static fromBuffer(buf) {
        let reader = new BufferReader_1.BufferReader(buf);
        let version = reader.readInt32LE();
        let inputLen = reader.readVarintNum();
        let inputs = [];
        let outputs = [];
        for (let i = 0; i < inputLen; i++) {
            let input = Input_1.Input.fromBufferReader(reader);
            inputs.push(input);
        }
        let outputLen = reader.readVarintNum();
        for (let j = 0; j < outputLen; j++) {
            let output = Output_1.Output.fromBufferReader(reader);
            outputs.push(output);
        }
        let txContract = TxContract_1.TxContract.fromBufferReader(reader);
        let lockTime = reader.readUInt32LE();
        let tx = new Transaction({
            inputs: inputs,
            outputs: outputs,
            gasLimit: txContract.gasLimit,
            version: version,
            lockTime: lockTime
        });
        return tx;
    }
    static fromHex(hex) {
        let buf = BitcoreBuffer.hexToBuffer(hex);
        let tx = Transaction.fromBuffer(buf);
        return tx;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map