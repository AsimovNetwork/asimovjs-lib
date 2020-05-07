import { Fee } from './Transactions'
import { DefaultAsset, DefaultFee } from './Constant'
import { AsiLinkProvider } from './providers/AsiLinkProvider'
import { ChainRpcProvider } from './providers/ChainRpcProvider'
import { Compiler } from './contract/Compiler'
import { FileManager } from './contract/FileManager'
import { Bn } from './utils/Bn'
let Module = require('./compiler/asimov.js')

/**
 * Configs in high level Setting object in SDK
 */
export interface SettingConfig {
  /**
   * rpc service url.
   * @type {[type]}
   */
  url ? : string
  /**
   * AsiLink bundleId.
   * @type {[type]}
   */
  bundleId ? : string
  /**
   * Solidity compiler.
   */
  compiler ? : Compiler
  /**
   * Global private key to sign transactions.
   */
  privateKey ? : string
  /**
   * Global transaction fee. If not set, it defaults to DefaultFee in Constant.ts.
   */
  fee ? : Fee
  /**
   * Url of remote solidity compiler.
   */
  remoteCompiler ? : string
}

/**
 * default remote compiler url
 */
const DefaultRemoteCompiler = 'https://cdn.asimov.work/asimov.js'

/**
 * High level Setting object. It is referenced by other high level objects including Templates, Contracts and Transactions.
 */
export class Setting {
  private static _instance: Setting = new Setting()
  public privateKey: string
  public bundleId: string
  public fee: Fee
  public chainRpcProvider: ChainRpcProvider
  public asiLinkProvider: AsiLinkProvider
  public compiler: Compiler
  constructor(config ? : SettingConfig) {
    if (config) {
      Setting._instance.init(config)
    }
    return Setting._instance
  }
  /**
   * Get global Setting singleton.
   */
  public static getInstance() {
    return this._instance;
  }
  /**
   * Initialize Setting object.
   * @param config Parameters to use when initializing Setting object.
   */
  public async init(config: SettingConfig = {}) {
    this.setPrivateKey(config.privateKey)

    if (config.compiler) {
      this.setSolidityCompiler(config.compiler)
    }
    if (config.bundleId) {
      this.setAsiLink(config.bundleId)
    }

    if (config.url) {
      this.setRpcServer(config.url)
    }
    if (config.fee) {
      this.setTransactionFee(config.fee.amount, config.fee.asset)
    }

    if (config.remoteCompiler) {
      Module = await FileManager.importRemoteScript(config.remoteCompiler)
      this.setSolidityCompiler(new Compiler(Module))
    } else if (!this.compiler) {
      if (!Module) {
        Module = await FileManager.importRemoteScript(DefaultRemoteCompiler)
      }
      this.setSolidityCompiler(new Compiler(Module))
    }

    this.asiLinkProvider = new AsiLinkProvider()
  }
  /**
   * Set solidity compiler.
   * @param compiler the Compiler object.
   */
  public setSolidityCompiler(compiler: Compiler) {
    this.compiler = compiler
  }
  /**
   * Set global private key.
   * @param privateKey the private key.
   */
  public setPrivateKey(privateKey: string) {
    this.privateKey = privateKey
  }
  /**
   * Set AsiLink bundle Id.
   * @param bundleId AsiLink bundle Id.
   */
  public setAsiLink(bundleId: string) {
    this.bundleId = bundleId
  }
  /**
   * Set global default transaction fee. If not set, it defaults to DefaultFee in Constant.ts.
   * @param assetValue asset value, calculated in satoshi.
   * @param assetType asset type, 12 byte hex format such as "000000000000000200000001".
   */
  public setTransactionFee(assetValue: string | number | bigint | Bn = 0, assetType: string = DefaultAsset) {
    let fee: Fee = {
      amount: assetValue,
      asset: assetType
    }
    this.fee = fee
  }
  /**
   * Set rpc url for ChainRPC provider.
   * @param {string} url [description]
   */
  public setRpcServer(url: string) {
    this.chainRpcProvider = new ChainRpcProvider({
      baseURL: url
    })
  }
  /**
   * Get global private key.
   */
  public static GetPrivateKey() {
    return Setting.getInstance().privateKey
  }

}
