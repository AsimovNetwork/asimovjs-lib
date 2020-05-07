"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const $ = require("../utils/Preconditions");
const Hash = require("../utils/Hash");
const Signature = require("../utils/Signature");
const buffer_1 = require("buffer");
const Script_1 = require("./Script");
const Transaction_1 = require("./Transaction");
const ECDSA_1 = require("../utils/ECDSA");
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const BufferReader_1 = require("../utils/encoding/BufferReader");
const SIGHASH_SINGLE_BUG = '0000000000000000000000000000000000000000000000000000000000000001';
const BITS_64_ON = 'ffffffffffffffff';
class SignHash {
    constructor() { }
    /**
     * Returns a buffer of length 32 bytes with the hash that needs to be signed
     * for OP_CHECKSIG.
     *
     * @name Signing.sighash
     * @param {Transaction} transaction the transaction to sign
     * @param {number} sighashType the type of the hash
     * @param {number} inputNumber the input index for the signature
     * @param {Script} subscript the script that will be signed
     */
    static sighash(transaction, sighashType, inputNumber, subscript) {
        var i;
        // Copy transaction
        var txcopy = Transaction_1.Transaction.shallowCopy(transaction);
        // Copy script
        subscript = new Script_1.Script(subscript);
        subscript.removeCodeseparators();
        for (i = 0; i < txcopy.inputs.length; i++) {
            txcopy.inputs[i].setSigScript(new Script_1.Script());
        }
        txcopy.inputs[inputNumber].setSigScript(subscript);
        if ((sighashType & 31) === Signature.Signature.SIGHASH_NONE ||
            (sighashType & 31) === Signature.Signature.SIGHASH_SINGLE) {
            // clear all sequenceNumbers
            for (i = 0; i < txcopy.inputs.length; i++) {
                if (i !== inputNumber) {
                    txcopy.inputs[i].sequence = 0;
                }
            }
        }
        if ((sighashType & 31) === Signature.Signature.SIGHASH_NONE) {
            txcopy.outputs = [];
        }
        else if ((sighashType & 31) === Signature.Signature.SIGHASH_SINGLE) {
            // The SIGHASH_SINGLE bug.
            // https://bitcointalk.org/index.php?topic=260595.0
            if (inputNumber >= txcopy.outputs.length) {
                return new buffer_1.Buffer(SIGHASH_SINGLE_BUG, 'hex');
            }
            txcopy.outputs.length = inputNumber + 1;
            // for (i = 0; i < inputNumber; i++) {
            //   txcopy.outputs[i] = new Output({
            //     amount: BN.fromBuffer(new buffer.Buffer(BITS_64_ON, 'hex')),
            //     script: Script.empty()
            //   });
            // }
        }
        if (sighashType & Signature.Signature.SIGHASH_ANYONECANPAY) {
            txcopy.inputs = [txcopy.inputs[inputNumber]];
        }
        var buf = new BufferWriter_1.BufferWriter()
            .write(txcopy.toBuffer())
            .writeInt32LE(sighashType)
            .toBuffer();
        var ret = Hash.sha256sha256(buf);
        ret = new BufferReader_1.BufferReader(ret).readReverse();
        return ret;
    }
    /**
     * Create a signature
     *
     * @name Signing.sign
     * @param {Transaction} transaction
     * @param {PrivateKey} privateKey
     * @param {number} sighash
     * @param {number} inputIndex
     * @param {Script} subscript
     * @return {Signature}
     */
    static sign(transaction, privateKey, sighashType, inputIndex, subscript) {
        var hashbuf = SignHash.sighash(transaction, sighashType, inputIndex, subscript);
        var sig = ECDSA_1.ECDSA.sign(hashbuf, privateKey, 'little').set({
            nhashtype: sighashType
        });
        return sig;
    }
    /**
     * Verify a signature
     *
     * @name Signing.verify
     * @param {Transaction} transaction
     * @param {Signature} signature
     * @param {PublicKey} publicKey
     * @param {number} inputIndex
     * @param {Script} subscript
     * @return {boolean}
     */
    static verify(transaction, signature, publicKey, inputIndex, subscript) {
        $.checkArgument(!_.isUndefined(transaction), null, null, null);
        $.checkArgument(!_.isUndefined(signature) && !_.isUndefined(signature.nhashtype), null, null, null);
        var hashbuf = SignHash.sighash(transaction, signature.nhashtype, inputIndex, subscript);
        return ECDSA_1.ECDSA.verify(hashbuf, signature, publicKey, 'little');
    }
}
exports.SignHash = SignHash;
//# sourceMappingURL=SignHash.js.map