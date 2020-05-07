import * as txHelper from './utils/TxHelper'
import { ProviderFacade, ProviderFacadeArguments } from './providers/ProviderFacade'
import { CallContractData } from './providers/AsiLinkProvider'
import { SYSTEM_CONTRACT_ADDRESS, DefaultAsset, DefaultCategory } from './Constant'
import to from 'await-to-js'

/// TODO Reverse dependency, should be optimized
import { Transactions, Fee } from './Transactions'
import { Bn } from "./utils/Bn";

export interface CreateParams {
  category: number
  name: string
  bytecode: string
  abi: string
  source: string
  privateKey ? : string
  fee ? : Fee
  gasLimit ? : number
  data ? : string
}

export interface DeployParams {
  amount: number | Bn | string | bigint
  asset: string
  templateId ? : string
  category ? : number
  templateName ? : string
  arguments: any[]
  privateKey ? : string
  fee ? : Fee
  gasLimit?:number
}


export class TemplateWarehouse extends ProviderFacade {
  private warehouseAddress: string
  private warehouseAbiInfo: any
  private warehouseByteCode: string
  private createAbi: any
  private createAbiHash: string
  public initialized: boolean = false
  public transactions: Transactions
  constructor(public args: ProviderFacadeArguments) {
    super(args)
  }

  private async init() {

    if (!this.chainRpcProvider) {
      throw new Error('Can not init due to missing chain rpc provider')
    }

    let [err, res] = await to(this.chainRpcProvider.getGenesisContract(SYSTEM_CONTRACT_ADDRESS.TemplateWarehouse))

    if (err) {
      throw err
    }

    this.warehouseAddress = res.addressHex
    this.warehouseAbiInfo = JSON.parse(res.abiInfo);
    this.warehouseByteCode = res.code;

    for (let i = 0, len = this.warehouseAbiInfo.length; i < len; i++) {
      let a = this.warehouseAbiInfo[i];
      if (a.name == 'create') {
        this.createAbi = a;
        this.createAbiHash = txHelper.encodeFunctionId(a);
      }
    }
    this.initialized = true
    this.transactions = new Transactions(this.chainRpcProvider)
  }

  public async checkInit() {
    if (!this.initialized) {
      let [err, result] = await to(this.init())
      if (err) {
        throw err;
      }
    }
  }


  public async createTemplate(params: CreateParams) {

    await this.checkInit()

    const data = params.data || txHelper.generateCreateTemplateData(params.category, params.name, params.bytecode, params.abi, params.source)

    if (params.privateKey) {
      let from = txHelper.getAddressByPrivateKey(params.privateKey)

      let [err2, tx] = await to(this.transactions.generateRawTransaction({
        to: this.warehouseAddress,
        from: from,
        amount: 0,
        asset: DefaultAsset,
        fee: params.fee,
        gasLimit: params.gasLimit,
        contractType: "template",
        data: data
      }))
      if (err2) {
        throw err2
      }
      let rawTx = tx.sign([params.privateKey]).toHex()

      let [err3, res] = await to(this.chainRpcProvider.sendRawTransaction(rawTx))

      if (err3) {
        throw err3
      }

      return res
    } else {
      if (!this.asiLinkProvider) {
        throw new Error('Can not create template due to missing AsiLink provider')
      }

      if (!data) {
        throw new Error('Can not create template due to missing binary data');
      }

      let callParams: CallContractData = {
        to: this.warehouseAddress,
        data: data,
        type: 'template'
      }

      let [err, res] = await to(this.asiLinkProvider.callContract(callParams))
      if (err) {
        throw err
      }
      return res
    }
  }

  public async deploy(params: DeployParams) {

    await this.checkInit()

    if (!params.templateId && !params.templateName) {
      throw new Error('template id or template name is not specified')
    }

    // get template
    let res, err
    if (params.templateId) {
      [err, res] = await to(this.chainRpcProvider.getContractTemplateInfoByKey({
        key: params.templateId
      }))

    } else {
      [err, res] = await to(this.chainRpcProvider.getContractTemplateInfoByName({
        templateName: params.templateName,
        category: params.category || DefaultCategory
      }))
    }
    if (err) {
      throw err
    }

    let {
      abi,
      template_name,
      category,
    } = res

    let abiJson = JSON.parse(abi)
    let constructorABI: any = {};

    abiJson.forEach(i => {
      if (i.type == 'constructor') {
        constructorABI = i
      }
    })
    if (!constructorABI) {
      throw new Error('no constructor abi found');

    }
    if (constructorABI.inputs && (constructorABI.inputs.length !== params.arguments.length)) {
      throw new Error('input parameters length does not match the constructor arguments length!')
    }

    let data = txHelper.generateDeployContractData(category, template_name, constructorABI, params.arguments);

    //deploy contract
    if (params.privateKey) {

      let from = txHelper.getAddressByPrivateKey(params.privateKey)

      let [err2, tx] = await to(this.transactions.generateRawTransaction({
        to: from,
        from: from,
        amount: params.amount,
        asset: params.asset,
        fee: params.fee,
        gasLimit: params.gasLimit,
        contractType: "create",
        data: data
      }))
      if (err2) {
        throw err2
      }

      let rawTx = tx.sign([params.privateKey]).toHex()

      let [err3, res] = await to(this.chainRpcProvider.sendRawTransaction(rawTx))

      if (err3) {
        throw err3
      }

      return res

    } else {

      if (!this.asiLinkProvider) {
        throw new Error('can not deploy contract instance due to missing AsiLink provider')
      }

      if (!data) {
        throw new Error('can not deploy contract instance due to missing binary data');
      }

      let callParams: CallContractData = {
        amount: params.amount,
        data: data,
        type: 'create'
      }

      let [err, res] = await to(this.asiLinkProvider.callContract(callParams))
      if (err) {
        throw err
      }
      return res
    }
  }


  // TODO: whether private key should be passed in?
  public async create(params: CreateParams) {

    await this.checkInit()

    if (params.category == undefined) {
      throw new Error('Template category is undefined')
    }
    if (!params.name) {
      throw new Error('Template name is not specified')
    }
    if (!params.bytecode) {
      throw new Error('Template bytecode is not specified')
    }
    if (!params.abi) {
      throw new Error('Template abi is not specified')
    }
    if (!params.source) {

      throw new Error('Template source is not specified')
    }

    const data = txHelper.generateCreateTemplateData(params.category, params.name, params.bytecode, params.abi, params.source)

    // send transaction directly
    if (params.privateKey) {
      let address = txHelper.getAddressByPrivateKey(params.privateKey)

      let [err1, tx] = await to(this.transactions.generateRawTransaction({
        from: address,
        to: this.warehouseAddress,
        amount: 0,
        asset: DefaultAsset,
        fee: params.fee,
        data: data,
        contractType: "template",
        gasLimit: params.gasLimit
      }))

      if (err1) {
        throw err1
      }

      let rawTx = tx.sign([params.privateKey]).toHex()

      let [err2, res] = await to(this.chainRpcProvider.sendRawTransaction(rawTx))

      if (err2) {
        throw err2
      }

      return res

    } else {
      if (!this.asiLinkProvider) {
        throw new Error('can not create template due to missing AsiLink provider')
      }
      let callParams: CallContractData = {
        to: this.warehouseAddress,
        data: data,
        type: 'template'
      }

      let [err, res] = await to(this.asiLinkProvider.callContract(callParams))
      if (err) {
        throw err
      }
      return res
    }

  }

}
