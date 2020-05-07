import { to } from 'await-to-js'
import { Fee } from './Transactions'
import { Setting } from './Setting'
import { ProviderFacadeArguments } from './providers/ProviderFacade'
import { ChainRpcProvider } from './providers/ChainRpcProvider'
import { AsiLinkProvider } from './providers/AsiLinkProvider'

import { TemplateWarehouse, CreateParams, DeployParams } from './TemplateWarehouse'
import { Compiler, Sources } from './contract/Compiler'
import { DefaultAsset, DefaultCategory } from './Constant'
import { Bn } from "./utils/Bn";
/**
 * Parameters used when submitting a template to Asimov blockchain
 */
export interface SubmitTemplateParams {
  /**
   * Source code file path.
   */
  path: string
  /**
   * Source code object.
   */
  source: string
  /**
   * Template name. It is unique in template warehouse on Asimov blockchain.
   */
  templateName: string
  /**
   * Contract object chosen to submit as template. It is possible to have more than one contract object after compiling a .sol file, we need to choose one as template.
   */
  contractName: string
  /**
   * Transaction fee. If not set, it defaults to DefaultFee in Constant.ts.
   */
  fee ? : Fee
  /**
   *  Imported files in the template. This is required when developing for web browser. Because in browser, the sdk can not import files without user permissions.
   */
  libs ? : Sources

  gasLimit ? : number
}

/**
 * Parameters used when deploying a contract instance from template
 */
export interface DeployContractParams {
  /**
   * Template id, which is returned after submitting a template on Asimov blockchain.
   */
  templateId: string
  /**
   * Constructor arguments which are used when deploying the contract instance.
   */
  constructorArguments: any[]
  /**
   * Transaction fee. If not set, it defaults to DefaultFee in Constant.ts.
   */
  fee ? : Fee
  /**
   * Amount of asset transferred to the contract when deploying. calculated in satoshi. The constructor of the contract must be payable.
   */
  amount ? : number | Bn | string | bigint
  /**
   * Type of asset transferred to the contract when deploying. The constructor of the contract must be payable.
   * hex format without 0x, such as "000000000000000200000001". If not set, it defaults to Asim ("000000000000000000000000").
   */
  asset ? : string

  gasLimit ? : number
}

/**
 * Configurations of Templates object.
 */
export interface TemplatesConfig {
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
 * High level Templates object used to submit new templates and deploy contract instances on Asimov blockchain.
 */
export class Templates {
  public setting: Setting = Setting.getInstance()
  public templateWarehouse: TemplateWarehouse
  private _chainRpcProvider: ChainRpcProvider
  private _asiLinkProvider: AsiLinkProvider
  private _compiler: Compiler
  private _privateKey: string = this.setting.privateKey

  /**
   * Constructor of Contracts
   * @param config configurations including ChainRPC provider and AsiLink provider
   */
  constructor(config: TemplatesConfig = {}) {
    this.chainRpcProvider = this.setting.chainRpcProvider
    this.asiLinkProvider = this.setting.asiLinkProvider

    if (config.chainRpcProvider) {
      this.chainRpcProvider = config.chainRpcProvider
    }
    if (config.asiLinkProvider) {
      this.asiLinkProvider = config.asiLinkProvider
    }

    this.templateWarehouse = new TemplateWarehouse({
      chainRpcProvider: this.chainRpcProvider,
      asiLinkProvider: this.asiLinkProvider
    })

    this.compiler = this.setting.compiler
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
   * getter of internal Complier object
   */
  public get compiler(): Compiler {
    return this._compiler
  }
  /**
   * setter of internal Complier object
   */
  public set compiler(compiler: Compiler) {
    this._compiler = compiler
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
   * Submit a template on Asimov blockchain.
   * @param params Parameters used to submit a template.
   * @return Transaction id/template id.
   */
  public async submitTemplate(params: SubmitTemplateParams) {

    if (!params.source && !params.path) {
      throw new Error('source file object or path is not specified!')
    }

    if (!params.templateName) {
      throw new Error('template name is not specified!')
    }
    if (!this.privateKey) {
      throw new Error('private key is not specified in setting!')
    }

    let compileResult, err
    if (params.path) {
      [err, compileResult] = await to(this.compiler.compileSol(params.source || params.path))
      if (err) {
        throw err
      }
    }

    if (params.source) {
      let sources = {}
      sources[params.templateName] = {
        content: params.source
      }
      if (!this.compiler) {
        throw new Error('compiler is not specified!')
      }
      this.compiler.setLibs(params.libs || {});
      [err, compileResult] = await to(this.compiler.compile(sources))
      if (err) {
        throw err
      }
    }

    let contracts = compileResult.contracts
    let source = compileResult.source
    let contract = contracts[params.contractName] || contracts[0]
    let byteCode = contract.evm.bytecode.object
    let abi = contract.abi

    let createParams: CreateParams = {
      category: DefaultCategory,
      name: params.templateName,
      bytecode: byteCode,
      abi: JSON.stringify(abi),
      source: source,
      privateKey: this.privateKey,
      fee: params.fee || this.setting.fee,
      gasLimit: params.gasLimit
    }
    let [err1, res] = await to(this.templateWarehouse.createTemplate(createParams))

    if (err1) {
      throw err1
    }

    return res
  }

  /**
   * Deploy a contract instance from a template on Asimov blockchain.
   * @param params Parameters used to deploy a contract instance.
   * @return Transaction id.
   */
  public async deployContract(params: DeployContractParams) {

    if (!this.privateKey) {
      throw new Error('private key is not specified in setting!')
    }

    let deployParams: DeployParams = {
      templateId: params.templateId,
      arguments: params.constructorArguments || [],
      privateKey: this.privateKey,
      amount: params.amount || 0,
      asset: params.asset || DefaultAsset,
      fee: params.fee || this.setting.fee,
      gasLimit: params.gasLimit
    }
    let [err, res] = await to(this.templateWarehouse.deploy(deployParams))

    if (err) {
      return err
    }
    return res
  }
}
