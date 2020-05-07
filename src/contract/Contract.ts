import * as txHelper from '../utils/TxHelper'
import { MethodType, GasAmplifier } from '../Constant'
import { BigNumber } from '../utils/BigNumber'
import { ProviderFacade, ProviderFacadeArguments } from '../providers/ProviderFacade'
import { AsiLinkProvider, CallContractData } from '../providers/AsiLinkProvider'
import { ChainRpcProvider, CallReadOnlyFunctionParams, EstimateGasParams } from '../providers/ChainRpcProvider'
import { AbiCoder } from '../utils/AbiCoder'
import { Transaction } from '../transaction/Transaction'
import { Bn } from "../utils/Bn";
/// TODO Reverse dependency, should be optimized
import {
  Transactions,
  Fee,
  GenerateVoteTransactionParams,
  GenerateRawTransactionParams
} from '../Transactions'
import to from 'await-to-js'

export interface ABIInput {
  name: string
  type: string
  indexed: boolean
}

export interface ABIOutput {
  name: string
  type: string
  indexed: boolean
}

export interface ABIMethod {
  name ? : string
  type: string
  payable: boolean
  inputs: ABIInput[]
  outputs: ABIOutput[]
  constant: boolean
  anonymous: boolean
  stateMutability: string
}

export interface ContractConfig {
  abi ? : ABIMethod[]
  byteCode ? : string
  contractAddress ? : string
  asiLinkProvider ? : AsiLinkProvider
  chainRpcProvider ? : ChainRpcProvider
}

export interface CallParams {
  methodName: string
  args ? : any[]
  caller ? : string
  amount ? : number | Bn | string | bigint
  asset ? : string
  toSignMessage ? : string
  //call from native
  privateKey ? : string
  gasLimit ? : number
  fee ? : Fee
  contractType ? : string
  voteValue ? : number | Bn | string | bigint
  voteId ? : number
}


export interface MethodCall {
  name: string
  args: any[]
  caller ? : string
  amount ? : number | Bn | string | bigint
  asset ? : string
  voteValue ? : number | Bn | string | bigint
}

export interface PreCallParams {
  methods: MethodCall[]
  constructorArgs ? : any[]
  caller ? : string
}

export class Contract extends ProviderFacade {
  private methodABIs: {
    [key: string]: ABIMethod
  } = {};

  private eventABIs: {
    [key: string]: ABIMethod
  } = {};

  private byteCode: string
  private contractAddress: string
  private constructorABI: ABIMethod
  public transactions: Transactions
  public abi: any[]
  public abiString: string

  constructor(public args: ContractConfig = {}) {
    super({
      asiLinkProvider: args.asiLinkProvider,
      chainRpcProvider: args.chainRpcProvider
    })
    if (!args.abi) {
      throw new Error("No abi provided")
    }

    const keyCollisions: Set < string > = new Set()

    for (const method of args.abi) {
      if (method.type == "constructor") {
        this.constructorABI = method
        continue
      }
      if (method.type !== "function") {
        continue
      }

      const key = `${method.name}#${method.inputs.length}`

      const sig = `${method.name}(${method.inputs.map((input) => input.type).join(",")})`

      if (this.methodABIs[key]) {
        // Detected ambiguity for this arity. User must use method signature
        // to select the method.
        keyCollisions.add(key)

      } else {
        this.methodABIs[key] = method
      }

      this.methodABIs[sig] = method
    }

    for (const key of keyCollisions) {
      delete this.methodABIs[key]
    }
    this.byteCode = args.byteCode
    this.contractAddress = args.contractAddress
    this.abi = args.abi
    this.abiString = JSON.stringify(args.abi)

    this.chainRpcProvider = args.chainRpcProvider
    this.asiLinkProvider = args.asiLinkProvider
    this.transactions = new Transactions(this.chainRpcProvider)
  }

  private isReadOnlyMethodABI(methodABI: ABIMethod): boolean {
    let type = methodABI.stateMutability
    if (type == MethodType.View || type == MethodType.Pure) {
      return true
    }
    return false
  }
  public isReadOnlyMethod(methodName: string, args: any[]): boolean {
    let methodABI = this.findMethodABI(methodName, args)
    return this.isReadOnlyMethodABI(methodABI)
  }

  /**
   * *
   * @param  {string}     selector [description]
   * @param  {any[]   =        []}          args [description]
   * @return {ABIMethod}          [description]
   *
   *     Solidity allows method name overloading. If there's no ambiguity, allow
   * the name of the method as selector. If there is ambiguity (same number
   * of arguments, different types), must use the method signature.
   *
   * Example:
   *
   *   foo(uint a, uint b)
   *
   *   The method name is `foo`.
   *   The method signature is `foo(uint, uint)`
   */
  public findMethodABI(selector: string, args: any[] = []): ABIMethod | undefined {
    // Find method by method signature
    const method = this.methodABIs[selector]
    if (method) {
      return method
    }
    // Find method by method name
    const key = `${selector}#${args.length}`

    return this.methodABIs[key]

  }

  /**
   * call a contract method
   *
   * @param params Parameters to call a contract method
   */
  public async call(params: CallParams): Promise < any > {

    if (!this.contractAddress) {
      throw new Error("No contract address provided")
    }

    let methodName = params.methodName
    let args = params.args
    let methodABI = this.findMethodABI(methodName, args);
    let data = txHelper.encodeCallData(methodABI, args)
    let amount: any = params.amount || 0
    let asset = params.asset
    let toSignMessage = params.toSignMessage

    let from = params.caller || txHelper.getAddressByPrivateKey(params.privateKey)

    if (this.isReadOnlyMethodABI(methodABI)) {
      let readyOnlyParams: CallReadOnlyFunctionParams = {
        callerAddress: from,
        contractAddress: this.contractAddress,
        data: data,
        name: methodName,
        abi: this.abiString
      }

      if (this.chainRpcProvider) {
        if (!readyOnlyParams.callerAddress) {
          throw new Error('Caller is missing')
        }
        return this.chainRpcProvider.callReadOnlyFunction(readyOnlyParams)

      } else {
        if (!this.asiLinkProvider) {
          throw new Error('AsiLink provider is not setup')
        }
        return this.asiLinkProvider.readContract(readyOnlyParams)
      }

    } else if (params.privateKey) {

      if (!this.chainRpcProvider) {
        throw new Error('Chain RPC provider is not setup')
      }
      let tx, err
      // differentiate vote call and normal call
      if (params.contractType == "vote") {
        let voteParams: GenerateVoteTransactionParams = {
          from: from,
          to: this.contractAddress,
          amount: 0,
          voteId: params.voteId,
          voteValue: params.voteValue,
          asset: params.asset,
          fee: params.fee,
          contractType: params.contractType,
          gasLimit: params.gasLimit,
          data: data
        };

        [err, tx] = await to(this.transactions.generateVoteTransaction(voteParams))
        if (err) {
          throw err
        }
      } else {

        let txParams: GenerateRawTransactionParams = {
          from: from,
          to: this.contractAddress,
          amount: params.amount,
          asset: params.asset,
          fee: params.fee,
          contractType: params.contractType,
          gasLimit: params.gasLimit,
          data: data
        };

        [err, tx] = await to(this.transactions.generateRawTransaction(txParams))
        if (err) {
          throw err
        }
      }

      let rawTx = tx.sign([params.privateKey]).toHex()

      let [err4, res] = await to(this.chainRpcProvider.sendRawTransaction(rawTx))

      if (err4) {
        throw err4
      }

      return res

    } else {
      if (!this.asiLinkProvider) {
        throw new Error('AsiLink provider is not setup')
      }
      let callParams: CallContractData = {
        to: this.contractAddress,
        data: data,
        amount: amount,
        from: from,
        toSignMessage: toSignMessage,
        type: params.contractType
      }

      return this.asiLinkProvider.callContract(callParams)
    }
  }

  public async preCall(params: PreCallParams): Promise < any > {
    let constructorArgs = params.constructorArgs || []
    let bytecode = this.byteCode
    let abi = this.abiString
    let caller = params.caller
    let callData = [];
    let constructorArgsStr = '';

    if (!(params.methods && params.methods.length)) {
      throw new Error("Method is not provided")
    }

    if (!caller) {
      throw new Error("Caller is missing")
    }

    if (!this.chainRpcProvider) {
      throw new Error("Chain RPC provider is not setup")
    }

    if (this.constructorABI) {
      let coder = new AbiCoder()
      constructorArgsStr = coder.encode(this.constructorABI.inputs, constructorArgs)
    }

    params.methods.forEach((method, idx) => {
      let args = method.args || [];
      let methodName = method.name;
      let methodABI = this.findMethodABI(methodName, args)

      if (!methodABI) {
        throw new Error("No method ABI found of " + methodName)
      }
      let data = txHelper.encodeCallData(methodABI, args)

      callData.push({
        name: methodName,
        data: data,
        caller: method.caller,
        amount: method.amount,
        args: method.args,
        voteValue: method.voteValue
      })
    });

    return this.chainRpcProvider.test({
      caller: caller,
      byteCode: bytecode,
      args: constructorArgsStr,
      callData: callData,
      abi: abi
    })

  }
}
