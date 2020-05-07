import { Bn } from '../utils/Bn'


export interface CallContractData {
  // binary data to execute in virtual machine
  data: string
  // contract address to call
  to ? : string
  // type of contract call, can be "create", "call", "vote" and "template"
  type: string
  // caller address
  from ? : string
  // amount of Asim to transfer in the contract call
  amount ? : number | Bn | string | bigint
  // message to sign by the private key stored in AsiLink
  toSignMessage ? : string
  // whether to broadcast the transaction from AsiLink
  broadcast ? : boolean
}

// TODO: still necessary?
export interface ReadContractData {
  // caller address
  callerAddress: string
  // contract address
  contractAddress: string
  // method name
  name: string
  // method abi string
  abi: string
  // binary data to execute in virtual machine
  data: string
}

export interface AsiLinkMessageRequest {
  type: string
  id ? : number
  data ? : CallContractData | any
}

export interface AsiLinkMessageResponse {
  result: any
  type: string
  id: number
}

export interface SignTransactionData {
  inputs: any
  outputs: any
  gasLimit: number
}

function listenMessage(eventName: string): Promise < any > {

  return new Promise((resolve, reject) => {
    let callback = (event: any) => {

      if (event.source != window) {
        window.removeEventListener('message', callback, false)
        return
      }

      let data: AsiLinkMessageResponse = event.data;

      if (data.type == eventName) {

        let result = data.result;

        if (result.success) {
          resolve(result.data);
        } else {
          reject(result.msg);
        }
        window.removeEventListener('message', callback, false)
      }

    };
    window.addEventListener('message', callback);
  })
}
/**
 * data:{
 * type
 * result:{
 *   msg
 *   success
 *   data
 *   }
 * }
 */
function sendMessage(data: AsiLinkMessageRequest): Promise < any > {

  let dom

  try {
    dom = document.getElementById(AsiDOM);
  } catch (e) {
    throw new Error('AsiLink provider should run in browser environment')
  }

  if (!!!dom) {
    throw new Error('Please install AsiLink and refresh browser')
  }

  return new Promise((resolve, reject) => {

    let type = data.type;

    if (!data.type) {
      reject('no request type');
    }

    if (!!!dom) {
      reject('Please install AsiLink and refresh browser')
    }

    let resType = data.type.replace('GET_', 'POST_')

    let id = new Date().getTime();
    if (!data.id) {
      data.id = id;
    }


    let callback = (event: any) => {

      if (event.source != window) {
        window.removeEventListener('message', callback, false)
        return
      }

      let data: AsiLinkMessageResponse = event.data;

      if (data.type == resType && data.id == id) {

        let result = data.result;

        if (result.success) {
          resolve(result.data);
        } else {
          reject(result.msg);
        }
        window.removeEventListener('message', callback, false)
      }

    };

    window.addEventListener('message', callback);
    window.postMessage(data, '*');
  })

}


const AsiDOM = 'flowmask_extension_dom'

export class AsiLinkProvider {

  constructor() {
    // TODO check if AsiLink is installed
  }

  public callContract(data: CallContractData): Promise < any > {
    if(data.amount instanceof Bn){
      data.amount = data.amount.toString()
    }
    return sendMessage({
      type: 'GET_ContractSend',
      data: data
    })

  }

  public readContract(data: ReadContractData): Promise < any > {
    return sendMessage({
      type: "GET_ContractRead",
      data: data
    })
  }

  public SignTransaction(data: SignTransactionData): Promise < any > {
    return sendMessage({
      type: "GET_SignTransaction",
      data: data
    })
  }


  public getAuthorAddress(licenseString: string) {
    return sendMessage({
      type: 'GET_FlowMask_Address',
      data: {
        fromName: licenseString
      }
    })

  }

  public watchLogout() {
    return listenMessage("listenMessage")
  }

  public signMessage(text: string) {

    return sendMessage({
      type: 'GET_Signature',
      data: {
        toSignMessage: text
      }
    })

  }

  static SendTransaction() {

  }
}
