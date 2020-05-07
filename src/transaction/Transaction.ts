import * as _ from "lodash";
import * as Signature from "../utils/Signature"
import * as Hash from "../utils/Hash"
import * as BitcoreBuffer from '../utils/BitcoreBuffer'
import * as $ from "../utils/Preconditions"

import { Input, InputConfig } from "./Input"
import { Output, OutputConfig } from "./Output"
import { TxContract, TxContractConfig } from "./TxContract"
import { SignHash } from "./SignHash"
import { TRANSACTION } from "../Constant"
import { Script } from "./Script"
import { PrivateKey } from './Privatekey'
import { PublicKey } from './Publickey'
import { BufferWriter } from "../utils/encoding/BufferWriter"
import { BufferReader } from "../utils/encoding/BufferReader"

export interface TransactionConfig {
  inputs: InputConfig[]
  outputs: OutputConfig[]
  version ? : number
  lockTime ? : number
  gasLimit ? : number
}

export class Transaction {
  public inputs: Input[] = []
  public outputs: Output[] = []
  public version: number = TRANSACTION.DEFAULT_VERSION;
  public lockTime: number = TRANSACTION.DEFAULT_LOCK_TIME;
  public txContract: TxContract
  constructor(public config: TransactionConfig) {

    $.checkArgument(config.inputs && config.inputs.length, "Input length is 0")
    $.checkArgument(config.outputs && config.outputs.length, "Output length is 0")

    //inputs
    config.inputs.forEach(i => {
      if (i instanceof Input) {
        this.inputs.push(_.cloneDeep(i))
      } else {
        this.inputs.push(new Input(i))
      }
    });

    //outputs
    config.outputs.forEach(i => {
      if (i instanceof Output) {
        this.outputs.push(_.cloneDeep(i))
      } else {
        this.outputs.push(new Output(i))
      }
    });

    //gas limit
    let txContractConfig: TxContractConfig = {
      gasLimit: config.gasLimit
    }

    this.txContract = new TxContract(txContractConfig)

    if (!_.isUndefined(config.lockTime)) {
      this.lockTime = config.lockTime;
    }
    if (!_.isUndefined(config.version) && _.isNumber(config.version)) {
      this.version = config.version
    }
  }


  // Version 4 bytes + TxType 4 bytes + Serialized varint size for the
  // number of transaction inputs and outputs.
  private toBufferWriter(writer ? : BufferWriter) {
    if (!writer) {
      writer = new BufferWriter();
    }
    //Version 4 bytes
    writer.writeInt32LE(this.version);
    writer.writeVarintNum(this.inputs.length);
    _.each(this.inputs, function(input: Input) {
      input.toBufferWriter(writer);
    });
    writer.writeVarintNum(this.outputs.length);
    _.each(this.outputs, function(output: Output) {
      output.toBufferWriter(writer);
    });
    //gasLimit 4 bytes
    this.txContract.toBufferWriter(writer)
    //LockTime 4 bytes
    writer.writeUInt32LE(this.lockTime);
    return writer;
  }

  private toUnsignBufferWriter(writer ? : BufferWriter) {
    if (!writer) {
      writer = new BufferWriter();
    }
    //Version 4 bytes
    writer.writeInt32LE(this.version);
    writer.writeVarintNum(this.inputs.length);
    _.each(this.inputs, function(input: Input) {
      input.toUnsignBufferWriter(writer);
    });
    writer.writeVarintNum(this.outputs.length);
    _.each(this.outputs, function(output: Output) {
      output.toBufferWriter(writer);
    });
    //gasLimit 4 bytes
    this.txContract.toBufferWriter(writer)
    //LockTime 4 bytes
    writer.writeUInt32LE(this.lockTime);
    return writer;
  }


  public toBuffer() {
    var writer = new BufferWriter();
    return this.toBufferWriter(writer).toBuffer();
  }

  public toUnsignBuffer() {
    var writer = new BufferWriter();
    return this.toUnsignBufferWriter(writer).toBuffer();
  }

  public toHex(): string {
    return this.toBuffer().toString('hex');
  }
  public toUnsignHex(): string {
    return this.toUnsignBuffer().toString('hex');
  }

  public isCoinbase(): boolean {
    return (this.inputs.length === 1 && this.inputs[0].isNull());
  }

  private getHashKeyMap(privateKey) {

    let hashKeyMap: any = {};
    if (_.isArray(privateKey)) {
      _.each(privateKey, (p) => {
        let privKey: PrivateKey
        if (p instanceof PrivateKey) {

          privKey = p;
        } else {
          p = p.replace('0x', '')
          privKey = new PrivateKey(p);
        }

        let hashDataBuffer = Hash.sha256ripemd160(privKey.publicKey.toBuffer());

        let hashDataHex = BitcoreBuffer.bufferToHex(hashDataBuffer)
        hashKeyMap[hashDataHex] = privKey
      })

    } else {
      let privKey: PrivateKey
      if (privateKey instanceof PrivateKey) {
        privKey = privateKey;
      } else {

        privKey = new PrivateKey(privateKey);
      }
      let hashDataBuffer = Hash.sha256ripemd160(privKey.publicKey.toBuffer());

      let hashDataHex = BitcoreBuffer.bufferToHex(hashDataBuffer)
      hashKeyMap[hashDataHex] = privKey
    }
    return hashKeyMap
  }

  public sign(privateKey, sigtype = Signature.Signature.SIGHASH_ALL) {
    let hashKeyMap: any = this.getHashKeyMap(privateKey)

    _.each(this.inputs, (input, index) => {
      if (input._script.isScriptHashOut()) {
        this.signP2SHMultisigScript(hashKeyMap, sigtype, input, index)
      } else if (input._script.isMultisigOut()) {
        this.signMultisigScript(hashKeyMap, sigtype, input, index)
      } else {
        this.signPayToPublickeyHash(hashKeyMap, sigtype, input, index)
      }
    })


    return this;
  }
  private signPayToPublickeyHash(hashKeyMap, sigtype, input, index) {

    let signature, sigScript
    let pubKeyHashBuffer = input.output.pkScript.getPublicKeyHash()
    let hashDataHex = BitcoreBuffer.bufferToHex(pubKeyHashBuffer.slice(1))
    let privateKey = hashKeyMap[hashDataHex];
    if (privateKey) {

      signature = SignHash.sign(this, privateKey, sigtype, index, input._script);
      sigScript = Script.buildPublicKeyHashIn(privateKey.publicKey, signature, sigtype)

    } else {
      throw Error("input #" + index + " do not have matched private key");
    }
    input.setSignature(signature)
    input.setSigScript(sigScript)
    return sigScript
  }
  private signP2SHMultisigScript(hashKeyMap, sigtype, input, index) {
    let publickeys = input.redeemScript.getMultisigPublicKeys()
    let threshold = input.redeemScript.getMultisigThreshold()
    let signatures = input.getSignatures()
    let sigScript = input.getSigScript()
    if (!_.isNumber(threshold)) {
      throw Error('threshold is not a number')
    }

    let otherSignatures = sigScript && sigScript.getSignatures() || []
    /**
     * Add signatures in sign script
     */
    if (otherSignatures.length) {
      otherSignatures.forEach(signature => {
        publickeys.forEach((pubkey, signatureIndex) => {
          let publickey = new PublicKey(pubkey)
          if (SignHash.verify(this, signature, publickey, index, input.redeemScript)) {
            signatures[signatureIndex] = signature
          }
        })
      })
    }

    publickeys.forEach((pubkey, signatureIndex) => {
      let pubkeyHex = Hash.sha256ripemd160(pubkey).toString('hex')

      if (hashKeyMap[pubkeyHex]) {
        signatures[signatureIndex] = SignHash.sign(this, hashKeyMap[pubkeyHex], sigtype, index, input.redeemScript)
      }
    })

    let bufs = []
    signatures.forEach(signature => {
      if (!_.isUndefined(signature)) {
        bufs.push(BitcoreBuffer.concat([
          signature.toDER(),
          BitcoreBuffer.integerAsSingleByteBuffer(signature.nhashtype)
        ]))
      }
    })
    let script = Script.buildP2SHMultisigIn(publickeys, threshold, bufs, {
      cachedMultisig: input.redeemScript
    })
    input.setSignatures(signatures)
    input.setSigScript(script)
    return script
  }

  private signMultisigScript(hashKeyMap, sigtype, input, index) {
    let publickeys = input._script.getMultisigPublicKeys()
    let threshold = input._script.getMultisigThreshold()
    let signatures = input.getSignatures()

    if (!_.isNumber(threshold)) {
      throw Error('threshold is not a number')
    }

    publickeys.forEach((pubkey, signatureIndex) => {
      let pubkeyHex = Hash.sha256ripemd160(pubkey).toString('hex')

      if (hashKeyMap[pubkeyHex]) {
        signatures[signatureIndex] = SignHash.sign(this, hashKeyMap[pubkeyHex], sigtype, index, input._script)
      }
    })

    let bufs = []
    signatures.forEach(signature => {
      if (!_.isUndefined(signature)) {
        bufs.push(BitcoreBuffer.concat([
          signature.toDER(),
          BitcoreBuffer.integerAsSingleByteBuffer(signature.nhashtype)
        ]))
      }
    })
    let sigScript = Script.buildMultisigIn(publickeys, threshold, bufs)
    input.setSignatures(signatures)
    input.setSigScript(sigScript)
    return sigScript
  }

  static shallowCopy(transaction: Transaction) {
    var copy = new Transaction(transaction.config);
    return copy;
  }

  static fromBuffer(buf) {

    let reader = new BufferReader(buf)
    let version = reader.readInt32LE()
    let inputLen = reader.readVarintNum()
    let inputs = []
    let outputs = []

    for (let i = 0; i < inputLen; i++) {

      let input = Input.fromBufferReader(reader)
      inputs.push(input)
    }

    let outputLen = reader.readVarintNum()

    for (let j = 0; j < outputLen; j++) {
      let output = Output.fromBufferReader(reader)
      outputs.push(output)
    }

    let txContract = TxContract.fromBufferReader(reader)
    let lockTime = reader.readUInt32LE()

    let tx = new Transaction({
      inputs: inputs,
      outputs: outputs,
      gasLimit: txContract.gasLimit,
      version: version,
      lockTime: lockTime
    })
    return tx
  }

  static fromHex(hex: string) {
    let buf = BitcoreBuffer.hexToBuffer(hex)
    let tx = Transaction.fromBuffer(buf)
    return tx
  }

}
