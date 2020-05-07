import * as _ from "lodash";
import * as $ from "../utils/Preconditions";
import * as BitcoreBuffer from '../utils/BitcoreBuffer'
import * as JSUtil from "../utils/Js";

import { Buffer } from "buffer";
import { DefaultAsset } from '../Constant'
import { Output, OutputConfig } from "./Output"
import { Script } from "./Script"
import { Signature } from "../utils/Signature"
import { BufferWriter } from "../utils/encoding/BufferWriter"
import { BufferReader } from "../utils/encoding/BufferReader"
import { SignHash } from "./SignHash"
import { Bn } from "../utils/Bn"

const MAXINT = 0xffffffff; //s Math.pow(2, 32) - 1;
const DEFAULT_RBF_SEQNUMBER = MAXINT - 2;
const DEFAULT_SEQNUMBER = MAXINT;
const DEFAULT_LOCKTIME_SEQNUMBER = MAXINT - 1;



export interface InputConfig {
  /**
   * Id of previous transaction.
   * @type {string}
   */
  txid: string
  /**
   * Index of output in previous transaction.
   * @type {number}
   */
  vout: number
  /**
   * Sequence of UTXO.
   * @type {[type]}
   */
  sequence ? : number
  /**
   * Hex of unlock script of UTXO.
   * @type {[type]}
   */
  scriptPubKey ? : string | Script
  /**
   *  Buffer of unlock script of UTXO.
   * @type {[type]}
   */
  scriptPubKeyBuffer ? : any
  /**
   * Hex of sign script.
   * @type {[type]}
   */
  sigScript ? : string | Script
  /**
   * Buffer of sign script.
   * @type {[type]}
   */
  sigScriptBuffer ? : Buffer
  /**
   * Output of previous transaction which index is vout.
   * @type {[type]}
   */
  prevOut ? : Output
  /**
   * Asset amount of UTXO.
   * @type {[type]}
   */
  amount ? : number | Bn
  /**
   * Asset type of UTXO.
   * @type {[type]}
   */
  assets ? : string
  /**
   * Address of UTXO.
   * @type {[type]}
   */
  address ? : string
  /**
   * Script or string of previous unlock script of
   * P2SH Multisign transaction
   * @type {[type]}
   */
  redeemScript ? : string | Script
  /**
   * Script buffer of previous unlock script of
   * P2SH Multisign transaction
   * @type {[type]}
   */
  redeemScriptBuffer ? : Buffer
  /**
   * signature array fro multisign transaction
   */
  //signatures ? : crypto.Signature[]
}

export class Input {

  static MAXINT = MAXINT
  static DEFAULT_SEQNUMBER = DEFAULT_SEQNUMBER
  static DEFAULT_LOCKTIME_SEQNUMBER = DEFAULT_LOCKTIME_SEQNUMBER
  static DEFAULT_RBF_SEQNUMBER = DEFAULT_RBF_SEQNUMBER

  private _script: Script
  private _scriptPubKeyBuffer: any
  private _sigScript: Script
  private _redeemScript: Script
  private signatures: Signature[]
  private signature: Signature

  public output: Output
  public prevTxId: string
  public vout: number
  public sequence: number

  constructor(params: InputConfig) {

    let prevTxId;
    if (_.isString(params.txid) && JSUtil.isHexa(params.txid)) {
      this.prevTxId = params.txid; // util.buffer.hexToBuffer(params.txid); // new Buffer(params.txid, 'hex');
    } else if (_.isUndefined(params.txid)) {
      throw new Error("Previous transaction id is required when create input")
    } else {
      this.prevTxId = params.txid;
    }

    this.vout = params.vout;

    if (!params.prevOut) {
      let config: OutputConfig = {}
      if (params.address || params.scriptPubKey || params.scriptPubKeyBuffer) {
        let pkScript = params.scriptPubKey || (params.scriptPubKeyBuffer && params.scriptPubKeyBuffer.toString('hex'))
        config.address = params.address
        config.pkScript = pkScript
      }
      if (params.assets) {
        $.checkArgument(_.isString(params.assets), "input asset type is incorrect");
        config.assets = params.assets
      }
      if (params.amount !== undefined) {
        $.checkArgument(_.isString(params.amount) || _.isNumber(params.amount) || (params.amount instanceof Bn), "input amount is incorrect");
        config.amount = params.amount
      }

      this.output = new Output(config);

    } else if (params.prevOut instanceof Output) {
      this.output = params.prevOut;
    } else {
      this.output = new Output(params.prevOut)
    }

    this.sequence = _.isUndefined(params.sequence) ? DEFAULT_SEQNUMBER : params.sequence;


    if (params.scriptPubKey || params.scriptPubKeyBuffer) {
      this.setScript(params.scriptPubKeyBuffer || params.scriptPubKey);
    }


    if (params.redeemScript || params.redeemScriptBuffer) {
      this.redeemScript = params.redeemScript || params.redeemScriptBuffer
    }

    if (params.sigScript || params.sigScriptBuffer) {
      this.setSigScript(params.sigScript || params.sigScriptBuffer);
    }

    return this;

  }
  public get redeemScript() {
    return this._redeemScript
  }
  public set redeemScript(script: string | Script | Buffer) {
    if (script instanceof Script) {
      this._redeemScript = script
    } else if (_.isString(script)) {
      this._redeemScript = new Script(script)
    } else if (BitcoreBuffer.isBuffer(script)) {
      this._redeemScript = new Script(script)
    }
    this.initSignatures()
  }


  public getScript() {
    if (this.isNull()) {
      return null;
    }
    if (!this._script) {
      this._script = new Script(this._scriptPubKeyBuffer);
      this._script._isInput = true;
    }
    return this._script;
  }

  /**
   * Set unlock script and script buffer of input.
   * @param {any} script instance, hex string or buffer of unlock script.
   */
  public setScript(script: any) {

    this._script = null;
    if (script instanceof Script) {
      this._script = script;
      this._script._isInput = true;
      this._scriptPubKeyBuffer = script.toBuffer();
    } else if (JSUtil.isHexa(script)) {
      // hex string script
      this._scriptPubKeyBuffer = new Buffer(script, 'hex');
      this._script = new Script(this._scriptPubKeyBuffer)
    } else if (_.isString(script)) {
      // human readable string script
      this._script = new Script(script);

      this._script._isInput = true;
      this._scriptPubKeyBuffer = this._script.toBuffer();
    } else if (BitcoreBuffer.isBuffer(script)) {

      this._script = new Script(script)
      this._script._isInput = true;
      // buffer script
      this._scriptPubKeyBuffer = new Buffer(script);
    } else {
      throw new TypeError('Invalid argument type: script');
    }
    this.output.pkScript = this._script

    this.initSignatures()
    return this;
  }

  private initSignatures() {
    let script: Script
    if (this._script.isMultisigOut()) {
      script = this._script
    } else if (this._script.isScriptHashOut() && this._redeemScript) {
      script = this._redeemScript
    } else {
      return
    }

    let publickeys = script.getMultisigPublicKeys()
    this.signatures = new Array(publickeys.length)
  }

  public addSignature(signature: Signature, index: number) {
    this.signatures[index] = signature
  }


  //TODO:update sigScript?
  /**
   * Set signatures of input.
   * @param {Signature} signature - [description]
   */
  public setSignatures(signatures: Signature[]) {
    this.signatures = signatures
  }

  /**
   * Get signatures of signed input.
   * @returns {Signature} signature
   */
  public getSignatures() {
    return this.signatures
  }

  public setSignature(signature: Signature) {
    this.signature = signature
  }

  public getSignature() {
    return this.signature
  }

  //TODO:update signatures?
  /**
   * Set sign script of input
   * @param {Script | Buffer | string} script - Script instance,buffer or string of sign script.
   */
  public setSigScript(script: Script | Buffer | string) {
    if (script instanceof Script) {
      this._sigScript = script;
    } else if (_.isString(script)) {
      this._sigScript = new Script(script);
    } else if (BitcoreBuffer.isBuffer(script)) {
      this._sigScript = new Script(script)
    }

  }
  /**
   * Get sign script.
   * @param {Script} script Script instance of sign script.
   */
  public getSigScript(script: Script) {
    return this._sigScript;
  }
  /**
   * Get previous output which UTXO refers to.
   * @returns Output
   */
  public getPrevOut() {
    return this.output
  }
  /**
   * Set previous output which UTXO refers to.
   * @param {Output} prevOut Output instance.
   */
  public setPrevOut(prevOut: Output) {
    this.output = prevOut
  }

  /**
   * @returns {Object} A plain object with the input information.
   */
  public toObject() {
    let obj: any = {
      txid: this.prevTxId,
      vout: this.vout,
      sequence: this.sequence
    }
    if (this._scriptPubKeyBuffer) {
      obj.scriptPubKey = this._scriptPubKeyBuffer.toString('hex')
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
  public toJSON() {
    return this.toObject()
  }

  /**
   * Buffer of input which only contains unlock script other than
   * the sign script.(it is usually used to generate unsigned transaction hex)
   *
   * @returns {BufferWriter} Buffer writer
   */
  public toUnsignBufferWriter(writer ? ) {
    if (!writer) {
      writer = new BufferWriter();
    }

    writer.write(BitcoreBuffer.hexToBuffer(this.prevTxId));
    writer.writeUInt32LE(this.vout);

    if (this.redeemScript) {
      let script: any = this.redeemScript
      //unsigned  P2SH multisig transaction
      let buf = script.toBuffer()
      writer.writeVarintNum(buf.length)
      writer.write(buf)

    } else if (this._scriptPubKeyBuffer) {
      //unsigned P2PH transaction
      writer.writeVarintNum(this._scriptPubKeyBuffer.length);
      writer.write(this._scriptPubKeyBuffer);
    } else {
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
  public toBufferWriter(writer ? ) {

    if (!writer) {
      writer = new BufferWriter();
    }

    writer.write(BitcoreBuffer.hexToBuffer(this.prevTxId));
    writer.writeUInt32LE(this.vout);
    if (this._sigScript) {
      let buf = this._sigScript.toBuffer();
      writer.writeVarintNum(buf.length);
      writer.write(buf);
    } else {
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
  public isValidSignature(transaction, signature) {
    // FIXME: Refactor signature so this is not necessary
    signature.signature.nhashtype = signature.sigtype;
    return SignHash.verify(
      transaction,
      signature.signature,
      signature.publicKey,
      signature.inputIndex,
      this.output.pkScript
    );
  }

  /**
   * @returns true if this is a coinbase input (represents no input)
   */
  public isNull() {
    return this.prevTxId === '0000000000000000000000000000000000000000000000000000000000000000' &&
      this.vout === 0xffffffff;
  }

  /**
   * Estimate buffer size of input
   *
   * @returns {number}
   */
  public estimateSize() {
    return this.toBufferWriter().toBuffer().length;
  }
  /**
   * Judge whether the input is fully signed
   */
  public isFullySigned() {

    if (this._sigScript.isPublicKeyHashIn() || this._sigScript.isPublicKeyIn()) {
      return !!this.getSignature()

    } else if (this._sigScript.isScriptHashIn()) {
      let redeemScript = this._sigScript.getRedeemScript()
      let threshold = redeemScript.getMultisigThreshold()
      let signatures = this.getSignatures()
      return signatures.length == threshold
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
  static fromBufferReader(reader: BufferReader) {

    let txid = BitcoreBuffer.bufferToHex(reader.read(32))
    let vout = reader.readUInt32LE()
    let scriptLen = reader.readVarintNum()
    let scriptBuffer
    let config: InputConfig = {
      txid: txid,
      vout: vout
    }

    if (scriptLen !== 0) {
      let buf = reader.read(scriptLen)
      let script = new Script(buf)

      if (script.isPublicKeyHashOut()) {
        //P2PK output
        config.scriptPubKey = script
      } else if (script.isPublicKeyHashIn()) {
        //P2PK input
        config.sigScript = script
      } else if (script.isScriptHashIn()) {
        //P2SH input
        config.redeemScript = script.getRedeemScript()
        config.sigScript = script
        config.scriptPubKey = config.redeemScript.toScriptHashOut()
      } else if (script.isMultisigOut()) {
        //m-n multisig
        config.redeemScript = script
        config.scriptPubKey = config.redeemScript.toScriptHashOut()
      } else {
        throw new Error('Script does not match any type of script')
      }

    }
    config.sequence = reader.readUInt32LE()
    let input = new Input(config)
    return input
  }


}
