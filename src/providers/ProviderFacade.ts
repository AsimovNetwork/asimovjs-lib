import { AsiLinkProvider } from './AsiLinkProvider'
import { ChainRpcProvider } from './ChainRpcProvider'
import { AxiosRequestConfig } from "axios"

export interface ProviderFacadeArguments {
  asiLinkProvider ? : AsiLinkProvider
  chainRpcProvider ? : ChainRpcProvider
  asiLinkInfo ? : any
  chainRpcInfo ? : AxiosRequestConfig
}
export interface CallContractParams {
  to ? : string
  data: string
  type: string
  amount: number
  gasLimit: number
  privateKey ? : string
}

export class ProviderFacade {
  private _asiLinkProvider: AsiLinkProvider
  private _chainRpcProvider: ChainRpcProvider

  constructor(args: ProviderFacadeArguments={}) {

    if (typeof(window) !== 'undefined') {
      if (args.asiLinkProvider) {
        this.asiLinkProvider = args.asiLinkProvider
      } else {
        this.asiLinkProvider = new AsiLinkProvider()
      }
    }

    if (args.chainRpcProvider) {
      this.chainRpcProvider = args.chainRpcProvider
    } else if (args.chainRpcInfo) {
      this.chainRpcProvider = new ChainRpcProvider(args.chainRpcInfo)
    }

  }

  set chainRpcProvider(provider: ChainRpcProvider) {
    this._chainRpcProvider = provider
  }
  get chainRpcProvider() {
    return this._chainRpcProvider
  }

  set asiLinkProvider(provider: AsiLinkProvider) {
    this._asiLinkProvider = provider
  }

  get asiLinkProvider() {
    return this._asiLinkProvider
  }

}
