"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const BitcoreBuffer = require("../utils/BitcoreBuffer");
const JSUtil = require("../utils/Js");
const $ = require("../utils/Preconditions");
const buffer_1 = require("buffer");
const Script_1 = require("./Script");
const Address_1 = require("./Address");
const Constant_1 = require("../Constant");
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const Bn_1 = require("../utils/Bn");
var MAX_SAFE_INTEGER = 0x1fffffffffffff;
class Output {
    constructor(config) {
        this.config = config;
        this.data = '';
        this.pkScript = new Script_1.Script();
        if (!_.isObject(config) && !_.isUndefined(config)) {
            throw new TypeError('Unrecognized argument for Output');
        }
        this.assets = config.assets;
        this.address = config.address;
        if (config.amount !== undefined) {
            let num = config.amount;
            if (num instanceof Bn_1.Bn) {
                this.amountBN = num;
                this.amount = num.toNumber();
            }
            else if (_.isString(num)) {
                this.amount = parseInt(num);
                this.amountBN = Bn_1.Bn.fromNumber(this.amount);
            }
            else {
                if (!JSUtil.isNaturalNumber(num)) {
                    throw Error('Output amount is not a natural number');
                }
                this.amountBN = Bn_1.Bn.fromNumber(num);
                this.amount = num;
            }
            if (!JSUtil.isNaturalNumber(this.amount)) {
                throw Error('Output amount is not a natural number');
            }
        }
        // normal transaction pkScript
        if (config.data) {
            $.checkArgument(JSUtil.isHexa(config.data), "data is not a hex string");
            //compatible with '0x' prefix
            this.data = config.data && config.data.replace('0x', '');
            if (config.pkScript) {
                this.pkScript = new Script_1.Script(config.pkScript);
                return;
            }
            else {
                $.checkArgument(config.contractType, "contract type is not correct");
                this.contractType = config.contractType;
                switch (this.contractType) {
                    case Constant_1.TRANSACTION.CONTRACT_TYPE.CALL:
                        this.pkScript = Script_1.Script.buildPayToContractHashScript(this.address);
                        break;
                    case Constant_1.TRANSACTION.CONTRACT_TYPE.TEMPLATE:
                        this.pkScript = Script_1.Script.buildCreateTemplateHashScript(this.address);
                        break;
                    case Constant_1.TRANSACTION.CONTRACT_TYPE.VOTE:
                        this.pkScript = Script_1.Script.buildVoteHashScript(this.address);
                        break;
                    default:
                        this.pkScript = Script_1.Script.buildCreateContractHashScript(this.address);
                        break;
                }
            }
        }
        else {
            if (config.pkScript) {
                this.pkScript = new Script_1.Script(config.pkScript);
                return;
            }
            if (this.address) {
                if (Address_1.Address.IsPayToContractHash(this.address)) {
                    this.pkScript = Script_1.Script.buildPayToContractHashScript(this.address);
                }
                else {
                    this.pkScript = Script_1.Script.payToAddressScript(this.address);
                }
            }
        }
    }
    /**
     * [serialize description]
     * @param {[type]} writer [description]
     * Amount(8)+Assets.length+Assets+PKScript.length+PkScript+Data.length+Data
     */
    toBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        let buf;
        //value
        writer.writeUInt64LEBN(this.amountBN);
        //pkscript
        buf = this.pkScript.toBuffer();
        writer.writeVarintNum(buf.length);
        writer.write(buf);
        if (this.assets && this.assets.length) {
            buf = BitcoreBuffer.hexToBuffer(this.assets);
            writer.writeVarintNum(buf.length);
            writer.write(buf);
        }
        else {
            writer.writeVarintNum(0);
        }
        if (this.data.length) {
            buf = BitcoreBuffer.hexToBuffer(this.data);
            writer.writeVarintNum(buf.length);
            writer.write(buf);
        }
        else {
            writer.writeVarintNum(0);
        }
        return writer;
    }
    estimateSize() {
        return this.toBufferWriter().toBuffer().length;
    }
    toObject() {
        var obj = {
            amount: this.amount,
            data: this.data,
            assets: this.assets,
            address: this.address
        };
        if (this.pkScript.isCreateOut()) {
            obj.contractType = 'create';
        }
        else if (this.pkScript.isCallOut()) {
            obj.contractType = 'call';
        }
        else if (this.pkScript.isVoteOut()) {
            obj.contractType = 'vote';
        }
        else if (this.pkScript.isTemplateOut()) {
            obj.contractType = 'template';
        }
        obj.pkScript = this.pkScript.toHex();
        return obj;
    }
    toJSON() {
        return this.toObject();
    }
    inspect() {
        var scriptStr;
        if (this.pkScript) {
            scriptStr = this.pkScript.inspect();
        }
        return '<Output (' + this.amount + ' sats) ' + scriptStr + '>';
    }
    static fromBufferReader(reader) {
        let amount = reader.readUInt64LEBN();
        let scriptLen = reader.readVarintNum();
        let scriptBuf = new buffer_1.Buffer([]);
        if (scriptLen !== 0) {
            scriptBuf = reader.read(scriptLen);
        }
        let pkScript = BitcoreBuffer.bufferToHex(scriptBuf);
        let assetLen = reader.readVarintNum();
        let assetBuf = new buffer_1.Buffer([]);
        if (assetLen != 0) {
            assetBuf = reader.read(assetLen);
        }
        let assets = BitcoreBuffer.bufferToHex(assetBuf);
        let dataLen = reader.readVarintNum();
        let dataBuf = new buffer_1.Buffer([]);
        if (dataLen != 0) {
            dataBuf = reader.read(dataLen);
        }
        let data = BitcoreBuffer.bufferToHex(dataBuf);
        return new Output({
            amount: amount,
            pkScript: pkScript,
            assets: assets,
            data: data
        });
    }
}
exports.Output = Output;
//# sourceMappingURL=Output.js.map