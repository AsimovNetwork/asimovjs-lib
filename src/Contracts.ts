import { to } from 'await-to-js'
import { DefaultAsset } from './Constant'
import { Setting } from './Setting'
import { ContractConfig, ABIMethod, Contract, CallParams } from './contract/Contract'
import { ChainRpcProvider } from './providers/ChainRpcProvider'
import { AsiLinkProvider } from './providers/AsiLinkProvider'
import { Bn } from "./utils/Bn";
/**
 * Parameters to execute a method in contract.
 */
export interface ExecuteParams {
  /**
   * Contract address. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  address: string
  /**
   * Name of method to execute. e.g. "transfer(address,uint256)"
   */
  method: string
  /**
   * Arguments of method. e.g. ["0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5",8000000000]
   */
  args ? : any[]
  /**
   * Address of caller to execute method. The address must be setup in AsiLink. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  caller ? : string
  /**
   * Amount of asset transferred to contract when executing a payable method. calculated in satoshi (eg:2000000).
   */
  assetValue ? : number | Bn | string | bigint
  /**
   * Type of asset transferred to contract when executing a payable method. hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  assetType ? : string
  /**
   * Amount of transaction fee, calculated in satoshi (eg:2000000). If not set, it defaults to minimal transaction fee (21000 satoshis).
   */
  feeValue ? : number | Bn | string | bigint
  /**
   * Asset type of transaction fee. hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  feeType ? : string
  //TODO
  gasLimit ? : number
}
/**
 * Parameters to vote on a method in contract.
 */
export interface VoteParams {
  /**
   * Contract address. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  address: string
  /**
   * Name of method to vote. e.g. "vote(uint256,bool)"
   */
  method: string
  /**
   * Address of caller to vote. The address must be setup in AsiLink. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  caller ? : string
  /**
   * Arguments of vote method. e.g.[1,true]
   */
  args ? : any[]
  /**
   * Vote value. 0 means vote all values relate to a given asset type. If a specific value is set, SDK will compose UTXO inputs to get a vote value no less than the set value.
   */
  voteValue ? : number | Bn | string | bigint
  /**
   * Type of asset used to vote. hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  assetType ? : string
  /**
   * Amount of transaction fee, calculated in satoshi (eg:2000000). If not set, it defaults to minimal transaction fee (21000 satoshis).
   */
  feeValue ? : number | Bn | string | bigint
  /**
   * Asset type of transaction fee. hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  feeType ? : string
  //TODO
  gasLimit ? : number
}
/**
 * Parameters to call a readonly function in contract.
 */
export interface ReadParams {
  /**
   * Contract address. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  address: string
  /**
   * Name of the readonly method to call. e.g. "read(uint256)"
   */
  method: string
  /**
   * Arguments of readonly method. e.g. [800000]
   */
  args: any[]
  /**
   * Address of caller to call the readonly method. The address must be setup in AsiLink. e.g. "0x66ebf6475b128b6b3288a2b5830122b4aa7f0b19f5"
   */
  caller ? : string
}
/**
 * Configurations of Contracts object
 */
export interface ContractsConfig {
  /**
   * ChainRPC provider. It is required to make RPC call to chain node.
   */
  chainRpcProvider ? : ChainRpcProvider
  /**
   * AsiLink provider. It is required to invoke the AsiLink wallet.
   */
  asiLinkProvider ? : AsiLinkProvider
}

/**
 * Contracts object provides high level API for developers to interact with a contract on Asimov blockchain
 *
 * - execute a public/external write method
 * - call a readonly method (view/pure method)
 * - vote on a public/external method
 */
export class Contracts {
  public setting: Setting = Setting.getInstance()
  private _chainRpcProvider: ChainRpcProvider
  private _asiLinkProvider: AsiLinkProvider
  private _privateKey: string = this.setting.privateKey

  /**
   * Constructor of Contracts
   * @param config configurations including ChainRPC provider and AsiLink provider
   */
  constructor(config: ContractsConfig = {}) {
    this.chainRpcProvider = this.setting.chainRpcProvider
    this.asiLinkProvider = this.setting.asiLinkProvider
    if (config.chainRpcProvider) {
      this.chainRpcProvider = config.chainRpcProvider
    }
    if (config.asiLinkProvider) {
      this.asiLinkProvider = config.asiLinkProvider
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
   * getter of AsiLink provider
   */
  public get asiLinkProvider(): AsiLinkProvider {
    return this._asiLinkProvider
  }
  /**
   * setter of AsiLink provider. AsiLink provider is set when developing Web DApps.
   */
  public set asiLinkProvider(asilink: AsiLinkProvider) {
    this._asiLinkProvider = asilink
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
   * get internal Contract object.
   * @param address contract address.
   */
  private async getContract(address: string) {

    let [err1, templateInfo] = await to(this.chainRpcProvider.getContractTemplate(address))

    if (err1!) {
      throw err1
    }
    let {
      template_type,
      template_name
    } = templateInfo
    let [err2, template] = await to(this.chainRpcProvider.getContractTemplateInfoByName({
      category: template_type,
      templateName: template_name
    }))

    if (err2!) {
      throw err2
    }

    let abi: ABIMethod[] = JSON.parse(template.abi)

    try {
      abi = JSON.parse(template.abi)

    } catch (e) {
      throw e
    }

    let contractConfig: ContractConfig = {
      contractAddress: address,
      abi: abi,
      asiLinkProvider: this.asiLinkProvider,
      chainRpcProvider: this.chainRpcProvider
    }
    let contract = new Contract(contractConfig)

    return contract
  }

  /**
   * Execute a method in contract. returns transaction id.
   * @param params Parameters to execute contract method
   */
  public async execute(params: ExecuteParams): Promise < any > {

    let {
      address,
      method,
      args = [],
      assetValue = 0,
      assetType = DefaultAsset,
      feeValue,
      feeType,
      caller,
      gasLimit
    } = params

    if (!address) {
      throw new Error('Contract address is not provided')
    }

    if (!method) {
      throw new Error('Contract method is not provided')
    }

    let fee = this.setting.fee

    if (feeValue && feeType) {
      fee = {
        amount: feeValue,
        asset: feeType
      }
    }

    let [err, contract] = await to(this.getContract(address))


    if (err) {
      throw err
    }

    let callParams: CallParams = {
      methodName: method,
      args: args,
      amount: assetValue,
      asset: assetType,
      privateKey: this.privateKey,
      caller: caller,
      fee: fee,
      contractType: "call",
      gasLimit:gasLimit
    }

    let [err1, res] = await to(contract.call(callParams))

    if (err1) {
      throw err1
    }

    return res
  }

  /**
   * Vote on a method in contract. returns transaction id.
   * @param params Parameters to vote contract method.
   */
  public async vote(params: VoteParams): Promise < string > {
    let {
      address,
      method,
      args = [],
      voteValue = 0,
      assetType = DefaultAsset,
      feeValue,
      feeType,
      caller,
      gasLimit
    } = params


    if (!address) {
      throw new Error('Contract address is not provided')
    }

    if (!method) {
      throw new Error('Contract method is not provided')
    }

    let fee = this.setting.fee

    if (feeValue && feeType) {
      fee = {
        amount: feeValue,
        asset: feeType
      }
    }

    let [err, contract] = await to(this.getContract(address))

    if (err) {
      throw err
    }

    let callParams: CallParams = {
      methodName: method,
      args: args,
      amount: 0,
      voteValue: voteValue,
      voteId: args[0],
      asset: assetType,
      privateKey: this.privateKey,
      fee: fee,
      caller: caller,
      contractType: "vote",
      gasLimit:gasLimit
    }

    let [err1, res] = await to(contract.call(callParams))

    if (err1) {
      throw err1
    }
    return res
  }

  /**
   * Call a readonly method in contract
   * @param params Parameters to call a readonly method.
   * @return Return value of the called method.
   */
  public async read(params: ReadParams): Promise < any > {

    let {
      address,
      method,
      args = [],
      caller
    } = params

    if (!address) {
      throw new Error('Contract address is not provided')
    }

    if (!method) {
      throw new Error('Contract method is not provided')
    }

    let [err, contract] = await to(this.getContract(address))

    if (err) {
      throw err
    }

    if (!contract.isReadOnlyMethod(method, args)) {
      throw new Error(method + " is not a view or pure method")
    }

    let callParams: CallParams = {
      methodName: method,
      args: args,
      privateKey: this.privateKey,
      caller: caller
    }

    let [err1, res] = await to(contract.call(callParams))

    if (err1) {
      throw err1
    }

    return res

  }

}
