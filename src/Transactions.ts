import { DefaultAsset, MinGasLimit } from './Constant'
import { ChainRpcProvider } from './providers/ChainRpcProvider'
import { Setting } from './Setting'
import { Transaction } from './transaction/Transaction'
import * as txHelper from './utils/TxHelper'
import { to } from 'await-to-js'

import { Bn } from "./utils/Bn";

/**
 * Fee structure, which contains asset amount and asset type.
 */
export interface Fee {
  /**
   * Amount of the fee calculated in satoshi.
   */
  amount: number | Bn | string | bigint
  /**
   * Asset type of the fee, hex format without 0x, such as "000000000000000200000001".
   */
  asset: string
}

/**
 * Parameters used to generate a raw transaction.
 */
export interface GenerateRawTransactionParams {
  /**
   * From address of the transaction (eg:0x66b473d88f834b9022e0dfffd1591bde03069c71f5).
   */
  from: string
  /**
   * To address of transaction (eg:0x63b473d88f834b9022e0dfffd1591bde03069c71f5).
   */
  to: string
  /**
   * Amount of asset to transfer, which is calculated in satoshi.
   */
  amount: number | Bn | string | bigint
  /**
   * Asset type, hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  asset: string
  /**
   * Transaction fee.
   */
  fee: Fee
  /**
   * Gas of transaction which is used to run code in virtual machine. If not set, it uses the result of gas estimation provided by node rpc service.
   */
  gasLimit ? : number
  /**
   * Contract invocation type of the transaction (eg:call,template,create,deploy,vote).
   */
  contractType ? : string
  /**
   * Hex string of code which runs in virtual machine (eg:0000000123001230000123).
   */
  data ? : string
}

/**
 * Parameters used to generate a vote transaction.
 */
export interface GenerateVoteTransactionParams {
  /**
   * From address of the transaction (eg:0x66b473d88f834b9022e0dfffd1591bde03069c71f5).
   */
  from: string
  /**
   * To address of transaction (eg:0x63b473d88f834b9022e0dfffd1591bde03069c71f5).
   */
  to: string
  /**
   * Amount of asset used to vote, set to 0 if you want to vote all for a given asset type.
   */
  amount: number | Bn | string | bigint
  /**
   * Asset type, hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  asset: string
  /**
   * Vote id.
   */
  voteId: number
  /**
   * Amount of asset used to vote, set to 0 if you want to vote all for a given asset type.
   */
  voteValue: number | Bn | string | bigint
  /**
   * Transaction fee.
   */
  fee: Fee
  /**
   * Gas of transaction which is used to run code in virtual machine. If not set, it uses the result of gas estimation provided by node rpc service.
   */
  gasLimit ? : number
  /**
   * Contract invocation type of the transaction, in vote transaction it is set to "vote".
   */
  contractType ? : string
  /**
   * Hex string of code which runs in virtual machine (eg:0000000123001230000123).
   */
  data ? : string
}
/**
 * Parameters used to send a normal transaction.
 */
export interface SendParams {
  /**
   * To address of transaction (eg:0x66b473d88f834b9022e0dfffd1591bde03069c71f5).
   */
  address: string
  /**
   * Amount of asset to transfer, which is calculated in satoshi.
   */
  amount: number | Bn | string | bigint
  /**
   *  Asset type, hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  asset: string
  /**
   * Value of transaction fee, calculated in satoshi.
   */
  feeValue: number
  /**
   * Asset type of transaction fee, hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  feeType: string
}

/**
 * High level Transactions object to send transactions on Asimov blockchain
 */
export class Transactions {
  public setting: Setting = Setting.getInstance()
  private _privateKey: string = this.setting.privateKey
  private _chainRpcProvider: ChainRpcProvider = this.setting.chainRpcProvider

  /**
   * Constructor of Transactions object
   * @param rpc ChainRPC provider
   */
  constructor(rpc: ChainRpcProvider) {
    if (rpc) {
      this.chainRpcProvider = rpc
    }
  }
  /**
   * getter of ChainRPC provider
   */
  public get chainRpcProvider(): ChainRpcProvider {
    return this._chainRpcProvider
  }
  /**
   * setter of ChainRPC provider
   */
  public set chainRpcProvider(rpc: ChainRpcProvider) {
    this._chainRpcProvider = rpc
  }
  /**
   * getter of private key.
   */
  public get privateKey(): string {
    return this._privateKey
  }
  /**
   * setter of private key. Private key is set when developing automation scripts.
   */
  public set privateKey(pk: string) {
    this._privateKey = pk
  }

  /**
   * pick UTXOs in page.
   *
   * @param amount total value of UTXOs.
   * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
   * @param address the address to pick from.
   * @param page page number.
   */
  private async pickUtxos(amount: Bn, asset: string, address: string, page: number) {

    let inputs: any[] = []
    let total = new Bn(0)
    let pageCount = 1000

    let [err, res] = await to(this.chainRpcProvider.getUtxoInPage({
      address: address,
      asset: asset,
      from: page,
      count: pageCount
    }))

    if (err) {
      throw err
    }

    let { utxos, count } = res

    for (let i = 0, len = utxos.length; i < len; i++) {
      let u = utxos[i];
      if (amount.eq(0)) {
        total.add(u.amount)
        inputs.push(u)
        break
      }
      if (total.lt(amount)) {
        total.add(u.amount)
        inputs.push(u)
      }
    }



    if (total.lt(amount) && inputs.length < count) {

      let res = await this.pickUtxos(amount.sub(total), asset, address, page + 1)
      inputs = inputs.concat(res)
    }

    return inputs

  }

  /**
   * pick UTXOs to vote.
   *
   * @param voteValue value to vote.
   * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
   * @param address the address to pick from.
   */
  private async pickVoteUtxos(voteValue: Bn, asset: string, address: string) {

    let inputs: any[] = []
    let page = 0
    let pageCount = 1000

    let [err, res] = await to(this.chainRpcProvider.getUtxoInPage({
      address: address,
      asset: asset,
      from: page,
      count: pageCount
    }))

    if (err) {
      throw err
    }

    let { utxos, count } = res


    let [err1, res1] = await to(this.chainRpcProvider.getUtxoInPage({
      address: address,
      asset: asset,
      from: 0,
      count: count
    }))

    if (err1) {
      throw err1
    }

    inputs = res1.utxos

    return inputs
  }

  /**
   * pick UTXOs as transaction fee
   * @param amount value as transaction fee.
   * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
   * @param address the address to pick from.
   */
  private async pickFeeUtxos(amount: Bn, asset: string, address: string) {
    let total = new Bn(0)
    let feeInputs = await this.pickUtxos(amount, asset, address, 0)
    //let [err, feeInputs] = await to(temp)
    if (!feeInputs.length) {
      throw new Error("There is not enough UTXO to set as transaction fee.")
    }
    feeInputs.forEach(i => {
      total.add(i.amount)
    })
    if (total.lt(amount)) {
      throw new Error("There is not enough UTXO to set as transaction fee.")
    }

    return feeInputs
  }

  /**
   * estimate transaction fee
   * @param amount value to transfer in the transaction.
   * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
   * @param address the address to initiate the transaction.
   * @param outputs outputs of the transaction.
   * @param gasLimit gas limit set to the transaction.
   * @return transaction fee (value + type)
   */
  private async estimateFee(gasLimit: number, fee: any) {

    if (!fee || !fee.amount || (fee.amount instanceof Bn && fee.amount.eq(0))) {
      let temp: Fee = {
        amount: 0,
        asset: DefaultAsset
      }
      let blockInfo = []
      let [err, bestBlock] = await to(this.chainRpcProvider.getBestBlock())
      let blockHash = bestBlock.hash
      if (!err && blockHash) {
        [err, blockInfo] = await to(this.chainRpcProvider.getBlock({
          blockHash: blockHash,
          verbose: true,
          verboseTx: true
        }))
      }

      let gasPrice = txHelper.estimateGasPrice(blockInfo['rawtx'])

      temp.amount = parseInt((gasPrice * gasLimit).toFixed(0))

      if (fee && !fee.asset) {
        temp.asset = DefaultAsset
      }
      return temp
    } else {
      fee.amount = new Bn(fee.amount)
      return fee
    }
  }

  private async estimateGas(tx: Transaction, utxos: any[]) {
    let gasLimit = 0;
    let [err, res] = await to(this.chainRpcProvider.runTransaction({
      hex: tx.toHex(),
      utxos: utxos
    }))
    if (err) {
      gasLimit = MinGasLimit
    } else {
      gasLimit = Math.max(MinGasLimit, res.gasUsed)
    }
    return gasLimit
  }

  private generateChangeOutputs(inputs: any[], changeAddress: string, toAmount: Bn, toAsset: string, fee: Fee = { asset: '', amount: 0 }) {
    let changeMap: {
      [propName: string]: Bn
    } = {}
    let outputs: any[] = []
    //TODO bignumber
    inputs.forEach(i => {
      if (changeMap[i.assets]) {
        changeMap[i.assets].add(i.amount)
      } else {
        changeMap[i.assets] = new Bn(i.amount)
      }
      //i.amount = i.amount.toString()
    })

    if (!toAmount.eq(0) && changeMap[toAsset] && changeMap[toAsset].lt(0)) {
      changeMap[toAsset].sub(toAmount)
    }
    if (fee && fee.amount && changeMap[fee.asset].lt(0)) {
      if (changeMap[fee.asset].lt(fee.amount)) {
        throw new Error("Not enough balance to pay the transaction fee.")
      }
      changeMap[fee.asset].sub(fee.amount)
    }

    //TODO bignumber
    for (let k in changeMap) {
      let v = changeMap[k]
      outputs.push({
        assets: k,
        amount: v,
        address: changeAddress
      })
    }
    return outputs
  }
  /**
   * Construct raw transaction object.
   * @param params Parameters to construct a raw transaction object.
   * @return Transaction id
   */
  public async generateRawTransaction(params: GenerateRawTransactionParams) {

    let {
      from,
      to,
      asset = DefaultAsset,
      fee,
      gasLimit,
      contractType,
      data
    } = params

    let amount = new Bn(params.amount)


    if (!from) {
      throw new Error("From address is not specified")
    }
    if (!to) {
      throw new Error("To address is not specified")
    }

    let total = new Bn(0)
    let totalAmount = new Bn(0)

    totalAmount.add(amount)

    let changeMap: {
      [propName: string]: Bn
    } = {}
    let outputs: any[] = [{
      data: data,
      assets: asset,
      amount: amount,
      address: to,
      contractType: contractType
    }]

    let inputs = await this.pickUtxos(totalAmount, asset, from, 0)

    if (!inputs.length) {
      throw new Error("There is not enough UTXOs to set as transaction inputs.")
    }

    inputs.forEach(i => {
      total.add(i.amount)
    })

    if (total.lt(totalAmount)) {
      throw new Error("There is not enough UTXOs to set as transaction inputs.")
    }

    let _outputs = outputs.concat(this.generateChangeOutputs(inputs, from, amount, asset))

    //estimate gas
    let tx = new Transaction({
      inputs: inputs,
      outputs: _outputs,
      gasLimit: 0
    })
    if (!gasLimit) {
      gasLimit = await this.estimateGas(tx, inputs)
    }

    fee = await this.estimateFee(gasLimit, fee)

    let originInputsAmount = inputs.length
    let originOutputsAmount = outputs.length

    if (fee.asset == asset) {
      totalAmount.add(fee.amount)
      //TODO bignumber
      //totalAmount = totalAmount + fee.amount
    }
    inputs = await this.pickUtxos(totalAmount, asset, from, 0)

    let feeAmount = new Bn(fee.amount)

    if (fee.asset !== asset && !feeAmount.eq(0)) {

      let feeInputs = await this.pickFeeUtxos(feeAmount, fee.asset, from)
      inputs = inputs.concat(feeInputs)
    }

    outputs = outputs.concat(this.generateChangeOutputs(inputs, from, amount, asset, fee))


    gasLimit += txHelper.estimateIncreasedGas(inputs.length - originInputsAmount, outputs.length - originOutputsAmount)

    tx = new Transaction({
      inputs: inputs,
      outputs: outputs,
      gasLimit: gasLimit
    })
    return tx
  }

  /**
   * Construct vote transaction object.
   * @param params Parameters to construct a vote transaction object.
   * @return Transaction id
   */
  public async generateVoteTransaction(params: GenerateVoteTransactionParams) {

    let {
      from,
      to,
      asset = DefaultAsset,
      fee,
      gasLimit,
      contractType,
      data,
      voteId
    } = params

    let amount = new Bn(params.amount)
    let voteValue = new Bn(params.voteValue)
    let total = new Bn(0)
    let changeMap: {
      [propName: string]: Bn
    } = {}
    let outputs: any[] = [{
      data: data,
      assets: asset,
      amount: new Bn(0),
      address: to,
      contractType: contractType
    }]

    if (!from) {

      throw new Error("From address is not specified")
    }
    if (!to) {
      throw new Error("To address is not specified")
    }

    let inputs: any[] = []

    inputs = await this.pickVoteUtxos(voteValue, asset, from)

    let totalVote = new Bn(0)
    let temp: any[] = []
    inputs.forEach(i => {
      let noVote = false
      if (i.locks) {

        i.locks.forEach(lock => {
          let {
            lockAddress,
            id
          } = txHelper.parseLockId(lock.id)

          if (lockAddress == to && id == voteId) {
            if (lock.amount < i.amount) {
              totalVote.add(i.amount)
              totalVote.sub(lock.amount)
              temp.push(i)
            } else {
              noVote = true
            }
          }
        })
      }

      if (!noVote) {
        totalVote.add(i.amount)
        temp.push(i)
      }
    })

    inputs = temp

    if (!inputs.length) {
      throw new Error("There are not enough UTXOs to vote.")
    }
    //concat change ouputs
    let _outputs = outputs.concat(this.generateChangeOutputs(inputs, from, new Bn(0), asset))

    //estimate gas
    let tx = new Transaction({
      inputs: inputs,
      outputs: _outputs,
      gasLimit: 0
    })

    if (!gasLimit) {
      gasLimit = await this.estimateGas(tx, inputs)
    }


    // estimate fee from gas limit
    fee = await this.estimateFee(gasLimit, fee)

    let originInputsAmount = inputs.length
    let originOutputsAmount = outputs.length


    let feeAmount = new Bn(fee.amount)

    if (fee.asset !== asset && feeAmount.eq(0)) {
      let feeInputs = await this.pickFeeUtxos(feeAmount, fee.asset, from)
      inputs = inputs.concat(feeInputs)
    } else if (totalVote.lte(fee.amount)) {
      throw new Error("There are not enough UTXOs to vote.")
    }

    outputs = outputs.concat(this.generateChangeOutputs(inputs, from, new Bn(0), asset, fee))


    gasLimit += txHelper.estimateIncreasedGas(inputs.length - originInputsAmount, outputs.length - originOutputsAmount)

    tx = new Transaction({
      inputs: inputs,
      outputs: outputs,
      gasLimit: gasLimit
    })
    return tx
  }

  /**
   * Construct a normal transaction and send it on Asimov blockchain.
   * @param params Parameters to send a transaction on Asimov blockchain.
   * @return Transaction id
   */
  public async send(params: SendParams) {
    let {
      address,
      amount,
      asset = DefaultAsset,
      feeValue,
      feeType
    } = params

    if (!amount) {
      throw new Error("Can not transfer asset with 0 amount to " + address)
    }
    let fee = this.setting.fee

    if (feeValue && feeType) {
      fee = {
        amount: feeValue,
        asset: feeType
      }
    }

    let from = txHelper.getAddressByPrivateKey(this.privateKey)

    let txParams: GenerateRawTransactionParams = {
      from: from,
      to: address,
      amount: amount,
      asset: asset,
      fee: fee
    }

    let [err1, tx] = await to(this.generateRawTransaction(txParams))

    if (err1) {
      throw err1
    }

    let rawTx = tx.sign([this.privateKey]).toHex()

    let [err2, res] = await to(this.chainRpcProvider.sendRawTransaction(rawTx))

    if (err2) {
      throw err2
    }

    return res
  }

  /**
   * Check whether a transaction is confirmed on chain.
   * @param txId transaction id.
   * @return true or false
   */
  public async check(txId: string) {
    let [err, res] = await to(this.chainRpcProvider.getRawTransaction({
      txId: txId,
      verbose: true
    }))
    if (err) {
      throw err
    }
    let { confirmations } = res

    if (confirmations > 0) {
      return true
    } else {
      return false
    }
  }

  /**
   * Fetch transaction details.
   * @param txId transaction id.
   * @return Transaction details.
   */
  public async fetch(txId: string) {
    let [err, res] = await to(this.chainRpcProvider.getTransactionReceipt(txId))
    if (err) {
      throw err
    }
    return res
  }
}
