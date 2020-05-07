import * as _ from "lodash"
import * as BitcoreBuffer from '../utils/BitcoreBuffer'
import * as JSUtil from '../utils/Js'
import * as $ from '../utils/Preconditions'

import { Buffer } from "buffer";
import { Script } from "./Script"
import { Address } from "./Address"
import { TRANSACTION } from "../Constant"
import { BufferWriter } from "../utils/encoding/BufferWriter"
import { BufferReader } from "../utils/encoding/BufferReader"
import { Bn } from "../utils/Bn"

var MAX_SAFE_INTEGER = 0x1fffffffffffff;

export interface OutputConfig {
  amount ? : number | Bn | string
  assets ? : string
  address ? : string
  data ? : string
  contractType ? : string
  pkScript ? : string
}

export class Output {

  private amountBN: any

  public data: string = ''
  public assets: string
  public pkScript: Script = new Script()
  public amount: number
  public contractType: string
  public address: string

  constructor(public config: OutputConfig) {
    if (!_.isObject(config) && !_.isUndefined(config)) {
      throw new TypeError('Unrecognized argument for Output');
    }

    this.assets = config.assets;
    this.address = config.address;

    if (config.amount !== undefined) {

      let num: any = config.amount

      if (num instanceof Bn) {

        this.amountBN = num;
        this.amount = num.toNumber();

      } else if (_.isString(num)) {

        this.amount = parseInt(num);
        this.amountBN = Bn.fromNumber(this.amount);

      } else {
        if (!JSUtil.isNaturalNumber(num)) {
          throw Error('Output amount is not a natural number')
        }
        this.amountBN = Bn.fromNumber(num);
        this.amount = num;
      }

      if (!JSUtil.isNaturalNumber(this.amount)) {
        throw Error('Output amount is not a natural number')
      }

    }

    // normal transaction pkScript
    if (config.data) {

      $.checkArgument(JSUtil.isHexa(config.data), "data is not a hex string");
      //compatible with '0x' prefix
      this.data = config.data && config.data.replace('0x', '');

      if (config.pkScript) {
        this.pkScript = new Script(config.pkScript)
        return
      } else {
        $.checkArgument(config.contractType, "contract type is not correct");
        this.contractType = config.contractType
        switch (this.contractType) {
          case TRANSACTION.CONTRACT_TYPE.CALL:
            this.pkScript = Script.buildPayToContractHashScript(this.address)
            break;
          case TRANSACTION.CONTRACT_TYPE.TEMPLATE:
            this.pkScript = Script.buildCreateTemplateHashScript(this.address)
            break;
          case TRANSACTION.CONTRACT_TYPE.VOTE:
            this.pkScript = Script.buildVoteHashScript(this.address)
            break;
          default:
            this.pkScript = Script.buildCreateContractHashScript(this.address)
            break;
        }
      }
    } else {
      if (config.pkScript) {
        this.pkScript = new Script(config.pkScript)
        return
      }
      if (this.address) {
        if (Address.IsPayToContractHash(this.address)) {
          this.pkScript = Script.buildPayToContractHashScript(this.address)
        } else {
          this.pkScript = Script.payToAddressScript(this.address)
        }
      }
    }

  }

  /**
   * [serialize description]
   * @param {[type]} writer [description]
   * Amount(8)+Assets.length+Assets+PKScript.length+PkScript+Data.length+Data
   */
  public toBufferWriter(writer ? : BufferWriter) {
    if (!writer) {
      writer = new BufferWriter();
    }
    let buf
    //value
    writer.writeUInt64LEBN(this.amountBN);

    //pkscript
    buf = this.pkScript.toBuffer()
    writer.writeVarintNum(buf.length);
    writer.write(buf)

    if (this.assets && this.assets.length) {

      buf = BitcoreBuffer.hexToBuffer(this.assets)
      writer.writeVarintNum(buf.length)
      writer.write(buf)
    } else {
      writer.writeVarintNum(0)
    }

    if (this.data.length) {
      buf = BitcoreBuffer.hexToBuffer(this.data)
      writer.writeVarintNum(buf.length);
      writer.write(buf)
    } else {
      writer.writeVarintNum(0)
    }

    return writer;

  }

  public estimateSize() {
    return this.toBufferWriter().toBuffer().length;
  }


  public toObject() {
    var obj: any = {
      amount: this.amount,
      data: this.data,
      assets: this.assets,
      address: this.address
    };
    if (this.pkScript.isCreateOut()) {
      obj.contractType = 'create'
    } else if (this.pkScript.isCallOut()) {
      obj.contractType = 'call'
    } else if (this.pkScript.isVoteOut()) {
      obj.contractType = 'vote'
    } else if (this.pkScript.isTemplateOut()) {
      obj.contractType = 'template'
    }
    obj.pkScript = this.pkScript.toHex();

    return obj;
  }
  public toJSON() {
    return this.toObject();
  }


  public inspect() {
    var scriptStr;
    if (this.pkScript) {
      scriptStr = this.pkScript.inspect();
    }
    return '<Output (' + this.amount + ' sats) ' + scriptStr + '>';
  }

  static fromBufferReader(reader: BufferReader) {

    let amount = reader.readUInt64LEBN()
    let scriptLen = reader.readVarintNum()
    let scriptBuf: any = new Buffer([])
    if (scriptLen !== 0) {
      scriptBuf = reader.read(scriptLen)
    }
    let pkScript = BitcoreBuffer.bufferToHex(scriptBuf)

    let assetLen = reader.readVarintNum()
    let assetBuf: any = new Buffer([])
    if (assetLen != 0) {
      assetBuf = reader.read(assetLen)
    }
    let assets = BitcoreBuffer.bufferToHex(assetBuf)


    let dataLen = reader.readVarintNum()
    let dataBuf: any = new Buffer([])
    if (dataLen != 0) {
      dataBuf = reader.read(dataLen)
    }
    let data = BitcoreBuffer.bufferToHex(dataBuf)
    return new Output({
      amount: amount,
      pkScript: pkScript,
      assets: assets,
      data: data
    });
  }


}
