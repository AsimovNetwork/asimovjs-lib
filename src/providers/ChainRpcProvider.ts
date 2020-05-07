import { JsonRpcProvider } from "./JsonRpcProvider"
import { BigNumber } from "../utils/BigNumber"
import { AxiosRequestConfig } from "axios"
import { MinGasLimit } from '../Constant'

//Interface params
/**
 * AxiosRequestConfig is the interface exported from axios,the full parameters
 *  is showed below:
 * interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  transformRequest?: AxiosTransformer | AxiosTransformer[];
  transformResponse?: AxiosTransformer | AxiosTransformer[];
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | false;
  cancelToken?: CancelToken;
}
 */

export interface GetBlockParams {
  blockHash: string
  verbose ? : boolean
  verboseTx ? : boolean
}

export interface GetBlockHeaderParams {
  blockHash: string
  verbose ? : boolean
}

export interface GetBlockListParams {
  start: number
  offset: number
  vinExtra ? : boolean
  startTime: number
  endTime: number
}

export interface GetBlockListByHeightParams {
  start: number
  offset: number
}

export interface GetUtxoByAddressParams {
  addresses: string[]
  asset ? : string
}

export interface RpcInput {
  txid: string
  vout: number
  assets: string
  scriptpubkey: string
}

export interface RpcOutput {
  amount: number
  assets: string
  address: string
  data: string
  contractType: string
}

export interface CreateRawTransactionParams {
  txType: number
  inputs: RpcInput[]
  outputs: RpcOutput[]
  lockTime: number
}

export interface CalculateContractAddressParams {
  inputs: RpcInput[]
  outputs: RpcOutput[]
}

export interface CallReadOnlyFunctionParams {
  callerAddress: string
  contractAddress: string
  data: string
  name: string
  abi: string
}

export interface GetRawTransactionParams {
  txId: string
  verbose ? : boolean
  vinExtra ? : boolean
}

export interface GetVirtualTransactionsParams {
  blockHash: string
  verbose ? : boolean
  vinExtra ? : boolean
}

export interface SearchRawTransactionsParams {
  address: string
  verbose ? : boolean
  start: number
  offset: number
  vinExtra ? : boolean
  reverse ? : boolean
  filterAddress: string[]
}

export interface SearchAllRawTransactionsParams {
  addresses: string[]
  verbose ? : boolean
  vinExtra ? : boolean
  reverse ? : boolean
}

export interface GetTransactionsByAddressesParams {
  addresses: string[]
  start: number
  offset: number
}

export interface TestParams {
  caller: string
  byteCode: string
  args: string
  callData: any[]
  abi: string
}

export interface GetContractTemplateInfoByNameParams {
  category: number
  templateName: string
}
export interface GetContractTemplateInfoByKeyParams {
  key: string
}

export interface GetContractTemplateListParams {
  category: number
  page: number
  pageSize: number
}

export interface GetUtxoInPageParams {
  address: string
  asset: string
  from: number
  count: number
}

export interface EstimateGasParams {
  caller: string
  contractAddress: string
  amount: number
  asset: string
  data: string
  callType: string
  voteValue ? : number
}

export interface RunTransactionParams{
  hex:string
  utxos:RpcInput[]
}

// Chain Rpc Provider
export class ChainRpcProvider extends JsonRpcProvider {
  constructor(public config: AxiosRequestConfig) {
    super(config)
  }

  public GetBlockChainInfo(): Promise < any > {
    return this.send('GetBlockChainInfo')
  }

  public getBlockHash(blockHeight: number): Promise < any > {
    return this.send('getBlockHash', { blockHeight: blockHeight })
  }
  public upTime(): Promise < any > {
    return this.send('upTime')
  }
  public getBestBlock(): Promise < any > {
    return this.send('getBestBlock')
  }
  public getBlock(params: GetBlockParams): Promise < any > {
    return this.send('getBlock', params)
  }
  public getBlockHeader(params: GetBlockHeaderParams): Promise < any > {
    return this.send('getBlockHeader', params)
  }

  public getBalance(address: string): Promise < any > {
    return this.send('getBalance', { address: address })
  }
  public getBalances(addresses: string[]): Promise < any > {
    return this.send('getBalances', { addresses: addresses })
  }

  public getBlockList(params: GetBlockListParams): Promise < any > {
    return this.send('getBlockList', params)
  }

  public getBlockListByHeight(params: GetBlockListByHeightParams): Promise < any > {
    return this.send('getBlockListByHeight', params)
  }

  public getUtxoByAddress(params: GetUtxoByAddressParams): Promise < any > {
    return new Promise((resolve, reject) => {
      this.send('getUtxoByAddress', params).then(res => {
        resolve(res)
      }).catch(e => {
        reject(e)
      })
    })
  }

  public getUtxoInPage(params: GetUtxoInPageParams): Promise < any > {
    return new Promise((resolve, reject) => {
      this.send('getUtxoInPage', params).then(res => {
        resolve(res)
      }).catch(e => {
        reject(e)
      })
    })
  }

  public getGenesisContractNames(): Promise < any > {
    return this.send('getGenesisContractNames')
  }

  public getConnectionCount(): Promise < any > {
    return this.send('getConnectionCount')
  }

  public getInfo(): Promise < any > {
    return this.send('getInfo')
  }

  public getNetTotals(): Promise < any > {
    return this.send('getNetTotals')
  }

  public createRawTransaction(params: CreateRawTransactionParams): Promise < any > {
    return this.send('createRawTransaction', params)
  }

  public decodeRawTransaction(txHex: string): Promise < any > {
    return this.send('decodeRawTransaction', {
      txHex: txHex
    })
  }

  public calculateContractAddress(params: CalculateContractAddressParams): Promise < any > {
    return this.send('calculateContractAddress', params)
  }

  public decodeScript(hexScript: string): Promise < any > {
    return this.send('decodeScript', {
      hexScript: hexScript
    })
  }

  public getGenesisContract(contractAddress: string): Promise < any > {
    return this.send('getGenesisContract', {
      contractAddress: contractAddress
    })
  }

  public getContractAddressesByAssets(assets: string[]): Promise < any > {
    return this.send('getContractAddressesByAssets', {
      assets: assets
    })
  }

  public getContractTemplateList(params: GetContractTemplateListParams): Promise < any > {
    return this.send('getContractTemplateList', {
      approved: true,
      category: params.category,
      page: params.page,
      pageSize: params.pageSize
    })
  }

  public getContractTemplateName(contractAddress: string): Promise < any > {
    return this.send('getContractTemplateName', {
      contractAddress: contractAddress
    })
  }

  public getContractTemplate(contractAddress: string): Promise < any > {
    return this.send('getContractTemplate', {
      contractAddress: contractAddress
    })
  }

  public getMPosCfg(): Promise < any > {
    return this.send('getMPosCfg')
  }

  public callReadOnlyFunction(params: CallReadOnlyFunctionParams): Promise < any > {
    return this.send('callReadOnlyFunction', params)
  }

  public getRawTransaction(params: GetRawTransactionParams): Promise < any > {
    return this.send('getRawTransaction', params)
  }

  public getVirtualTransactions(params: GetVirtualTransactionsParams): Promise < any > {
    return this.send('getVirtualTransactions', params)
  }

  public getTransactionReceipt(txId: string): Promise < any > {
    return this.send('getTransactionReceipt', {
      txId: txId
    })
  }

  public sendRawTransaction(rawTx: string): Promise < any > {
    return this.send('sendRawTransaction', {
      rawTx: rawTx
    })
  }

  public searchRawTransactions(params: SearchRawTransactionsParams): Promise < any > {
    return this.send('searchRawTransactions', params)
  }

  public searchAllRawTransactions(params: SearchAllRawTransactionsParams): Promise < any > {
    return this.send('searchAllRawTransactions', params)
  }

  public getTransactionsByAddresses(params: GetTransactionsByAddressesParams): Promise < any > {
    return this.send('getTransactionsByAddresses', params)
  }

  public getMempoolTransactions(txIds: string[] = []): Promise < any > {
    return this.send('getMempoolTransactions', {
      txIds: txIds
    })
  }

  public notifyNewTransactions(): Promise < any > {
    return this.send('notifyNewTransactions')
  }

  public test(params: TestParams): Promise < any > {
    return this.send('test', params)
  }

  public getContractTemplateInfoByName(params: GetContractTemplateInfoByNameParams): Promise < any > {
    return this.send('getContractTemplateInfoByName', params)
  }

  public getContractTemplateInfoByKey(params: GetContractTemplateInfoByKeyParams): Promise < any > {
    return this.send('getContractTemplateInfoByKey', params)
  }

  public estimateGas(params: EstimateGasParams): Promise < any > {
    return new Promise((resolve, reject) => {
      this.send('estimateGas', params).then(res => {
        if (res <= MinGasLimit) {
          resolve(MinGasLimit)
        } else {
          resolve(res)
        }
      }).catch(e => {
        reject(e)
      })
    })
  }

  public runTransaction(params:RunTransactionParams):Promise<any>{
    return this.send('runTransaction',params)
  }

}
